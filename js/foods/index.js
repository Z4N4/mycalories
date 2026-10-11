// Turns the compact food rows into food objects and merges in the user's own
// foods and edited values.

import dishes from './dishes.js';
import breakfast from './breakfast.js';
import sweetsDrinks from './sweets-drinks.js';
import basics from './basics.js';

export const CATEGORIES = [
  'dish', 'stew', 'rice', 'grill', 'bread', 'breakfast', 'dairy',
  'fast', 'sweet', 'snack', 'drink', 'fruit', 'veg', 'protein', 'extra',
];

function parsePortions(spec) {
  const portions = spec.split(' ').map((part) => {
    const [unit, g] = part.split(':');
    return { unit, g: Number(g) };
  });
  const plate = portions.find((p) => p.unit === 'plate');
  return plate ? [...portions, { unit: 'halfPlate', g: plate.g / 2 }] : portions;
}

export function rowToFood([cat, id, en, ar, ku, kcal, p, c, f, portions, keys]) {
  return {
    id, cat, n: { en, ar, ku }, keys,
    per100: { kcal, p, c, f },
    portions: parsePortions(portions),
    grams: true,
  };
}

export const BUILT_IN = [...dishes, ...breakfast, ...sweetsDrinks, ...basics].map(rowToFood);

/** A user-made food: values are entered per serving, stored that way, converted here. */
export function customToFood(c) {
  const hasGrams = c.servingG > 0;
  const g = hasGrams ? c.servingG : 100;
  const scale = (v) => (v * 100) / g;
  return {
    id: c.id, cat: 'custom', custom: true, name: c.name, keys: '',
    per100: { kcal: scale(c.kcal), p: scale(c.p), c: scale(c.c), f: scale(c.f) },
    portions: [{ unit: 'serving', g, label: c.servingName || '' }],
    grams: hasGrams,
  };
}

export function buildFoods(state) {
  const builtIn = BUILT_IN.map((food) => {
    const own = state.overrides[food.id];
    return own ? { ...food, per100: { ...own }, edited: true } : food;
  });
  return [...state.customFoods.map(customToFood), ...builtIn];
}

export function foodName(food, lang) {
  if (!food) return '?';
  return food.custom ? food.name : (food.n[lang] || food.n.en);
}

/** Name to show for a logged entry, even if its food was later deleted. */
export function entryName(entry, foodsById, lang) {
  const food = foodsById.get(entry.foodId);
  if (food) return foodName(food, lang);
  if (typeof entry.name === 'string') return entry.name;
  return entry.name?.[lang] || entry.name?.en || '?';
}
