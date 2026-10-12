// "Type what you ate": turns text like "200g rice and 100g chicken breast, 2 samoon"
// (English, Arabic or Badini) into foods with amounts. Nothing is added here;
// the app shows the result for the user to check first.

import { normalize } from './search.js';
import { gramsFor, nutritionFor } from './calc.js';
import { UNIT_NAMES } from '../i18n/strings.js';

const MAX_CANDIDATES = 6;
const MAX_GRAMS = 5000;
const MAX_PORTIONS = 50;
const ALIAS_SCORE = 99; // beats partial matches, but not a food's exact full name

// ---------- words ----------

const NUMBER_WORDS = {
  1: 'one a an واحد واحدة وحدة ئێک یەک ئێکی',
  2: 'two couple اثنين اثنان ثنين دوو',
  3: 'three ثلاث ثلاثة سێ',
  4: 'four اربع اربعة أربع أربعة چار',
  5: 'five خمس خمسة پێنج',
  6: 'six ست ستة شەش',
  0.5: 'half نص نصف نیڤ',
  0.25: 'quarter ربع چارەک',
};

const UNIT_ALIASES = {
  g: 'g gr grs gram grams gramme غ غم غرام غرامات جرام گم گرام گر',
  kg: 'kg kilo kilos kilogram كيلو كغم کیلۆ کگم',
  l: 'l litre liter litres liters لتر ليتر لیتر',
  ml: 'ml مل ملل',
  plate: 'plate plates dish صحن صحون ماعون قاپ',
  piece: 'piece pieces pc pcs قطعة قطع حبة حبات دانە دانک پارچە',
  cup: 'cup cups كوب اكواب کوپ',
  glass: 'glass glasses قدح گلاس پەرداخ',
  teaGlass: 'istikan estikan استكان استكانات ئیستکان ستکان',
  bowl: 'bowl bowls طاسة زبدية كاسة کاسە',
  tbsp: 'tbsp tablespoon tablespoons spoon spoons ملعقة ملاعق کەڤچی کەڤچیک',
  tsp: 'tsp teaspoon teaspoons',
  slice: 'slice slices شريحة شرائح شریحە',
  skewer: 'skewer skewers سيخ اسياخ شيش شیش',
  sandwich: 'sandwich sandwiches لفة لفات سندويش ساندويش ساندویچ',
  can: 'can cans tin علبة قوطية قوتی',
  bottle: 'bottle bottles قنينة بطل بۆتل',
  bag: 'bag bags packet pack كيس باكيت کیس پاکەت',
  scoop: 'scoop scoops',
  handful: 'handful handfuls حفنة مستەک مشتەک',
  serving: 'serving servings portion portions حصة پشک',
};
// Two-word units, checked before single words.
const UNIT_PHRASES = {
  tsp: ['ملعقة صغيرة', 'کەڤچیێ بچویک', 'tea spoon', 'tea spoons'],
  tbsp: ['ملعقة كبيرة', 'کەڤچیێ مەزن', 'table spoon', 'table spoons'],
  teaGlass: ['tea glass'],
};

// Plain words people type for everyday foods → the food they most likely mean.
const ALIASES = {
  timman: 'rice ارز رز تمن برنج timman',
  grilled_chicken: 'chicken دجاج مریشک',
  egg_boiled: 'egg eggs بيض بيضة بیض هێک',
  tea_sugar: 'tea چاي شاي چای',
  khubz_tannour: 'bread خبز نان',
  lamb: 'meat لحم گۆشت',
  biryani_chicken: 'biryani برياني بریانی',
  yogurt: 'yogurt yoghurt لبن ماست',
  milk: 'milk حليب شیر',
  coffee_black: 'coffee قهوة قەهوە',
  water: 'water ماء مي ئاڤ',
  salad_iraqi: 'salad زلاطة سلطة زەلاتە',
  lentil_soup: 'soup شوربة شۆربا',
  potato_boiled: 'potato potatoes بطاطا پەتاتە',
  shawarma_chicken: 'shawarma شاورما',
  dolma: 'dolma dolme دولمة دولمه دۆلمە',
  cheese_white: 'cheese جبن جبنة پەنیر',
  kebab: 'kebab kabab كباب کەباب',
  soda_lemon: 'sevenup sprite سڤن',
};

