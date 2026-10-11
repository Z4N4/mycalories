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
const round1 = (n) => Math.round(n * 10) / 10;

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
  const serving = num(p.serving_quantity, MAX_SERVING_G);
  const servingG = serving != null && serving >= MIN_SERVING_G ? serving : 100;
  const factor = servingG / 100;
  const macro = (v) => round1((num(v, MAX_GRAMS_PER_100) ?? 0) * factor);
  return {
    name,
    barcode: code,
    servingName: servingG === 100 ? '100 g' : String(p.serving_size || '').slice(0, 30),
    servingG,
    kcal: Math.round(kcal100 * factor),
    p: macro(n.proteins_100g),
    c: macro(n.carbohydrates_100g),
    f: macro(n.fat_100g),
  };
}
