import { test } from 'node:test';
import assert from 'node:assert/strict';
import TEMPLATES from '../js/foods/mealTemplates.js';
import { buildFoods } from '../js/foods/index.js';
import { createInitialState } from '../js/core/store.js';
import { planDay, MEAL_SHARE, parseTemplate } from '../js/core/planner.js';

const foodsById = new Map(buildFoods(createInitialState()).map((f) => [f.id, f]));

test('every meal idea uses known foods and real portion units', () => {
  for (const [meal, list] of Object.entries(TEMPLATES)) {
    for (const [style, spec] of list) {
      assert.ok(['simple', 'traditional'].includes(style), `${meal}: style ${style}`);
      for (const item of parseTemplate(spec)) {
        const food = foodsById.get(item.id);
        assert.ok(food, `${meal}: unknown food ${item.id}`);
        assert.ok(food.portions.some((p) => p.unit === item.unit), `${meal}: ${item.id} has no ${item.unit}`);
      }
    }
  }
});

test('meal shares add up to the whole day', () => {
  const sum = Object.values(MEAL_SHARE).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});

for (const goal of [1400, 1800, 2200, 2600, 3200]) {
  for (const style of ['simple', 'traditional']) {
    test(`a ${style} day lands near a ${goal} kcal goal`, () => {
      for (const day of ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13']) {
        const plan = planDay({ dateKey: day, goal, style, swaps: {}, foodsById });
        assert.equal(plan.meals.length, 4);
        const ratio = plan.total.kcal / goal;
        assert.ok(ratio > 0.85 && ratio < 1.15, `${day}: ${plan.total.kcal} for goal ${goal}`);
      }
    });
  }
}

test('the plan is the same every time for the same day, and swapping changes one meal', () => {
  const base = { dateKey: '2026-10-12', goal: 2000, style: 'traditional', foodsById };
  const a = planDay({ ...base, swaps: {} });
  const b = planDay({ ...base, swaps: {} });
  assert.deepEqual(a.meals.map((m) => m.ideaIndex), b.meals.map((m) => m.ideaIndex));
  const c = planDay({ ...base, swaps: { lunch: 1 } });
  assert.notEqual(c.meals[1].ideaIndex, a.meals[1].ideaIndex);
  assert.equal(c.meals[0].ideaIndex, a.meals[0].ideaIndex);
});

test('every swap shows a different meal than the one before', () => {
  let same = 0;
  let total = 0;
  for (const goal of [1300, 2000, 3000]) {
    for (let d = 1; d <= 20; d += 1) {
      const dateKey = `2026-11-${String(d).padStart(2, '0')}`;
      for (const meal of ['breakfast', 'lunch', 'dinner', 'snacks']) {
        for (let n = 0; n < 3; n += 1) {
          const at = (k) => planDay({ dateKey, goal, style: 'traditional', swaps: { [meal]: k }, foodsById })
            .meals.find((m) => m.meal === meal).ideaIndex;
          total += 1;
          if (at(n) === at(n + 1)) same += 1;
        }
      }
    }
  }
  assert.equal(same, 0, `${same} of ${total} swaps showed the same meal`);
});

test('the style choice is respected', () => {
  const plan = planDay({ dateKey: '2026-10-12', goal: 2000, style: 'simple', swaps: {}, foodsById });
  for (const m of plan.meals) assert.equal(m.style, 'simple');
});

test('amounts are friendly: halves for portions, tens for grams', () => {
  const plan = planDay({ dateKey: '2026-10-14', goal: 2350, style: 'traditional', swaps: {}, foodsById });
  for (const m of plan.meals) {
    for (const it of m.items) {
      assert.ok(it.qty > 0);
      assert.equal(it.qty * 2, Math.round(it.qty * 2), `${it.food.id} qty ${it.qty}`);
    }
  }
});