const FILLER = new Set(['of', 'x', 'من', 'ژ'].map(normalize));

const wordMap = (table, toValue = (k) => k) => {
  const map = new Map();
  for (const [key, words] of Object.entries(table)) {
    for (const w of words.split(' ')) map.set(normalize(w), toValue(key));
  }
  return map;
};

const NUMBERS = wordMap(NUMBER_WORDS, Number);
const UNITS = (() => {
  const map = wordMap(UNIT_ALIASES);
  for (const [unit, names] of Object.entries(UNIT_NAMES)) {
    if (unit === 'halfPlate' || unit === 'g') continue;
    for (const name of Object.values(names)) if (!name.includes(' ')) map.set(normalize(name), unit);
  }
  return map;
})();
const PHRASES = (() => {
  const list = [];
  for (const [unit, phrases] of Object.entries(UNIT_PHRASES)) for (const p of phrases) list.push([normalize(p).split(' '), unit]);
  for (const [unit, names] of Object.entries(UNIT_NAMES)) {
    if (unit === 'halfPlate' || unit === 'g') continue;
    for (const name of Object.values(names)) if (name.includes(' ')) list.push([normalize(name).split(' '), unit]);
  }
  return list;
})();
const ALIAS_MAP = wordMap(ALIASES);
const aliasFor = (query) => ALIAS_MAP.get(query) ?? ALIAS_MAP.get(query.split(' ').map((w) => (w.length > 3 ? w.replace(/(هک|ات|ه|ا|ی|es|s)$/u, '') : w)).join(' '));

// ---------- splitting & reading one item ----------

// A comma between two digits is a number ("1,5" or "1,000"), not a separator.
const SPLIT = /\s*(?:(?<!\d)[,،]|[,،](?!\d)|[;+\n]|\s(?:and|&|w|wa|و|ou)\s)\s*/i;

/** "200g rice and 100g chicken, 2 samoon" → ['200g rice', '100g chicken', '2 samoon'] */
const westernDigits = (text) => String(text ?? '')
  .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));

export function splitItems(text) {
  // Digits first, so "١,٥" is seen as a number before commas split the text.
  return westernDigits(text).split(SPLIT).map((s) => s.trim()).filter(Boolean);
}

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75 };

/** Western digits, dot decimals, and a space between a number and its unit ("200g" → "200 g"). */
function prepare(text) {
  return text
    .replace(/7s?up/gi, 'sevenup') // the drink, not "7 × up"
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/(\d),(\d{3})(?!\d)/g, '$1$2') // 1,000 → 1000
    .replace(/(\d)[٫,](\d)/g, '$1.$2') // 1,5 → 1.5
    .replace(/(\d+)\s+(\d+)\/(\d+)/g, (_, w, a, b) => String(Number(w) + Number(a) / Number(b))) // 1 1/2
    .replace(/(\d)\s*([½¼¾])/g, (_, d, f) => String(Number(d) + FRACTIONS[f]))
    .replace(/[½¼¾]/g, (f) => String(FRACTIONS[f]))
    .replace(/(\d)(\/)(\d)/g, (_, a, __, b) => String(Number(a) / Number(b)))
    .replace(/(\d)([^\d\s.])/gu, '$1 $2')
    .toLowerCase();
}

const isNumeric = (w) => /^\d+(\.\d+)?$/.test(w);

/**
 * One item → { qty, unit, query }. unit is 'g' for grams/kg/ml (qty in grams),
 * a portion unit (plate, piece…) or null when only a count was given.
 */
