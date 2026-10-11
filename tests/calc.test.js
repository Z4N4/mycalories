import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bmr, tdee, dailyGoal, macroTargets, gramsFor, nutritionFor, sumEntries, periodSummary,
} from '../js/core/calc.js';

const man = { sex: 'male', age: 30, heightCm: 180, weightKg: 80, activity: 'moderate', goal: 'keep', customGoal: null };
const woman = { sex: 'female', age: 30, heightCm: 165, weightKg: 60, activity: 'sedentary', goal: 'lose', customGoal: null };

test('bmr uses Mifflin-St Jeor', () => {
  assert.equal(bmr(man), 1780); // 800 + 1125 - 150 + 5
  assert.equal(Math.round(bmr(woman)), 1320); // 600 + 1031.25 - 150 - 161
});

test('tdee multiplies by activity factor', () => {
  assert.equal(Math.round(tdee(man)), Math.round(1780 * 1.55));
});

test('dailyGoal applies goal adjustment and rounds to 10', () => {
  assert.equal(dailyGoal(man), 2760);
  assert.equal(dailyGoal({ ...man, goal: 'lose' }), 2260);
  assert.equal(dailyGoal({ ...man, goal: 'gain' }), 3060);
});

test('dailyGoal never goes below the safe minimum', () => {
  const small = { ...woman, weightKg: 45, heightCm: 150, age: 60 };
  assert.equal(dailyGoal(small), 1200);
});

test('dailyGoal uses customGoal when set', () => {
  assert.equal(dailyGoal({ ...man, customGoal: 1800 }), 1800);
});

test('macroTargets splits 25/45/30', () => {
  assert.deepEqual(macroTargets(2000), { p: 125, c: 225, f: 67 });
});

const food = {
  id: 'dolma', per100: { kcal: 160, p: 4.5, c: 20, f: 7 },
  portions: [{ unit: 'piece', g: 35 }, { unit: 'plate', g: 350 }], grams: true,
};

test('gramsFor converts portions and grams', () => {
  assert.equal(gramsFor(food, 'plate', 1), 350);
  assert.equal(gramsFor(food, 'piece', 4), 140);
  assert.equal(gramsFor(food, 'g', 120), 120);
  assert.equal(gramsFor(food, 'unknown', 2), 0);
});

test('nutritionFor scales per-100g values', () => {
  assert.deepEqual(nutritionFor(food, 350), { kcal: 560, p: 15.8, c: 70, f: 24.5 });
});

test('sumEntries totals entries and tolerates empty input', () => {
  const totals = sumEntries([{ kcal: 100, p: 1, c: 2, f: 3 }, { kcal: 50.4, p: 1.25, c: 0, f: 0 }]);
  assert.deepEqual(totals, { kcal: 150, p: 2.3, c: 2, f: 3 });
  assert.deepEqual(sumEntries(undefined), { kcal: 0, p: 0, c: 0, f: 0 });
});

test('periodSummary averages only logged days', () => {
  const log = {
    '2026-10-10': [{ kcal: 2000, p: 0, c: 0, f: 0 }],
    '2026-10-11': [{ kcal: 1000, p: 0, c: 0, f: 0 }],
  };
  const s = periodSummary(log, ['2026-10-10', '2026-10-11', '2026-10-12'], 1800);
  assert.equal(s.total, 3000);
  assert.equal(s.loggedDays, 2);
  assert.equal(s.average, 1500);
  assert.equal(s.goalTotal, 5400);
  assert.equal(s.overDays, 1);
  assert.deepEqual(s.days.map((d) => d.kcal), [2000, 1000, 0]);
});
