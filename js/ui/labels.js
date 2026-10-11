// Human-readable dates and portions in the current language.

import { addDays, fromKey, todayKey } from '../core/dates.js';
import { DAY_LONG, MONTHS, UNIT_NAMES } from '../i18n/strings.js';
import { fmt, fmtQty } from './dom.js';

const satIndex = (date) => (date.getDay() + 1) % 7; // Saturday = 0

export function fullDate(key, lang) {
  const d = fromKey(key);
  return `${DAY_LONG[lang][satIndex(d)]} ${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
}

export function shortDate(key, lang) {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
}

/** "Today", "Yesterday", or the weekday name. */
export function dayLabel(key, t, lang) {
  const today = todayKey();
  if (key === today) return t('today');
  if (key === addDays(today, -1)) return t('yesterday');
  if (key === addDays(today, 1)) return t('tomorrow');
  return DAY_LONG[lang][satIndex(fromKey(key))];
}

export function weekRange(keys, lang) {
  const a = fromKey(keys[0]);
  const b = fromKey(keys[keys.length - 1]);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} – ${b.getDate()} ${MONTHS[lang][b.getMonth()]}`;
  return `${shortDate(keys[0], lang)} – ${shortDate(keys[keys.length - 1], lang)}`;
}

export function unitName(unit, lang, food) {
  if (unit === 'serving' && food?.custom && food.portions[0]?.label) return food.portions[0].label;
  return UNIT_NAMES[unit]?.[lang] ?? unit;
}

/** e.g. "1½ plate · 525 g" or "120 g". */
export function portionText(unit, qty, grams, lang, food, t) {
  if (unit === 'g') return `${fmt(qty)} ${t('gramShort')}`;
  const base = `${fmtQty(qty)} ${unitName(unit, lang, food)}`;
  return food && !food.grams ? base : `${base} · ${fmt(grams)} ${t('gramShort')}`;
}