export function parseItem(chunk, { keepUnit = false } = {}) {
  const words = prepare(chunk).split(/\s+/).filter(Boolean);
  const norm = words.map((w) => (isNumeric(w) ? w : normalize(w))).filter(Boolean); // "&" etc. become nothing
  const used = new Set();
  let qty = null;
  let unit = null;

  norm.forEach((w, i) => {
    if (qty !== null) return;
    if (isNumeric(w)) { qty = Number(w); used.add(i); return; }
    if (NUMBERS.has(w) && i < norm.length - 1) { qty = NUMBERS.get(w); used.add(i); }
  });

  for (const [phrase, u] of keepUnit ? [] : PHRASES) {
    const at = norm.findIndex((_, i) => phrase.every((p, k) => norm[i + k] === p));
    if (at >= 0) { unit = u; phrase.forEach((_, k) => used.add(at + k)); break; }
  }
  if (!unit && !keepUnit) {
    norm.forEach((w, i) => {
      if (unit || used.has(i)) return;
      // Badini "قاپەک" = one plate: strip the "-ەک" ending.
      const stems = [w.endsWith('هک') && w.slice(0, -2), w.endsWith('ک') && w.slice(0, -1)].filter(Boolean);
      const viaStem = stems.map((st) => UNITS.get(st)).find(Boolean);
      const hit = UNITS.get(w) ?? (w.endsWith('s') ? UNITS.get(w.slice(0, -1)) : undefined) ?? viaStem;
      if (hit) { unit = hit; used.add(i); if (!UNITS.get(w) && viaStem && qty === null) qty = 1; }
    });
  }

  if (unit === 'kg' || unit === 'l') { unit = 'g'; qty = (qty ?? 1) * 1000; }
  if (unit === 'ml') unit = 'g';
  if (unit && qty === null) qty = 1;
  const query = norm.filter((w, i) => !used.has(i) && !FILLER.has(w)).join(' ');
  return { qty, unit, query };
}

// ---------- finding the food ----------

