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
export const WEAK_SCORE = 20; // at or below: only a spelling guess ("samon" → samoon), worth a second look

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
  cola: 'coke cola كولا كوكا کۆلا',
};

// Chatty words people write around the food ("I ate … today", "أكلت", "خوارم").
const FILLER = new Set([
  'of x i ate eat eaten had have has drank drink drunk today yesterday some about around approx approximately my the also then just for at in',
  'من ژ أكلت اكلت اكلنا شربت تناولت اليوم امس البارحة حوالي تقريبا بعض على في',
  'خوار خوارن خوارم خواری ڤەخوار ڤەخوارن ڤەخوارم ئەڤرۆ دوهی نێزیکی بۆ ل',
].join(' ').split(' ').map(normalize));

// Meal words: also removed from the food name, and used to pick the meal.
const MEAL_WORDS = {
  breakfast: 'breakfast فطور الفطور ريوك تێشت تیشت',
  lunch: 'lunch غداء الغداء غدا فراڤین',
  dinner: 'dinner supper عشاء العشاء شیڤ',
  snacks: 'snack snacks سناك سناكات سڤکاهی',
};

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
const MEALS_BY_WORD = wordMap(MEAL_WORDS);

/** "for breakfast I had…" / "غداء: …" / "شیڤ: …" → that meal, or null. */
export function detectMeal(text) {
  const words = normalize(text).split(' ');
  for (const w of words) if (MEALS_BY_WORD.has(w)) return MEALS_BY_WORD.get(w);
  return null;
}
const aliasFor = (query) => ALIAS_MAP.get(query) ?? ALIAS_MAP.get(query.split(' ').map((w) => (w.length > 3 ? w.replace(/(هک|ات|ه|ا|ی|es|s)$/u, '') : w)).join(' '));

// ---------- splitting & reading one item ----------

// A comma between two digits is a number ("1,5" or "1,000"), not a separator.
const SPLIT = /\s*(?:(?<!\d)[,،]|[,،](?!\d)|[;+\n]|\s(?:and|&|w|wa|و|ou)\s)\s*/i;

/** "200g rice and 100g chicken, 2 samoon" → ['200g rice', '100g chicken', '2 samoon'] */
const westernDigits = (text) => String(text ?? '')
  .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));

/** Numbers made ready before splitting: "1 1/2" → "1.5", "1,5" → "1.5", "1,000" → "1000". */
const numbersFirst = (text) => westernDigits(text)
  .replace(/(\d),(\d{3})(?!\d)/g, '$1$2')
  .replace(/(\d)[٫,](\d)/g, '$1.$2')
  .replace(/(\d+)\s+(\d+)\/(\d+)/g, (_, w, a, b) => String(Number(w) + Number(a) / Number(b)));

// Arabic joins "and" to the next verb: "وشربت" = "and I drank".
const ATTACHED_AND = /\sو(?=شربت|اكلت|أكلت|تناولت)/g;

const JOIN_WORDS = new Set(['with', 'مع', 'ب'].map(normalize));

/** 'number' | 'unit' | 'filler' | 'word' for one typed word. */
function kindOf(w) {
  const n = normalize(w);
  if (['a', 'an'].includes(n) || FILLER.has(n) || JOIN_WORDS.has(n) || !n) return 'filler';
  if (/^\d/.test(w) || NUMBERS.has(n)) return 'number';
  if (UNITS.has(n) || (n.endsWith('s') && UNITS.has(n.slice(0, -1)))) return 'unit';
  return 'word';
}

/**
 * Without commas, amounts show where one food ends and the next begins:
 * "2 samoon 1 tea" (amount first) and "rice 200g chicken 100g" (amount after).
 * "rice 200g" and "1 can pepsi 330 ml" stay one item.
 */
function splitOnNumbers(chunk) {
  const parts = [];
  let current = [];
  let hasNumber = false;
  let hasWord = false;
  let wordFirst = null; // did this part start with the food name?
  let last = null;
  for (const w of chunk.split(/\s+/).filter(Boolean)) {
    const kind = kindOf(w);
    const newAmount = kind === 'number' && hasNumber && hasWord;
    const newFood = kind === 'word' && wordFirst && hasNumber && (last === 'number' || last === 'unit');
    if (newAmount || newFood) {
      parts.push(current);
      current = [];
      hasNumber = false;
      hasWord = false;
      wordFirst = null;
    }
    if (kind === 'number') { hasNumber = true; wordFirst ??= false; }
    if (kind === 'word') { hasWord = true; wordFirst ??= true; }
    current.push(w);
    last = kind;
  }
  if (current.length) parts.push(current);
  // A part with no food word ("330 ml") belongs to the food before it.
  return parts.reduce((out, words) => {
    if (out.length && !words.some((w) => kindOf(w) === 'word')) return [...out.slice(0, -1), [...out[out.length - 1], ...words]];
    return [...out, words];
  }, []).map((words) => words.join(' '));
}

export function splitItems(text) {
  // Digits first, so "١,٥" is seen as a number before commas split the text.
  return numbersFirst(text).replace(ATTACHED_AND, ' و ').split(SPLIT)
    .map((s) => s.trim()).filter(Boolean)
    .flatMap(splitOnNumbers);
}

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75 };

