import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  photoPrompt, linesPrompt, lookupPrompt, parseAiJson, cleanAiItems, matchAiItems, lookupToCustomFoods,
} from '../js/core/ai.js';
import { buildFoods } from '../js/foods/index.js';
import { createInitialState } from '../js/core/store.js';

const foods = buildFoods(createInitialState());

test('prompts are short (the free plans limit tokens per minute)', () => {
  assert.ok(photoPrompt().length < 2200, `photo prompt ${photoPrompt().length} chars`);
  assert.ok(linesPrompt(['2 kubba hamuth', 'a bit of my mom\'s biryani']).includes('mom'));
  assert.ok(lookupPrompt('Starbucks caramel frappuccino').includes('Starbucks'));
});

test('parseAiJson copes with thinking, code fences and extra text', () => {
  const raw = '<think>looking…</think>Here you go:\n```json\n{"items":[{"name":"lemon","grams":100}]}\n```';
  assert.deepEqual(parseAiJson(raw), { items: [{ name: 'lemon', grams: 100 }] });
  assert.throws(() => parseAiJson('I cannot see any food'));
});

test('cleanAiItems keeps sane values and drops broken ones', () => {
  const items = cleanAiItems({
    items: [
      { name: 'Lemon', grams: 100, kcal100: 29, protein100: 1.1, carbs100: 9, fat100: 0.3, confidence: 'high' },
      { name: '', grams: 50 },
      { name: 'Huge', grams: 99999, kcal100: 100 },
      { name: 'Impossible', grams: 100, kcal100: 5000 },
      { name: 'No numbers', grams: 100 },
    ],
  });
  assert.equal(items[0].name, 'Lemon');
  assert.equal(items[0].per100.kcal, 29);
  assert.equal(items.find((i) => i.name === 'Huge').grams, 2000);
  assert.equal(items.find((i) => i.name === 'Impossible').per100, null);
  assert.equal(items.find((i) => i.name === 'No numbers').per100, null);
  assert.equal(items.length, 4);
});

test('matchAiItems uses the app\'s own foods when the name matches well', () => {
  const items = cleanAiItems({
    items: [
      { name: 'lemon', grams: 100, kcal100: 29, protein100: 1, carbs100: 9, fat100: 0.3 },
      { name: 'dolma', grams: 300, kcal100: 150, protein100: 4, carbs100: 20, fat100: 6 },
      { name: 'Turkish pistachio roll cake', grams: 80, kcal100: 410, protein100: 6, carbs100: 50, fat100: 20 },
      { name: 'Mystery thing', grams: 100 },
    ],
  });
  const matched = matchAiItems(items, foods);
  assert.equal(matched[0].food.id, 'lemon');
  assert.equal(matched[0].custom, false);
  assert.equal(matched[1].food.id, 'dolma');
  assert.equal(matched[2].custom, true);
  assert.equal(matched[2].food.per100.kcal, 410);
  assert.equal(matched.length, 3); // nothing usable for the mystery item
});

test('lookupToCustomFoods turns AI lookup answers into per-serving custom foods', () => {
  const list = lookupToCustomFoods(cleanAiItems({
    items: [{ name: 'Caramel Frappuccino', brand: 'Starbucks', serving_name: 'grande', serving_grams: 470, kcal100: 81, protein100: 1, carbs100: 13, fat100: 3 }],
  }));
  assert.equal(list[0].name, 'Caramel Frappuccino (Starbucks)');
  assert.equal(list[0].servingG, 470);
  assert.equal(list[0].kcal, 381);
  assert.equal(list[0].servingName, 'grande');
});

test('a partial name match does not replace the AI\'s own numbers', () => {
  const items = cleanAiItems({
    items: ['cola', 'ice', 'grape', 'pepper', 'lamb', 'corn', 'date'].map((name) => ({ name, grams: 100, kcal100: 50, protein100: 1, carbs100: 10, fat100: 0 })),
  });
  const matched = matchAiItems(items, foods);
  for (const m of matched) {
    const ok = m.custom || ['cola', 'grapes', 'pepper', 'lamb', 'corn', 'dates'].includes(m.food.id);
    assert.ok(ok, `${m.food.name ?? m.food.id} used for a partial match`);
  }
  assert.notEqual(matched[0].food.id, 'cola_diet'); // cola is not "Diet cola"
});

test('no-number items only use a close app food, never a far guess', () => {
  const matched = matchAiItems(cleanAiItems({ items: [{ name: 'beer', grams: 330 }] }), foods);
  assert.equal(matched.length, 0);
});