const clean = (text) => normalize(String(text ?? '').replace(/['’]/g, ''));

function nameWords(food) {
  const names = food.n ? [food.n.en, food.n.ar, food.n.ku] : [food.name];
  return { names: names.map((n) => clean(n).split(' ').filter(Boolean)), keys: clean(food.keys).split(' ').filter(Boolean) };
}

/**
 * Drops endings that change between spellings: Arabic ة/ا/ي ("باميا" = "بامية",
 * "صمونة" = "صمون"), the Badini "-ەک" (one …: "سەموونەک"), English plural s.
 */
const stem = (w) => (w.length > 3 ? w.replace(/(هک|ات|ه|ا|ی|es|s)$/u, '') : w);

const prefixMatch = (qWords, words) => qWords.every((q) => {
  const sq = stem(q);
  return words.some((w) => w.startsWith(q) || stem(w).startsWith(sq));
});

/** Higher is better; 0 = no match. Exact names beat partial ones; shorter names beat longer. */
function score(food, qWords, q) {
  const { names, keys } = nameWords(food);
  let best = 0;
  for (const words of names) {
    if (words.join(' ') === q) return 100;
    if (prefixMatch(qWords, words)) {
      const coverage = qWords.length / words.length;
      // Whole words count more than the start of a longer word ("cheese" ≠ "cheeseburger").
      const exact = qWords.filter((q) => words.includes(q) || words.some((w) => stem(w) === stem(q))).length / qWords.length;
      best = Math.max(best, 50 + 30 * coverage + 25 * exact + (words[0].startsWith(qWords[0]) ? 5 : 0));
    }
  }
  if (!best && prefixMatch(qWords, keys)) best = 40;
  return best;
}

function rank(foods, query) {
  const qWords = query.split(' ').filter(Boolean);
  if (!qWords.length) return [];
  const aliasId = aliasFor(query);
  return foods
    .map((food, i) => ({ food, i, s: food.id === aliasId ? Math.max(ALIAS_SCORE, score(food, qWords, query)) : score(food, qWords, query) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((r) => r.food);
}

/** Score of the best match for a query (0 = nothing). */
function bestScore(foods, query) {
  const qWords = query.split(' ').filter(Boolean);
  if (!qWords.length) return 0;
  const aliasId = aliasFor(query);
  return foods.reduce((best, food) => Math.max(best, food.id === aliasId ? ALIAS_SCORE : score(food, qWords, query)), 0);
}

/** Find foods for a query, trying a singular form for English plurals ("eggs" → "egg"). */
export function findFoods(foods, query) {
  const direct = rank(foods, query);
  if (direct.length) return direct.slice(0, MAX_CANDIDATES);
  const singular = query.split(' ').map((w) => w.replace(/(es|s)$/, '')).join(' ');
  return singular !== query ? rank(foods, singular).slice(0, MAX_CANDIDATES) : [];
}

/**
 * "a bowl of fasolia": if the best match doesn't come in the typed unit but a
 * close alternative does (the stew, not plain beans), put that one first.
 */
function preferUnit(candidates, unit) {
  if (!unit || unit === 'g' || !candidates.length) return candidates;
  if (candidates[0].portions.some((p) => p.unit === unit)) return candidates;
  const better = candidates.slice(1, 4).find((c) => c.portions.some((p) => p.unit === unit));
  return better ? [better, ...candidates.filter((c) => c !== better)] : candidates;
}

/**
 * Turn what was typed into the food's own terms (grams, or one of its portions)
 * and calculate the nutrition.
 */
export function resolveAmount(food, unit, qty) {
  let u = unit;
  let q = qty ?? 1;
  if (u === 'g' && !food.grams) {
    const portion = food.portions[0];
    q = Math.max(0.5, Math.round((q / portion.g) * 2) / 2);
    u = portion.unit;
  } else if (u !== 'g' && !food.portions.some((p) => p.unit === u)) {
    u = food.portions[0].unit; // e.g. "1 plate samoon" → 1 samoon
  }
  q = Math.min(q, u === 'g' ? MAX_GRAMS : MAX_PORTIONS);
  const grams = gramsFor(food, u, q);
  return { unit: u, qty: q, grams: Math.round(grams), ...nutritionFor(food, grams) };
}

/** @returns {{key: string, text: string, food: object|null, candidates: object[], unit: string, qty: number, grams: number, kcal: number}[]} */
const WITH = /\s(?:with|مع|ب)\s/i;

/** Split "X with Y" into two items, but only when "X with Y" isn't itself a food. */
function expandWith(chunks, foods) {
  return chunks.flatMap((chunk) => {
    if (!WITH.test(chunk) || findFoods(foods, parseItem(chunk).query).length) return [chunk];
    return chunk.split(WITH).map((p) => p.trim()).filter(Boolean);
  });
}

const JOINERS = [' و ', ' and ', ' & '];
const isExactName = (foods, query) => Boolean(query) && foods.some((f) => nameWords(f).names.some((w) => w.join(' ') === query));

/** "برنج و مریشک" is one dish: join neighbours back when together they are a food's exact name. */
function rejoin(chunks, foods) {
  const out = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const next = chunks[i + 1];
    const joined = next && JOINERS.map((j) => chunks[i] + j + next).find((c) => isExactName(foods, parseItem(c).query));
    if (joined) { out.push(joined); i += 1; } else out.push(chunks[i]);
  }
  return out;
}

/** "chicken sandwich": keep "sandwich" in the name when that matches a food better than as a unit. */
function readItem(chunk, foods) {
  const parsed = parseItem(chunk);
  if (!parsed.unit || parsed.unit === 'g') return parsed;
  const whole = parseItem(chunk, { keepUnit: true });
  return bestScore(foods, whole.query) > bestScore(foods, parsed.query) ? whole : parsed;
}

export function parseQuickEntry(text, foods) {
  return expandWith(rejoin(splitItems(text), foods), foods).map((chunk, index) => {
    const parsed = readItem(chunk, foods);
    const candidates = preferUnit(findFoods(foods, parsed.query), parsed.unit);
    const food = candidates[0] ?? null;
    const base = { key: `q${index}`, text: chunk, query: parsed.query, food, candidates, typedUnit: parsed.unit, typedQty: parsed.qty };
    if (!food) return { ...base, unit: parsed.unit, qty: parsed.qty ?? 1, grams: 0, kcal: 0, p: 0, c: 0, f: 0 };
    return { ...base, ...resolveAmount(food, parsed.unit, parsed.qty) };
  });
}

/** Does a search box text look like "amounts + foods" rather than a single food name? */
export function looksLikeQuickEntry(text) {
  const t = String(text ?? '').trim();
  if (!t) return false;
  if (/[\d٠-٩۰-۹½¼¾]/.test(t)) return true;
  if (splitItems(t).length > 1) return true;
  const first = normalize(t.split(/\s+/)[0]);
  return NUMBERS.has(first) && t.split(/\s+/).length > 1 && !['a', 'an'].includes(first);
}