/** Western digits, dot decimals, and a space between a number and its unit ("200g" → "200 g"). */
function prepare(text) {
  return text
    .replace(/7\s?up/gi, 'sevenup') // the drink, not "7 × up"
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
export function parseItem(chunk, { keepUnit = false, keepFiller = false } = {}) {
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
  // A second amount ("1 can pepsi 330 ml") only repeats the first one.
  const extraAmount = (w) => isNumeric(w) || (unit && !keepUnit && (UNITS.has(w) || (w.endsWith('s') && UNITS.has(w.slice(0, -1)))));
  const query = norm.filter((w, i) => !used.has(i) && !extraAmount(w) && (keepFiller || !FILLER.has(w)) && !MEALS_BY_WORD.has(w)).join(' ');
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
  if (!best) {
    // Small typos ("chiken", "samon", "biriyani"): every word must be close to a word of the name.
    for (const words of names) {
      if (fuzzyMatch(qWords, words)) best = Math.max(best, 10 + 10 * Math.min(1, qWords.length / words.length));
    }
  }
  return best;
}

/** Edit distance between two short words (insert / delete / replace one letter = 1). */
function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

/** Allowed typos: none for very short words, 1 for 4–6 letters, 2 for longer words. */
const typoLimit = (w) => (w.length < 4 ? 0 : w.length < 7 ? 1 : 2);

// The first letter must be right: "coke" is not "cake", "beer" is not "beef"… but those still slip
// through, which is why a typo match is only ever a guess (WEAK_SCORE) for the user or the AI to check.
const fuzzyMatch = (qWords, words) => qWords.every((q) => words.some((w) => (
  w.startsWith(q) || (typoLimit(q) > 0 && w[0] === q[0]
    && (distance(q, w) <= typoLimit(q) || distance(q, w.slice(0, q.length + 1)) <= typoLimit(q) - 1))
)));

/**
 * Suggestions for the word being typed at the end of the text ("200g ric" →
 * rice dishes, everyday "rice" first).
 */
export function suggestFoods(foods, text, limit = 5) {
  const last = splitItems(text).pop() ?? '';
  if (/\s$/.test(text) || !last) return [];
  const query = parseItem(last).query;
  if (query.replace(/\s/g, '').length < 2) return [];
  // Everyday-word shortcuts ("ric" → rice) only for a single word; "chiken bre" is a food name.
  const single = !query.includes(' ');
  const aliasIds = single ? [...ALIAS_MAP.entries()].filter(([word]) => word.startsWith(query)).map(([, id]) => id) : [];
  const byId = new Map(foods.map((f) => [f.id, f]));
  const fromAlias = [...new Set(aliasIds)].map((id) => byId.get(id)).filter(Boolean);
  const found = findFoods(foods, query);
  return [...new Set([...fromAlias, ...found])].slice(0, limit);
}

/** Foods with their scores, best first. */
function rank(foods, query) {
  const qWords = query.split(' ').filter(Boolean);
  if (!qWords.length) return [];
  const aliasId = aliasFor(query);
  return foods
    .map((food, i) => ({ food, i, s: food.id === aliasId ? Math.max(ALIAS_SCORE, score(food, qWords, query)) : score(food, qWords, query) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i);
}

/** Ranked matches, trying a singular form for English plurals ("eggs" → "egg"). */
function scored(foods, query) {
  const direct = rank(foods, query);
  if (direct.length) return direct.slice(0, MAX_CANDIDATES);
  const singular = query.split(' ').map((w) => w.replace(/(es|s)$/, '')).join(' ');
  return singular !== query ? rank(foods, singular).slice(0, MAX_CANDIDATES) : [];
}

/** Score of the best match for a query (0 = nothing). */
const bestScore = (foods, query) => scored(foods, query)[0]?.s ?? 0;

/** The single best food for a name, with its score (100 = exact name, 99 = everyday word, ≤ WEAK_SCORE = a typo guess). */
export function bestMatch(foods, query) {
  const [top] = scored(foods, normalize(String(query ?? '').replace(/['’]/g, '')));
  return top ? { food: top.food, score: top.s } : { food: null, score: 0 };
}

export function findFoods(foods, query) {
  return scored(foods, query).map((r) => r.food);
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
    // Its own amount ("200g rice and 100g chicken") makes the second part a separate food.
    const joined = next && parseItem(next).qty === null && JOINERS.map((j) => chunks[i] + j + next).find((c) => isExactName(foods, parseItem(c).query));
    if (joined) { out.push(joined); i += 1; } else out.push(chunks[i]);
  }
  return out;
}

/** "chicken sandwich": keep "sandwich" in the name when that matches a food better than as a unit. */
function readItem(chunk, foods) {
  const withFiller = parseItem(chunk, { keepFiller: true });
  const parsed = isExactName(foods, withFiller.query) ? withFiller : parseItem(chunk);
  if (!parsed.unit || parsed.unit === 'g') return parsed;
  const whole = parseItem(chunk, { keepUnit: true });
  return bestScore(foods, whole.query) > bestScore(foods, parsed.query) ? whole : parsed;
}

export function parseQuickEntry(text, foods) {
  return expandWith(rejoin(splitItems(text), foods), foods).map((chunk, index) => {
    const parsed = readItem(chunk, foods);
    const candidates = preferUnit(findFoods(foods, parsed.query), parsed.unit);
    const food = candidates[0] ?? null;
    // A spelling guess is kept (forgiving typing) but marked, so the AI or the user checks it.
    const weak = Boolean(food) && bestScore(foods, parsed.query) <= WEAK_SCORE;
    const base = { key: `q${index}`, text: chunk, query: parsed.query, food, candidates, weak, typedUnit: parsed.unit, typedQty: parsed.qty };
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
