import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState, addEntry, updateEntry, removeEntry, copyMeal, toggleFavorite,
  saveCustomFood, deleteCustomFood, setOverride, clearOverride, setWeight, removeWeight,
  setProfile, setSettings, parseBackup, findCustomByBarcode, MAX_RECENT,
} from '../js/core/store.js';

const entry = (over = {}) => ({
  foodId: 'dolma', meal: 'lunch', unit: 'plate', qty: 1, grams: 350, kcal: 560, p: 15, c: 70, f: 24, ...over,
});

test('addEntry adds an entry with an id and does not mutate input', () => {
  const s0 = createInitialState();
  const s1 = addEntry(s0, '2026-10-12', entry());
  assert.equal(s0.log['2026-10-12'], undefined);
  assert.equal(s1.log['2026-10-12'].length, 1);
  assert.ok(s1.log['2026-10-12'][0].id);
  assert.deepEqual(s1.recent, ['dolma']);
});

test('recent foods are unique, newest first, and capped', () => {
  let s = createInitialState();
  for (let i = 0; i < MAX_RECENT + 5; i += 1) s = addEntry(s, '2026-10-12', entry({ foodId: `f${i}` }));
  s = addEntry(s, '2026-10-12', entry({ foodId: 'f10' }));
  assert.equal(s.recent.length, MAX_RECENT);
  assert.equal(s.recent[0], 'f10');
  assert.equal(s.recent.filter((id) => id === 'f10').length, 1);
});

test('updateEntry and removeEntry change only the target entry', () => {
  const s1 = addEntry(addEntry(createInitialState(), 'd', entry()), 'd', entry({ foodId: 'kubba' }));
  const [a, b] = s1.log.d;
  const s2 = updateEntry(s1, 'd', a.id, { qty: 2, kcal: 1120 });
  assert.equal(s2.log.d[0].kcal, 1120);
  assert.equal(s1.log.d[0].kcal, 560);
  const s3 = removeEntry(s2, 'd', b.id);
  assert.deepEqual(s3.log.d.map((e) => e.foodId), ['dolma']);
  const s4 = removeEntry(s3, 'd', a.id);
  assert.equal(s4.log.d, undefined);
});

test('copyMeal copies one meal with fresh ids', () => {
  let s = addEntry(createInitialState(), 'y', entry({ meal: 'breakfast', foodId: 'egg' }));
  s = addEntry(s, 'y', entry({ meal: 'lunch' }));
  s = copyMeal(s, 'y', 't', 'breakfast');
  assert.equal(s.log.t.length, 1);
  assert.equal(s.log.t[0].foodId, 'egg');
  assert.notEqual(s.log.t[0].id, s.log.y[0].id);
});

test('toggleFavorite adds and removes', () => {
  const s1 = toggleFavorite(createInitialState(), 'dolma');
  assert.deepEqual(s1.favorites, ['dolma']);
  assert.deepEqual(toggleFavorite(s1, 'dolma').favorites, []);
});

test('custom foods can be saved, updated and deleted', () => {
  const s1 = saveCustomFood(createInitialState(), { name: 'Mom kubba', kcal: 300, p: 10, c: 30, f: 12, servingG: 150 });
  const food = s1.customFoods[0];
  assert.match(food.id, /^c_/);
  const s2 = saveCustomFood(toggleFavorite(s1, food.id), { ...food, kcal: 320 });
  assert.equal(s2.customFoods.length, 1);
  assert.equal(s2.customFoods[0].kcal, 320);
  const s3 = deleteCustomFood(s2, food.id);
  assert.equal(s3.customFoods.length, 0);
  assert.deepEqual(s3.favorites, []);
});

test('findCustomByBarcode finds a saved product', () => {
  const s = saveCustomFood(createInitialState(), { name: 'Juice', barcode: '5449000000996', kcal: 100, p: 0, c: 25, f: 0, servingG: 250 });
  assert.equal(findCustomByBarcode(s, '5449000000996').name, 'Juice');
  assert.equal(findCustomByBarcode(s, '96385074'), undefined);
});

test('parseBackup keeps a valid barcode and drops a bad one', () => {
  const raw = {
    version: 1,
    customFoods: [
      { id: 'c_a', name: 'A', barcode: '5449000000996', kcal: 1, p: 0, c: 0, f: 0 },
      { id: 'c_b', name: 'B', barcode: '<script>', kcal: 1, p: 0, c: 0, f: 0 },
    ],
  };
  const s = parseBackup(JSON.stringify(raw));
  assert.equal(s.customFoods[0].barcode, '5449000000996');
  assert.equal(s.customFoods[1].barcode, '');
});

test('overrides can be set and cleared', () => {
  const s1 = setOverride(createInitialState(), 'dolma', { kcal: 180, p: 5, c: 20, f: 9 });
  assert.equal(s1.overrides.dolma.kcal, 180);
  assert.equal(clearOverride(s1, 'dolma').overrides.dolma, undefined);
});

test('setWeight updates profile weight only for the latest date', () => {
  let s = setWeight(createInitialState(), '2026-10-12', 80);
  assert.equal(s.profile.weightKg, 80);
  s = setWeight(s, '2026-10-01', 85);
  assert.equal(s.profile.weightKg, 80);
  s = removeWeight(s, '2026-10-12');
  assert.equal(s.weights['2026-10-12'], undefined);
  assert.equal(s.profile.weightKg, 85);
});

test('setProfile and setSettings merge values', () => {
  const s = setSettings(setProfile(createInitialState(), { age: 40 }), { lang: 'en' });
  assert.equal(s.profile.age, 40);
  assert.equal(s.settings.lang, 'en');
});

test('parseBackup accepts a valid export and rejects garbage', () => {
  const s = addEntry(createInitialState(), '2026-10-12', entry());
  const restored = parseBackup(JSON.stringify(s));
  assert.equal(restored.log['2026-10-12'].length, 1);
  assert.throws(() => parseBackup('not json'));
  assert.throws(() => parseBackup('{"hello":1}'));
  assert.throws(() => parseBackup(JSON.stringify({ ...s, log: { bad: [] } })));
});

test('parseBackup keeps only known fields and sane values', () => {
  const raw = {
    version: 1,
    log: { '2026-10-12': [entry({ id: 'a', evil: '<img>' }), entry({ id: 'b', kcal: -5 }), entry({ id: 'c', qty: 0 })] },
    customFoods: [
      { id: 'c_ok', name: 'Mine', kcal: 100, p: 1, c: 1, f: 1, servingG: 150, junk: 1 },
      { id: 'c_tiny', name: 'Tiny', kcal: 100, p: 1, c: 1, f: 1, servingG: 0.001 },
      { id: 'dolma', name: 'Clash', kcal: 100, p: 1, c: 1, f: 1 },
    ],
  };
  const s = parseBackup(JSON.stringify(raw));
  assert.deepEqual(s.log['2026-10-12'].map((e) => e.id), ['a']);
  assert.equal(s.log['2026-10-12'][0].evil, undefined);
  assert.deepEqual(s.customFoods.map((f) => f.id), ['c_ok']);
  assert.equal(s.customFoods[0].junk, undefined);
});

test('parseBackup drops malformed entries and fills missing fields', () => {
  const raw = { version: 1, log: { '2026-10-12': [entry({ id: 'x' }), { kcal: 'lots' }] } };
  const restored = parseBackup(JSON.stringify(raw));
  assert.equal(restored.log['2026-10-12'].length, 1);
  assert.equal(restored.settings.lang, 'ku');
  assert.deepEqual(restored.favorites, []);
});
