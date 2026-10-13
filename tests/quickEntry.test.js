import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitItems, parseItem, parseQuickEntry, looksLikeQuickEntry, resolveAmount, detectMeal, suggestFoods } from '../js/core/quickEntry.js';
import { buildFoods } from '../js/foods/index.js';
import { normalize } from '../js/core/search.js';
import { createInitialState } from '../js/core/store.js';

const foods = buildFoods(createInitialState());

test('splitItems splits on and / commas / plus / و in any language', () => {
  assert.deepEqual(splitItems('200g rice and 100g chicken breast'), ['200g rice', '100g chicken breast']);
  assert.deepEqual(splitItems('2 samoon, 1 tea + an apple'), ['2 samoon', '1 tea', 'an apple']);
  assert.deepEqual(splitItems('200 غرام تمن و 100 غرام دجاج'), ['200 غرام تمن', '100 غرام دجاج']);
  assert.deepEqual(splitItems('برنج، هێک\nچای'), ['برنج', 'هێک', 'چای']);
});

test('parseItem reads amount, unit and food words', () => {
  assert.deepEqual(parseItem('200g rice'), { qty: 200, unit: 'g', query: 'rice' });
  assert.deepEqual(parseItem('rice 200 grams'), { qty: 200, unit: 'g', query: 'rice' });
  assert.deepEqual(parseItem('0.5kg chicken'), { qty: 500, unit: 'g', query: 'chicken' });
  assert.deepEqual(parseItem('2 samoon'), { qty: 2, unit: null, query: 'samoon' });
  assert.deepEqual(parseItem('half plate dolma'), { qty: 0.5, unit: 'plate', query: 'dolma' });
  assert.deepEqual(parseItem('1½ plates of biryani'), { qty: 1.5, unit: 'plate', query: 'biryani' });
  assert.deepEqual(parseItem('two eggs'), { qty: 2, unit: null, query: 'eggs' });
  assert.deepEqual(parseItem('٢٠٠ غرام تمن'), { qty: 200, unit: 'g', query: normalize('تمن') });
  assert.deepEqual(parseItem('صحن دولمة'), { qty: 1, unit: 'plate', query: normalize('دولمة') });
  assert.deepEqual(parseItem('نیڤ قاپ برنج'), { qty: 0.5, unit: 'plate', query: normalize('برنج') });
  assert.deepEqual(parseItem('دوو هێک'), { qty: 2, unit: null, query: normalize('هێک') });
  assert.deepEqual(parseItem('ملعقة كبيرة عسل'), { qty: 1, unit: 'tbsp', query: normalize('عسل') });
  assert.deepEqual(parseItem('a can of pepsi'), { qty: 1, unit: 'can', query: 'pepsi' });
});

const pick = (text) => parseQuickEntry(text, foods).map((i) => ({ id: i.food?.id ?? null, unit: i.unit, qty: i.qty, grams: i.grams }));

test('the example from the request: 200g rice and 100g chicken breast', () => {
  const [rice, chicken] = pick('200g rice and 100g chicken breast');
  assert.equal(rice.id, 'timman');
  assert.equal(rice.unit, 'g');
  assert.equal(rice.grams, 200);
  assert.equal(chicken.id, 'chicken_breast');
  assert.equal(chicken.grams, 100);
});

test('counts use the food\'s natural portion; plurals and other languages match', () => {
  const [samoon, eggs, tea] = pick('2 samoon, 2 eggs, 1 tea');
  assert.deepEqual([samoon.id, samoon.unit, samoon.qty], ['samoon', 'piece', 2]);
  assert.deepEqual([eggs.id, eggs.unit, eggs.qty], ['egg_boiled', 'piece', 2]);
  assert.equal(tea.id, 'tea_sugar');
  assert.equal(pick('نیڤ قاپ دۆلمە')[0].id, 'dolma');
  assert.equal(pick('نیڤ قاپ دۆلمە')[0].grams, 180);
  assert.equal(pick('200 غرام صدر دجاج')[0].id, 'chicken_breast');
});

