import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt, parseAiResult, isPlausibleKey } from '../js/core/photoAi.js';
import { BUILT_IN } from '../js/foods/index.js';

const byId = new Map(BUILT_IN.map((f) => [f.id, f]));

test('buildPrompt lists every built-in food id', () => {
  const prompt = buildPrompt(BUILT_IN);
  assert.match(prompt, /dolma: Dolma/);
  assert.match(prompt, /samoon: Samoon/);
  assert.ok(prompt.split('\n').length > BUILT_IN.length);
});

test('parseAiResult maps known foods and computes calories from the database', () => {
  const text = JSON.stringify({ items: [{ id: 'dolma', name: 'Dolma', grams: 300, confidence: 'high' }] });
  const [item] = parseAiResult(text, byId);
  assert.equal(item.food.id, 'dolma');
  assert.equal(item.grams, 300);
  assert.equal(item.custom, false);
});

test('parseAiResult keeps unknown foods with AI nutrition values', () => {
  const text = '```json\n{"items":[{"id":"other","name":"Kurdish soup","grams":250,"kcal100":80,"protein100":3,"carbs100":10,"fat100":3,"confidence":"low"}]}\n```';
  const [item] = parseAiResult(text, byId);
  assert.equal(item.custom, true);
  assert.equal(item.food.name, 'Kurdish soup');
  assert.equal(item.food.per100.kcal, 80);
  assert.equal(item.confidence, 'low');
});

test('parseAiResult clamps grams and drops broken items', () => {
  const text = JSON.stringify({
    items: [
      { id: 'samoon', name: 'Samoon', grams: 99999, confidence: 'high' },
      { id: 'other', name: 'Mystery', grams: 100, confidence: 'low' }, // no nutrition
      { id: 'other', name: '', grams: 100, kcal100: 100, confidence: 'low' }, // no name
      { id: 'samoon', grams: -4 },
    ],
  });
  const items = parseAiResult(text, byId);
  assert.equal(items.length, 1);
  assert.equal(items[0].grams, 2000);
});

test('parseAiResult throws on text that is not JSON', () => {
  assert.throws(() => parseAiResult('sorry, I cannot', byId));
});

test('isPlausibleKey accepts key-shaped strings only', () => {
  assert.equal(isPlausibleKey('AIzaSyA1234567890abcdefghijklmnopqrstu'), true);
  assert.equal(isPlausibleKey('short'), false);
  assert.equal(isPlausibleKey('has spaces in it and is long enough'), false);
});
