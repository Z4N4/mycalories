import { test } from 'node:test';
import assert from 'node:assert/strict';
import RECIPES from '../js/foods/recipes.js';
import { BUILT_IN, buildFoods } from '../js/foods/index.js';
import { parseRecipe, recipeTotals } from '../js/core/recipes.js';
import { createInitialState, setRecipe, clearRecipe, parseBackup } from '../js/core/store.js';

const builtById = new Map(BUILT_IN.map((f) => [f.id, f]));

test('every recipe uses known, non-recipe ingredients and a real portion unit', () => {
  for (const [id, [unit, spec]] of Object.entries(RECIPES)) {
    const dish = builtById.get(id);
    assert.ok(dish, `recipe for unknown dish ${id}`);
    assert.ok(dish.portions.some((p) => p.unit === unit), `${id}: unit ${unit} not in portions`);
    for (const { id: ing, g } of parseRecipe(spec)) {
      assert.ok(builtById.has(ing), `${id}: unknown ingredient ${ing}`);
      assert.ok(!RECIPES[ing], `${id}: ingredient ${ing} is itself a recipe`);
      assert.ok(g > 0 && g <= 500, `${id}: ${ing} ${g} g`);
    }
  }
});

test('there are at least 90 recipes', () => {
  assert.ok(Object.keys(RECIPES).length >= 90);
});

test('recipe calories stay close to the reference value of each dish', () => {
  const foods = new Map(buildFoods(createInitialState()).map((f) => [f.id, f]));
  for (const id of Object.keys(RECIPES)) {
    const fromRecipe = foods.get(id).per100.kcal;
    const reference = builtById.get(id).per100.kcal;
    const ratio = fromRecipe / reference;
    assert.ok(ratio > 0.65 && ratio < 1.35, `${id}: recipe ${Math.round(fromRecipe)} vs ${reference} kcal/100 g`);
  }
});

test('recipeTotals adds up ingredients', () => {
  const t = recipeTotals([{ id: 'rice_plain', g: 100 }, { id: 'veg_oil', g: 10 }], builtById);
  assert.equal(t.grams, 110);
  assert.equal(Math.round(t.kcal), 130 + 88);
});

test('buildFoods turns a recipe into per-100 g values and sets the portion weight', () => {
  const foods = new Map(buildFoods(createInitialState()).map((f) => [f.id, f]));
  const timman = foods.get('timman');
  assert.equal(timman.recipe.unit, 'plate');
  assert.equal(timman.portions.find((p) => p.unit === 'plate').g, 300);
  assert.equal(timman.portions.find((p) => p.unit === 'halfPlate').g, 150);
  assert.equal(Math.round(timman.per100.kcal), Math.round((285 * 1.3 + 15 * 8.84) / 3));
});

test("the user's own recipe replaces the default and can be reset", () => {
  const mine = [{ id: 'samoon', g: 80 }, { id: 'chicken_thigh', g: 150 }];
  let state = setRecipe(createInitialState(), 'shawarma_chicken', mine);
  let food = buildFoods(state).find((f) => f.id === 'shawarma_chicken');
  assert.equal(food.edited, true);
  assert.equal(food.portions.find((p) => p.unit === 'sandwich').g, 230);
  assert.equal(food.recipe.items.length, 2);
  state = clearRecipe(state, 'shawarma_chicken');
  food = buildFoods(state).find((f) => f.id === 'shawarma_chicken');
  assert.equal(food.edited, undefined);
  assert.ok(food.recipe.items.length > 2);
});

test('a recipe whose ingredients no longer exist stays editable and resettable', () => {
  const state = setRecipe(createInitialState(), 'dolma', [{ id: 'c_deleted', g: 100 }]);
  const dolma = buildFoods(state).find((f) => f.id === 'dolma');
  assert.ok(dolma.recipe);
  assert.equal(dolma.edited, true);
  assert.ok(dolma.per100.kcal > 0);
});

test('plan swaps survive saving and loading', () => {
  const raw = { version: 1, planSwaps: { '2026-10-12': { lunch: 2, bogus: 1, dinner: -1 }, notADate: { lunch: 1 } } };
  const s = parseBackup(JSON.stringify(raw));
  assert.deepEqual(s.planSwaps, { '2026-10-12': { lunch: 2 } });
});

test('parseBackup keeps valid recipes and drops broken ones', () => {
  const raw = {
    version: 1,
    recipes: {
      dolma: [['rice_plain', 100], ['veg_oil', 10]],
      bad: 'nope',
      broken: [['rice_plain', -5]],
    },
  };
  const s = parseBackup(JSON.stringify(raw));
  assert.deepEqual(s.recipes.dolma, [{ id: 'rice_plain', g: 100 }, { id: 'veg_oil', g: 10 }]);
  assert.equal(s.recipes.bad, undefined);
  assert.equal(s.recipes.broken, undefined);
});
