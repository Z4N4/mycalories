// Food-photo analysis: the prompt sent to the AI and safe parsing of its answer.
// The AI picks foods from our own list, so calories come from the app's database
// whenever possible; it only estimates nutrition itself for foods we don't have.

const MAX_ITEMS = 8;
const MAX_GRAMS = 2000;
const CONFIDENCE = ['high', 'medium', 'low'];

export const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Food id from the list, or "other"' },
          name: { type: 'string', description: 'Short English name of the food' },
          grams: { type: 'number', description: 'Estimated edible weight in grams' },
          kcal100: { type: 'number', description: 'Only for id "other": kcal per 100 g' },
          protein100: { type: 'number' },
          carbs100: { type: 'number' },
          fat100: { type: 'number' },
          confidence: { type: 'string', enum: CONFIDENCE },
        },
        required: ['id', 'name', 'grams', 'confidence'],
      },
    },
  },
  required: ['items'],
};

/** @param {{id: string, n: {en: string}}[]} foods built-in foods */
export function buildPrompt(foods) {
  const list = foods.map((f) => `${f.id}: ${f.n.en}`).join('\n');
  return [
    'You are a nutrition assistant for Iraqi and Kurdish home food.',
    'Look at the photo and list each separate food or drink you can see (at most 8).',
    'For each one, choose the closest id from the FOOD LIST below.',
    'If nothing in the list is close, use id "other", give a short English name,',
    'and estimate kcal100, protein100, carbs100 and fat100 (per 100 g).',
    'Estimate the edible weight in grams of what is actually on the plate or in the glass.',
    'Typical sizes: a full dinner plate of rice about 300 g, one samoon about 80 g,',
    'one dolma piece about 35 g, one kebab skewer about 90 g, an istikan of tea about 100 g.',
    'Use confidence "low" when you are guessing. If there is no food, return an empty items list.',
    'Answer only with JSON matching the schema.',
    '',
    'FOOD LIST:',
    list,
  ].join('\n');
}

const num = (v, min, max) => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null);

function toItem(raw, foodsById) {
  if (!raw || typeof raw !== 'object') return null;
  const grams = num(raw.grams, 0.1, Number.MAX_VALUE);
  if (grams == null) return null;
  const confidence = CONFIDENCE.includes(raw.confidence) ? raw.confidence : 'low';
  const known = foodsById.get(raw.id);
  const base = { grams: Math.min(MAX_GRAMS, Math.round(grams)), confidence };
  if (known) return { ...base, food: known, custom: false };

  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 60) : '';
  const kcal = num(raw.kcal100, 0, 900);
  if (!name || kcal == null) return null;
  const per100 = {
    kcal, p: num(raw.protein100, 0, 100) ?? 0, c: num(raw.carbs100, 0, 100) ?? 0, f: num(raw.fat100, 0, 100) ?? 0,
  };
  return { ...base, custom: true, food: { id: 'ai_other', cat: 'custom', custom: true, name, keys: '', per100, portions: [{ unit: 'serving', g: 100 }], grams: true } };
}

/**
 * Turn the AI's text answer into checked items. Throws if it isn't JSON.
 * @returns {{food: object, grams: number, confidence: string, custom: boolean}[]}
 */
export function parseAiResult(text, foodsById) {
  const json = String(text ?? '').replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '');
  const data = JSON.parse(json);
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map((raw) => toItem(raw, foodsById)).filter(Boolean).slice(0, MAX_ITEMS);
}

/** Removes spaces, line breaks and quotes that sneak in when pasting on a phone. */
export function cleanKey(key) {
  return String(key ?? '').replace(/[\s"'`​-‏⁦-⁩]/g, '');
}

/**
 * Loose length check only: Google has more than one key format (old "AIza…"
 * keys and newer auth keys), so the real check is a request to Google.
 */
export function isPlausibleKey(key) {
  const clean = cleanKey(key);
  return clean.length >= 20 && clean.length <= 400 && /^[\x21-\x7E]+$/.test(clean);
}
