// Barcode helpers and conversion of Open Food Facts products into "My foods".

const KJ_PER_KCAL = 4.184;
const VALID_LENGTHS = [8, 12, 13, 14];

/** Digits only (accepts Arabic and Persian digits). */
export function cleanBarcode(text) {
  return String(text ?? '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/\D/g, '');
}

/** EAN-8, UPC-A, EAN-13 and ITF-14 share the same mod-10 check digit. */
export function isValidBarcode(code) {
  if (!/^\d+$/.test(code) || !VALID_LENGTHS.includes(code.length)) return false;
  const digits = [...code].map(Number);
  const check = digits.pop();
  const sum = digits.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

const MAX_KCAL_PER_100 = 900; // pure fat; anything higher is a kJ value typed into the kcal field
const MAX_GRAMS_PER_100 = 100;
const MIN_SERVING_G = 1;
const MAX_SERVING_G = 3000;

/** Number (or numeric text, as Open Food Facts sometimes sends) within [0, max], else null. */
const num = (v, max = Infinity) => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max ? n : null;
};
const MIN_SUSPECT_KCAL = 150; // below this, alcohol (7 kcal/g, not on labels) can explain the gap
const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Open Food Facts is filled in by volunteers; sometimes kJ is typed as kcal
 * (Red Bull "463 kcal"). When the label's protein / carbs / fat clearly can't
 * give that many calories, use what the macros add up to. Fewer calories than
 * the macros is left alone: sweeteners, fibre and sugar alcohols do that.
 */
function checkAgainstMacros(kcal100, n) {
  const p = num(n.proteins_100g, MAX_GRAMS_PER_100) ?? 0;
  const c = num(n.carbohydrates_100g, MAX_GRAMS_PER_100) ?? 0;
  const f = num(n.fat_100g, MAX_GRAMS_PER_100) ?? 0;
  if (p + c + f <= 0) return kcal100;
  const fromMacros = 4 * p + 4 * c + 9 * f;
  const wayTooHigh = kcal100 > MIN_SUSPECT_KCAL && kcal100 > fromMacros * 2 + 30;
  return wayTooHigh ? fromMacros : kcal100;
}

function pickName(p, lang) {
  const local = { ar: p.product_name_ar, ku: p.product_name_ku || p.product_name_ar, en: p.product_name_en }[lang];
  const name = (local || p.product_name || p.product_name_en || p.generic_name || '').trim();
  if (!name) return '';
  if (local || !p.brands) return name.slice(0, 80);
  return `${name} (${p.brands.split(',')[0].trim()})`.slice(0, 80);
}

/**
 * Open Food Facts API response → custom food fields (values per serving), or null.
 * @param {any} json  response of /api/v2/product/{code}.json
 */
export function productFromOff(json, code, lang) {
  const p = json?.status === 1 ? json.product : null;
  if (!p) return null;
  const n = p.nutriments ?? {};
  const kj = num(n.energy_100g);
  const kcal100 = num(n['energy-kcal_100g'], MAX_KCAL_PER_100)
    ?? (n['energy-kcal_100g'] == null && kj != null ? num(kj / KJ_PER_KCAL, MAX_KCAL_PER_100) : null);
  const name = pickName(p, lang);
  if (kcal100 == null || !name) return null;
  const kcalChecked = checkAgainstMacros(kcal100, n);
  const serving = num(p.serving_quantity, MAX_SERVING_G);
  const servingG = serving != null && serving >= MIN_SERVING_G ? serving : 100;
  const factor = servingG / 100;
  const macro = (v) => round1((num(v, MAX_GRAMS_PER_100) ?? 0) * factor);
  return {
    name,
    barcode: code,
    servingName: servingG === 100 ? '100 g' : String(p.serving_size || '').slice(0, 30),
    servingG,
    kcal: Math.round(kcalChecked * factor),
    p: macro(n.proteins_100g),
    c: macro(n.carbohydrates_100g),
    f: macro(n.fat_100g),
  };
}

const MAX_RESULTS = 12;

/**
 * Open Food Facts text-search results → foods (values per serving), without
 * duplicates or products that have no usable calories.
 */
export function productsFromSearch(json, lang) {
  const products = Array.isArray(json?.products) ? json.products : [];
  const seen = new Set();
  const out = [];
  for (const product of products) {
    const code = cleanBarcode(product?.code);
    const found = productFromOff({ status: 1, product }, isValidBarcode(code) ? code : '', lang);
    if (!found) continue;
    const brand = String(product.brands ?? '').split(',')[0].trim();
    const food = brand && !found.name.toLowerCase().includes(brand.toLowerCase())
      ? { ...found, name: `${found.name} (${brand})`.slice(0, 80) } : found;
    const id = `${food.name.toLowerCase()}|${food.kcal}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(food);
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}
