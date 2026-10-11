import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmt, fmt1, fmtQty, parseNumber } from '../js/ui/dom.js';

test('fmt and fmt1 use Western digits', () => {
  assert.equal(fmt(2470.4), '2,470');
  assert.equal(fmt1(15.75), '15.8');
  assert.equal(fmt1(3), '3');
});

test('fmtQty shows fractions and isolates mixed numbers for RTL', () => {
  assert.equal(fmtQty(0.5), '½');
  assert.equal(fmtQty(1.5), '⁦1½⁩');
  assert.equal(fmtQty(2), '2');
  assert.equal(fmtQty(1.2), '1.2');
});

test('parseNumber accepts Western, Arabic and Persian digits and comma decimals', () => {
  assert.equal(parseNumber('82.5'), 82.5);
  assert.equal(parseNumber('٨٢٫٥'), 82.5);
  assert.equal(parseNumber('۷۵'), 75);
  assert.equal(parseNumber('1,5'), 1.5);
  assert.ok(Number.isNaN(parseNumber('abc')));
  assert.ok(Number.isNaN(parseNumber('')));
  assert.ok(Number.isNaN(parseNumber('-5')));
});