test('"with" splits into two foods only when the phrase is not one dish', () => {
  assert.deepEqual(pick('2 samoon with cheese').map((i) => i.id), ['samoon', 'cheese_white']);
  assert.deepEqual(pick('rice with vermicelli').map((i) => i.id), ['timman_shariya']);
  assert.deepEqual(pick('سەموون ب پەنیری').map((i) => i.id).length, 2);
});

test('spelling endings and Badini "-ەک" are understood', () => {
  assert.equal(pick('مرقة باميا')[0].id, 'bamya');
  assert.equal(pick('صمونة')[0].id, 'samoon');
  assert.deepEqual(pick('سەموونەک').map((i) => [i.id, i.qty]), [['samoon', 1]]);
  assert.equal(pick('کاسەک فاسۆلیا')[0].id, 'fasolia_yabsa'); // a bowl → the stew
  assert.equal(pick('1 lays')[0].id, 'lays_classic');
  assert.equal(pick('استكان چاي')[0].id, 'tea_sugar');
});

test('a unit the food doesn\'t have falls back to its own portion', () => {
  const [item] = pick('1 plate samoon');
  assert.equal(item.id, 'samoon');
  assert.equal(item.unit, 'piece');
});

test('unknown words come back unmatched, with the original text', () => {
  const items = parseQuickEntry('200g zxqwv', foods);
  assert.equal(items[0].food, null);
  assert.equal(items[0].text, '200g zxqwv');
});

test('every matched item has calories and alternatives to choose from', () => {
  const items = parseQuickEntry('rice, chicken, bread', foods);
  for (const it of items) {
    assert.ok(it.food, it.text);
    assert.ok(it.kcal > 0, it.text);
    assert.ok(it.candidates.length >= 2, `${it.text} candidates`);
  }
});

test('looksLikeQuickEntry spots amounts and lists, not plain searches', () => {
  assert.equal(looksLikeQuickEntry('200g rice'), true);
  assert.equal(looksLikeQuickEntry('rice and chicken'), true);
  assert.equal(looksLikeQuickEntry('دولمة و تمن'), true);
  assert.equal(looksLikeQuickEntry('dolma'), false);
  assert.equal(looksLikeQuickEntry('kubba mosul'), false);
});

test('choosing a food for an unknown line uses its own portion, not 1 gram', () => {
  const [item] = parseQuickEntry('1 zzqx', foods);
  assert.equal(item.food, null);
  assert.equal(item.unit, null);
  const apple = foods.find((f) => f.id === 'apple');
  const fixed = resolveAmount(apple, item.typedUnit, item.typedQty);
  assert.equal(fixed.unit, 'medium');
  assert.equal(fixed.qty, 1);
  assert.equal(fixed.grams, 180);
});

test('comma decimals and thousands are numbers, not separators', () => {
  const [a] = pick('1,5 plates biryani');
  assert.deepEqual([a.id, a.unit, a.qty], ['biryani_chicken', 'plate', 1.5]);
  assert.equal(pick('١,٥ صحن برياني')[0].qty, 1.5);
  assert.equal(pick('1,000g rice')[0].grams, 1000);
  assert.equal(pick('rice, tea').length, 2);
});

test('plural and Arabic word forms still find the everyday food', () => {
  assert.equal(pick('دجاجة')[0].id, 'grilled_chicken');
  assert.equal(pick('2 teas')[0].id, 'tea_sugar');
  assert.equal(pick('3 kebabs')[0].id, 'kebab');
});

test('a food whose own name contains "and"/"و"/"&" stays one food', () => {
  assert.deepEqual(pick('قاپەک برنج و مریشک').map((i) => i.id), ['chicken_rice']);
  assert.deepEqual(pick('tea with milk & sugar').map((i) => i.id), ['milk_tea']);
});

test('a unit word that belongs to the food name is kept in the name', () => {
  assert.equal(pick('chicken sandwich')[0].id.includes('sandwich') || pick('chicken sandwich')[0].id.includes('shawarma') || pick('chicken sandwich')[0].id.includes('tikka'), true);
  const [sugar] = pick('2 tea spoons sugar');
  assert.deepEqual([sugar.id, sugar.unit, sugar.qty], ['sugar', 'tsp', 2]);
});

