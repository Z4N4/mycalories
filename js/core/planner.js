// Built-in meal planner: picks a meal idea for each meal of the day and scales
// the amounts so the day fits the calorie goal. Works offline, same plan every
// time for the same day (unless the user swaps a meal).

import TEMPLATES from '../foods/mealTemplates.js';
import { gramsFor, nutritionFor, sumEntries } from './calc.js';

export const MEAL_SHARE = { breakfast: 0.25, lunch: 0.35, dinner: 0.27, snacks: 0.13 };
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;
// Small items (tea, a cucumber) are not scaled; only the main foods change size.
const FIXED_KCAL_LIMIT = 60;
// A meal within 15% of its target is good enough; otherwise the next idea is tried.
const GOOD_FIT = 0.15;

/** 'samoon:piece:1 tea_sugar:teaGlass:1' → [{id, unit, qty}] */
export function parseTemplate(spec) {
  return spec.trim().split(/\s+/).map((part) => {
    const [id, unit, qty] = part.split(':');
    return { id, unit, qty: Number(qty) };
  });
}

/** Simple stable number from text, so each day gets its own (repeatable) choice. */
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const roundHalf = (q) => Math.max(0.5, Math.round(q * 2) / 2);

function itemWithNutrition(food, unit, qty) {
  const grams = gramsFor(food, unit, qty);
  return { food, unit, qty, grams: Math.round(grams), ...nutritionFor(food, grams) };
}

const total = (items) => items.reduce((s, it) => s + it.kcal, 0);

/** One more half-portion of item i, if that brings the meal closer to the target. */
function bestHalfStep(fitted, isMainAt, target) {
  const now = total(fitted);
  let best = null;
  fitted.forEach((it, i) => {
    if (!isMainAt[i]) return;
    const next = itemWithNutrition(it.food, it.unit, roundHalf(it.qty + 0.5));
    const error = Math.abs(now - it.kcal + next.kcal - target);
    if (error < Math.abs(now - target) && (!best || error < best.error)) best = { i, next, error };
  });
  return best;
}

/**
 * Scale the bigger items of a meal idea so the meal lands near its target:
 * scale everything, round down to halves, then add half-steps one at a time
 * while that brings the meal closer to the target.
 */
function fitMeal(items, target) {
  const isMainAt = items.map((it) => it.kcal > FIXED_KCAL_LIMIT);
  const mainKcal = total(items.filter((_, i) => isMainAt[i]));
  if (!mainKcal) return items;
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (target - (total(items) - mainKcal)) / mainKcal));
  let fitted = items.map((it, i) => (isMainAt[i]
    ? itemWithNutrition(it.food, it.unit, Math.max(0.5, Math.floor(it.qty * scale * 2) / 2))
    : it));
  for (let step = 0; step < 12; step += 1) {
    const best = bestHalfStep(fitted, isMainAt, target);
    if (!best) break;
    fitted = fitted.map((it, i) => (i === best.i ? best.next : it));
  }
  return fitted;
}

function ideaItems(spec, foodsById) {
  return parseTemplate(spec)
    .map(({ id, unit, qty }) => {
      const food = foodsById.get(id);
      return food ? itemWithNutrition(food, unit, qty) : null;
    })
    .filter(Boolean);
}

/**
 * Ideas that fit the target well (within GOOD_FIT), in the day's own order
 * starting at `start`. Swap number n shows the n-th of them, so every swap
 * shows a different meal. If none fit well (e.g. heavy dishes on a small goal),
 * all ideas are used, best fit first.
 */
function chooseMeal(ideas, start, swap, target, foodsById) {
  const fitted = ideas.map((_, k) => {
    const idea = ideas[(start + k) % ideas.length];
    const items = fitMeal(ideaItems(idea.spec, foodsById), target);
    return { idea, items, error: Math.abs(total(items) - target) / target };
  });
  const good = fitted.filter((o) => o.error <= GOOD_FIT);
  const pool = good.length ? good : [...fitted].sort((x, y) => x.error - y.error);
  return pool[swap % pool.length];
}

/**
 * @param {{dateKey: string, goal: number, style: 'simple'|'traditional',
 *          swaps: Record<string, number>, foodsById: Map<string, object>}} opts
 */
export function planDay({ dateKey, goal, style, swaps, foodsById }) {
  // Whatever one meal ends up over or under its share is passed on to the next meal.
  let carry = 0;
  const meals = Object.entries(MEAL_SHARE).map(([meal, share]) => {
    const ideas = TEMPLATES[meal]
      .map(([ideaStyle, spec], index) => ({ style: ideaStyle, spec, index }))
      .filter((idea) => idea.style === style);
    const start = hash(`${dateKey}|${meal}`) % ideas.length;
    const target = goal * share + carry;
    const { idea, items } = chooseMeal(ideas, start, swaps[meal] ?? 0, target, foodsById);
    carry = target - total(items);
    return { meal, style: idea.style, ideaIndex: idea.index, items, ...sumEntries(items) };
  });
  return { meals, total: sumEntries(meals.flatMap((m) => m.items)) };
}
