// Everything the AI is asked, and safe reading of its answers. The AI only
// names foods and estimates grams / nutrition; the app then matches those names
// to its own food list (so calories come from the app's numbers when it knows
// the food). Prompts are short because free AI plans limit tokens per minute.

import { bestMatch } from './quickEntry.js';

const MAX_ITEMS = 8;
const MAX_GRAMS = 2000;
// Scores from bestMatch: 100 exact name, 99 everyday word, 105+ same words ("grape" → Grapes),
// ~90 only part of the name ("cola" → Diet cola), ≤ 20 a spelling guess ("beer" → Beef burger).
const STRONG_MATCH = 99;
const FAIR_MATCH = 75;
const CONFIDENCE = ['high', 'medium', 'low'];

const LOCAL_NAMES = 'dolma, yaprakh, kubba, kubba mosul, kutilk, biryani, quzi, maqluba, tashreeb, '
  + 'timman (Iraqi rice), bulgur (savar), fasolia stew, bamya, qeema, lentil soup, kebab, tikka, shifta, '
  + 'shawarma, falafel, samoon, tannour bread, saj bread, kahi, geymar, kleicha, baklawa, chai (tea)';

const ITEM_FIELDS = '"name" (short English name), "grams" (edible weight), "kcal100", "protein100", '
  + '"carbs100", "fat100" (per 100 g), "confidence" ("high"|"medium"|"low")';

export function photoPrompt() {
  return [
    'You are a nutrition expert for Iraqi and Kurdish home food.',
    'List each separate food or drink you can see in the photo (at most 8).',
    `Use these local dish names when they fit: ${LOCAL_NAMES}.`,
    'Name simple items plainly (e.g. "lemon", "apple", "boiled egg").',
    'Estimate the edible weight actually shown. Typical: full plate of rice ~300 g, samoon ~80 g, one dolma ~35 g.',
    `For each item give ${ITEM_FIELDS}.`,
    'If there is no food, return an empty list.',
    'Reply ONLY with JSON: {"items":[...]}',
  ].join('\n');
}

/** For typed lines the app could not read by itself (any language). */
export function linesPrompt(lines) {
  return [
    'These lines say what a person in Iraqi Kurdistan ate. They may be English, Arabic or Kurdish (Badini), with typos.',
    'For every food or drink mentioned, give an item. If no amount is written, assume one normal portion.',
    `Use these local dish names when they fit: ${LOCAL_NAMES}.`,
    `For each item give "line" (the line number below), ${ITEM_FIELDS}.`,
    'Reply ONLY with JSON: {"items":[...]}',
    '',
    ...lines.map((l, i) => `${i + 1}. ${l.slice(0, 200)}`),
  ].join('\n');
}

/** "Search online" for any food or drink in the world. */
export function lookupPrompt(query) {
  return [
    `Give nutrition facts for this food or drink: "${query.slice(0, 120)}".`,
    'Return up to 3 likely matches (for example different sizes, brands or recipes).',
    'For branded products use the real label values if you know them.',
    'For each give "name" (English), "brand" (or ""), "serving_name" (e.g. "1 can", "grande", "1 plate"), '
      + '"serving_grams", "kcal100", "protein100", "carbs100", "fat100" (per 100 g or 100 ml), "confidence".',
    'Reply ONLY with JSON: {"items":[...]}',
  ].join('\n');
}

/** The JSON object inside an AI answer (ignores thinking, code fences, extra words). */
export function parseAiJson(text) {
  const cleaned = String(text ?? '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```(?:json)?/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON in the answer');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const num = (v, min, max) => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max ? n : null;
};

function per100Of(raw) {
  const kcal = num(raw.kcal100, 0, 900);
  if (kcal == null) return null;
  const p = num(raw.protein100, 0, 100) ?? 0;
  const c = num(raw.carbs100, 0, 100) ?? 0;
  const f = num(raw.fat100, 0, 100) ?? 0;
  return p + c + f <= 101 ? { kcal, p, c, f } : null;
}

/** Checked items: {name, grams, per100|null, confidence, line?, brand, servingName, servingG} */
export function cleanAiItems(data) {
  const list = Array.isArray(data?.items) ? data.items : [];
  return list.map((raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 60) : '';
    if (!name) return null;
    const grams = num(raw.grams, 0.1, Number.MAX_VALUE);
    return {
      name,
      grams: grams == null ? null : Math.min(MAX_GRAMS, Math.round(grams)),
      per100: per100Of(raw),
      confidence: CONFIDENCE.includes(raw.confidence) ? raw.confidence : 'medium',
      line: num(raw.line, 1, 100),
      brand: typeof raw.brand === 'string' ? raw.brand.trim().slice(0, 40) : '',
      servingName: typeof raw.serving_name === 'string' ? raw.serving_name.trim().slice(0, 30) : '',
      servingG: num(raw.serving_grams, 1, 3000),
    };
  }).filter(Boolean).slice(0, MAX_ITEMS);
}

/** A food made from the AI's own numbers (not saved; used for one entry). */
const aiFood = (item) => ({
  id: 'ai_other', cat: 'custom', custom: true, name: item.name, keys: '',
  per100: item.per100, portions: [{ unit: 'serving', g: 100 }], grams: true,
});

/**
 * The app's own food when the name really is that food; otherwise a food made
 * from the AI's estimate, with a close app food offered as an alternative.
 * Items with neither are dropped.
 * @returns {{food: object, grams: number, confidence: string, custom: boolean, alternative?: object, line?: number}[]}
 */
export function matchAiItems(items, foods) {
  return items.map((item) => {
    const grams = item.grams ?? 100;
    // No weight from the AI: 100 g is only a placeholder, so the user must look.
    const confidence = item.grams == null ? 'low' : item.confidence;
    const { food, score } = bestMatch(foods, item.name);
    const base = { grams, confidence, line: item.line };
    if (food && score >= STRONG_MATCH) return { ...base, food, custom: false };
    const close = food && score >= FAIR_MATCH ? food : null;
    if (item.per100) return { ...base, food: aiFood(item), custom: true, ...(close ? { alternative: close } : {}) };
    if (close) return { ...base, food: close, confidence: 'low', custom: false };
    return null;
  }).filter(Boolean);
}

/** AI lookup answers → custom foods (values per serving) ready to save in "My foods". */
export function lookupToCustomFoods(items) {
  return items.filter((i) => i.per100).map((i) => {
    const servingG = i.servingG ?? 100;
    const k = servingG / 100;
    const r1 = (n) => Math.round(n * 10) / 10;
    return {
      name: (i.brand && !i.name.toLowerCase().includes(i.brand.toLowerCase()) ? `${i.name} (${i.brand})` : i.name).slice(0, 80),
      servingName: i.servingName || (servingG === 100 ? '100 g' : ''),
      servingG,
      kcal: Math.round(i.per100.kcal * k),
      p: r1(i.per100.p * k),
      c: r1(i.per100.c * k),
      f: r1(i.per100.f * k),
      confidence: i.confidence,
    };
  });
}
