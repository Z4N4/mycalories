// Date helpers. Days are stored as local "YYYY-MM-DD" keys so a meal eaten at
// 11pm in Iraq never lands on the next day (which toISOString would do).

const SATURDAY = 6;
const KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n) => String(n).padStart(2, '0');

/** @param {Date} date @returns {string} */
export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** @param {string} key @returns {Date} local midnight */
export function fromKey(key) {
  const [, y, m, d] = KEY_PATTERN.exec(key);
  return new Date(Number(y), Number(m) - 1, Number(d));
}

/** @param {unknown} key @returns {boolean} */
export function isValidKey(key) {
  if (typeof key !== 'string' || !KEY_PATTERN.test(key)) return false;
  return toKey(fromKey(key)) === key;
}

/** @returns {string} */
export function todayKey() {
  return toKey(new Date());
}

/** @param {string} key @param {number} days @returns {string} */
export function addDays(key, days) {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

/** Saturday on or before the given day. */
export function weekStart(key) {
  const offset = (fromKey(key).getDay() - SATURDAY + 7) % 7;
  return addDays(key, -offset);
}

/** @returns {string[]} Saturday..Friday */
export function weekKeys(key) {
  const start = weekStart(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** @param {number} year @param {number} month 0-11 @returns {string[]} */
export function monthKeys(year, month) {
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => toKey(new Date(year, month, i + 1)));
}

/**
 * Calendar cells for a month, weeks starting Saturday, padded with null.
 * @returns {(string|null)[]}
 */
export function monthGrid(year, month) {
  const keys = monthKeys(year, month);
  const lead = (new Date(year, month, 1).getDay() - SATURDAY + 7) % 7;
  const cells = [...Array(lead).fill(null), ...keys];
  const tail = (7 - (cells.length % 7)) % 7;
  return [...cells, ...Array(tail).fill(null)];
}
