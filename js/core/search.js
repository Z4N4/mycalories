// Search across English, Arabic and Kurdish names. Arabic and Kurdish spell
// the same sounds with different letters (ة / ە, ك / ک, و / ۆ ...), so both
// the query and the names are folded to one common form before comparing.

const LETTER_MAP = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا',
  'ة': 'ه', 'ە': 'ه', 'ھ': 'ه',
  'ى': 'ی', 'ي': 'ی', 'ێ': 'ی', 'ئ': 'ی',
  'ك': 'ک', 'ڪ': 'ک',
  'ۆ': 'و', 'ۇ': 'و', 'ؤ': 'و',
  'ڕ': 'ر', 'ڵ': 'ل', 'ڤ': 'ف', 'پ': 'ب', 'چ': 'ج', 'ژ': 'ز', 'گ': 'ک',
};
const DIACRITICS = /[ً-ٰٟـ]/g; // harakat, dagger alef, tatweel
const FOLD = new RegExp(`[${Object.keys(LETTER_MAP).join('')}]`, 'g');

/** @param {string} text @returns {string} */
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFC')
    .replace(DIACRITICS, '')
    .replace(FOLD, (ch) => LETTER_MAP[ch])
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function haystackOf(food) {
  const names = food.n ? [food.n.en, food.n.ar, food.n.ku] : [food.name];
  return names.map(normalize).concat(normalize(food.keys));
}

function score(names, words) {
  const all = names.join(' ');
  if (!words.every((w) => all.includes(w))) return -1;
  const first = words[0];
  if (names.some((n) => n.startsWith(first))) return 2;
  if (names.some((n) => n.split(' ').some((part) => part.startsWith(first)))) return 1;
  return 0;
}

/**
 * @template T
 * @param {T[]} foods
 * @param {string} query
 * @returns {T[]} matches, best first (stable within the same score)
 */
export function searchFoods(foods, query) {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return foods;
  return foods
    .map((food, i) => ({ food, i, s: score(haystackOf(food), words) }))
    .filter((r) => r.s >= 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((r) => r.food);
}