test('mixed fractions, litres and capped amounts', () => {
  const [d] = pick('1 1/2 plate dolma');
  assert.deepEqual([d.id, d.qty], ['dolma', 1.5]);
  const [w] = pick('1.5L water');
  assert.deepEqual([w.id, w.grams], ['water', 1500]);
  const [huge] = pick('1000000 samoon');
  assert.ok(huge.qty <= 50, `qty ${huge.qty}`);
  assert.equal(pick('7up')[0].id, 'soda_lemon');
});

test('no commas needed: a new number starts a new food', () => {
  assert.deepEqual(pick('2 samoon 1 tea').map((i) => i.id), ['samoon', 'tea_sugar']);
  assert.deepEqual(pick('200g rice 100g chicken breast').map((i) => i.id), ['timman', 'chicken_breast']);
  assert.equal(pick('rice 200g').length, 1); // amount after the food is still one item
  assert.deepEqual(pick('1 1/2 plate dolma').map((i) => i.qty), [1.5]);
});

test('chatty words are ignored in all three languages', () => {
  assert.deepEqual(pick('I ate 2 samoon and had a tea today').map((i) => i.id), ['samoon', 'tea_sugar']);
  assert.deepEqual(pick('أكلت صحن تمن وشربت استكان چاي').map((i) => i.id), ['timman', 'tea_sugar']);
  assert.deepEqual(pick('من دوو هێک خوارن').map((i) => i.id), ['egg_boiled']);
});

test('small typos still find the food', () => {
  assert.equal(pick('200g chiken breast')[0].id, 'chicken_breast');
  assert.equal(pick('2 samon')[0].id, 'samoon');
  assert.equal(pick('biriyani')[0].id.startsWith('biryani'), true);
  assert.equal(pick('دولمه')[0].id, 'dolma');
});

test('meal words pick the meal', () => {
  assert.equal(detectMeal('for breakfast I had 2 eggs'), 'breakfast');
  assert.equal(detectMeal('غداء: صحن تمن'), 'lunch');
  assert.equal(detectMeal('شیڤ: کەباب'), 'dinner');
  assert.equal(detectMeal('2 samoon'), null);
});

test('suggestions for the word being typed', () => {
  const s = suggestFoods(foods, '200g ric').map((f) => f.id);
  assert.ok(s.includes('timman'), s.join(' '));
  assert.equal(suggestFoods(foods, '200g ').length, 0);
});

test('suggestions for a two-word name do not jump to an everyday word', () => {
  const s = suggestFoods(foods, 'for lunch I ate 200g chiken bre').map((f) => f.id);
  assert.equal(s[0], 'chicken_breast');
});

test('amounts written after the food are split correctly', () => {
  assert.deepEqual(pick('rice 200g chicken 100g').map((i) => [i.id, i.grams]), [['timman', 200], ['grilled_chicken', 100]]);
  assert.deepEqual(pick('eggs 3 tea 1').map((i) => [i.id, i.qty]), [['egg_boiled', 3], ['tea_sugar', 1]]);
  assert.deepEqual(pick('1 can pepsi 330 ml').map((i) => i.id), ['pepsi']);
  assert.deepEqual(pick('kubba 2 pieces').map((i) => [i.id, i.qty]), [['kubba_halab', 2]]);
  assert.equal(pick('برنج 200 غرام مریشک 100 غرام').length, 2);
});

test('fuzzy guesses are marked weak so the AI can check them', () => {
  assert.equal(pick('coke')[0].id, 'cola'); // an everyday word, not "cake"
  const [cak] = parseQuickEntry('kake', foods);
  assert.ok(!cak.food || cak.weak);
  const [beer] = parseQuickEntry('beer', foods);
  assert.ok(!beer.food || beer.weak, `beer → ${beer.food?.id}`);
  assert.equal(parseQuickEntry('2 samon', foods)[0].weak, true);
  assert.equal(parseQuickEntry('2 samoon', foods)[0].weak, false);
});

test('the drink sharbat is not removed as "I drank"', () => {
  assert.equal(pick('شربت زبيب')[0].id, 'zbeeb');
  assert.deepEqual(pick('أكلت صحن تمن وشربت استكان چاي').map((i) => i.id), ['timman', 'tea_sugar']);
});
