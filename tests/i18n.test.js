import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STRINGS, makeT, isRtl, MEAL_NAMES, UNIT_NAMES, DAY_SHORT, DAY_LONG, MONTHS,
} from '../js/i18n/strings.js';

test('every UI string has ku, ar and en text', () => {
  for (const [key, row] of Object.entries(STRINGS)) {
    assert.equal(row.length, 3, key);
    row.forEach((text) => assert.ok(text.trim(), `${key} is empty`));
  }
});

test('UI text uses Western digits only', () => {
  const all = JSON.stringify([STRINGS, MEAL_NAMES, UNIT_NAMES]);
  assert.doesNotMatch(all, /[٠-٩۰-۹]/);
});

test('makeT picks the language and fills variables', () => {
  assert.equal(makeT('en')('copiedN', { n: 3 }), '3 foods copied');
  assert.equal(makeT('ar')('today'), 'اليوم');
  assert.equal(makeT('ku')('today'), 'ئەڤرۆ');
  assert.equal(makeT('en')('missing_key'), 'missing_key');
});

test('Badini and Arabic are right-to-left', () => {
  assert.equal(isRtl('ku'), true);
  assert.equal(isRtl('ar'), true);
  assert.equal(isRtl('en'), false);
});

test('calendar names are complete', () => {
  for (const lang of ['ku', 'ar', 'en']) {
    assert.equal(DAY_SHORT[lang].length, 7);
    assert.equal(DAY_LONG[lang].length, 7);
    assert.equal(MONTHS[lang].length, 12);
  }
});
