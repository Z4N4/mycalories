import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT_IN, CATEGORIES, customToFood, buildFoods, foodName, entryName } from '../js/foods/index.js';
import { UNIT_NAMES, CATEGORY_NAMES } from '../js/i18n/strings.js';
import { createInitialState, setOverride, saveCustomFood } from '../js/core/store.js';

test('there are at least 200 built-in foods with unique ids', () => {
  assert.ok(BUILT_IN.length >= 200, `only ${BUILT_IN.length} foods`);
  const ids = new Set(BUILT_IN.map((f) => f.id));
  assert.equal(ids.size, BUILT_IN.length);
});

test('every food has names in all three languages', () => {
  for (const f of BUILT_IN) {
    for (const lang of ['en', 'ar', 'ku']) assert.ok(f.n[lang]?.trim(), `${f.id} missing ${lang}`);
  }
});

test('every food has a known category, known units and sane numbers', () => {
  for (const f of BUILT_IN) {
    assert.ok(CATEGORIES.includes(f.cat), `${f.id} category ${f.cat}`);
    assert.ok(f.portions.length > 0, `${f.id} has no portions`);
    for (const p of f.portions) {
      assert.ok(UNIT_NAMES[p.unit], `${f.id} unknown unit ${p.unit}`);
      assert.ok(p.g > 0 && p.g <= 1000, `${f.id} portion ${p.unit} ${p.g}g`);
    }
    const { kcal, p, c, f: fat } = f.per100;
    assert.ok([kcal, p, c, fat].every((v) => Number.isFinite(v) && v >= 0), f.id);
    assert.ok(p + c + fat <= 100.5, `${f.id} macros exceed 100 g`);
  }
});

test('calories roughly match the macros (catches typos)', () => {
  for (const f of BUILT_IN) {
    const { kcal, p, c, f: fat } = f.per100;
    if (kcal < 40) continue;
    const fromMacros = 4 * p + 4 * c + 9 * fat;
    const ratio = fromMacros / kcal;
    assert.ok(ratio > 0.8 && ratio < 1.2, `${f.id}: ${kcal} kcal vs ${Math.round(fromMacros)} from macros`);
  }
});

test('every category has a name in every language', () => {
  for (const cat of [...CATEGORIES, 'custom']) {
    for (const lang of ['en', 'ar', 'ku']) assert.ok(CATEGORY_NAMES[cat]?.[lang], `${cat} ${lang}`);
  }
});

test('plates automatically get a half plate portion', () => {
  const dolma = BUILT_IN.find((f) => f.id === 'dolma');
  assert.deepEqual(dolma.portions.find((p) => p.unit === 'halfPlate'), { unit: 'halfPlate', g: 175 });
});

test('customToFood converts per-serving values to per 100 g', () => {
  const food = customToFood({ id: 'c_1', name: 'Mom kubba', kcal: 300, p: 12, c: 30, f: 15, servingG: 150 });
  assert.equal(food.per100.kcal, 200);
  assert.equal(food.grams, true);
  const noGrams = customToFood({ id: 'c_2', name: 'Snack', kcal: 120, p: 0, c: 30, f: 0 });
  assert.equal(noGrams.grams, false);
  assert.equal(noGrams.portions[0].g, 100);
  assert.equal(noGrams.per100.kcal, 120);
});

test('buildFoods applies overrides and lists custom foods first', () => {
  let state = setOverride(createInitialState(), 'samoon', { kcal: 999, p: 1, c: 1, f: 1 });
  state = saveCustomFood(state, { name: 'Mine', kcal: 100, p: 1, c: 1, f: 1, servingG: 0 });
  const foods = buildFoods(state);
  assert.equal(foods[0].name, 'Mine');
  const samoon = foods.find((f) => f.id === 'samoon');
  assert.equal(samoon.per100.kcal, 999);
  assert.equal(samoon.edited, true);
  assert.equal(BUILT_IN.find((f) => f.id === 'samoon').per100.kcal, 270);
});

test('number overrides are ignored for dishes that are calculated from ingredients', () => {
  const state = setOverride(createInitialState(), 'dolma', { kcal: 999, p: 1, c: 1, f: 1 });
  const dolma = buildFoods(state).find((f) => f.id === 'dolma');
  assert.notEqual(dolma.per100.kcal, 999);
  assert.ok(dolma.recipe);
});

test('foodName and entryName fall back sensibly', () => {
  const dolma = BUILT_IN.find((f) => f.id === 'dolma');
  assert.equal(foodName(dolma, 'ku'), 'دۆلمە');
  const byId = new Map([[dolma.id, dolma]]);
  assert.equal(entryName({ foodId: 'dolma' }, byId, 'ar'), 'دولمة');
  assert.equal(entryName({ foodId: 'gone', name: 'Old food' }, byId, 'en'), 'Old food');
  assert.equal(entryName({ foodId: 'gone', name: { en: 'X', ku: 'Y' } }, byId, 'ku'), 'Y');
});
