import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, searchFoods } from '../js/core/search.js';

const foods = [
  { id: 'dolma', n: { en: 'Dolma', ar: 'دولمة', ku: 'دۆلمە' }, keys: 'yaprakh' },
  { id: 'kubba', n: { en: 'Kubba Mosul', ar: 'كبة موصلية', ku: 'کوبەیا موسلێ' }, keys: '' },
  { id: 'rice', n: { en: 'Rice with vermicelli', ar: 'تمن بالشعرية', ku: 'برنج ب شەعریێ' }, keys: 'timman' },
  { id: 'c1', name: 'Mom kubba', keys: '' },
];

test('normalize unifies Arabic and Kurdish letter variants', () => {
  assert.equal(normalize('دولمة'), normalize('دۆلمە'));
  assert.equal(normalize('كبة'), normalize('کبە'));
  assert.equal(normalize('  DOLMA '), 'dolma');
  assert.equal(normalize('أرز'), normalize('ارز'));
});

test('searchFoods finds the same food in all three languages', () => {
  for (const q of ['dol', 'دولم', 'دۆلم', 'yaprakh']) {
    assert.equal(searchFoods(foods, q)[0].id, 'dolma', q);
  }
});

test('searchFoods ranks prefix matches before inner matches', () => {
  const ids = searchFoods(foods, 'kubba').map((f) => f.id);
  assert.deepEqual(ids, ['kubba', 'c1']);
});

test('searchFoods matches every word in any order', () => {
  assert.equal(searchFoods(foods, 'vermicelli rice')[0].id, 'rice');
});

test('searchFoods returns all foods for an empty query', () => {
  assert.equal(searchFoods(foods, '   ').length, 4);
});
