import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toKey, fromKey, addDays, weekStart, weekKeys, monthGrid, isValidKey,
} from '../js/core/dates.js';

test('toKey uses local date parts, zero padded', () => {
  assert.equal(toKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('fromKey returns local midnight for the key', () => {
  const d = fromKey('2026-10-12');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 9);
  assert.equal(d.getDate(), 12);
  assert.equal(d.getHours(), 0);
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('weekStart returns the Saturday on or before the date', () => {
  assert.equal(weekStart('2026-10-10'), '2026-10-10'); // Saturday
  assert.equal(weekStart('2026-10-12'), '2026-10-10'); // Monday
  assert.equal(weekStart('2026-10-16'), '2026-10-10'); // Friday
  assert.equal(weekStart('2026-10-17'), '2026-10-17'); // next Saturday
});

test('weekKeys returns 7 consecutive days Saturday to Friday', () => {
  const keys = weekKeys('2026-10-12');
  assert.equal(keys.length, 7);
  assert.equal(keys[0], '2026-10-10');
  assert.equal(keys[6], '2026-10-16');
});

test('monthGrid starts on Saturday and pads with nulls', () => {
  const grid = monthGrid(2026, 9); // October 2026 starts on Thursday
  assert.equal(grid.length % 7, 0);
  // Sat, Sun, Mon, Tue, Wed are empty, Thu is the 1st
  assert.deepEqual(grid.slice(0, 6), [null, null, null, null, null, '2026-10-01']);
  assert.ok(grid.includes('2026-10-31'));
  assert.ok(!grid.includes('2026-11-01'));
});

test('isValidKey accepts real dates only', () => {
  assert.equal(isValidKey('2026-02-28'), true);
  assert.equal(isValidKey('2026-02-30'), false);
  assert.equal(isValidKey('hello'), false);
  assert.equal(isValidKey(42), false);
});
