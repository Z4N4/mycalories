// Turns the compact food rows into food objects and merges in the user's own
// foods and edited values.

import dishes from './dishes.js';
import breakfast from './breakfast.js';
import sweetsDrinks from './sweets-drinks.js';
import basics from './basics.js';
import duhok from './duhok.js';
import market from './market.js';
import RECIPES from './recipes.js';
import { parseRecipe, applyRecipe } from '../core/recipes.js';

export const CATEGORIES = [
  'dish', 'stew', 'rice', 'grill', 'bread', 'breakfast', 'dairy',
  'fast', 'market', 'sweet', 'snack', 'drink', 'fruit', 'veg', 'protein', 'extra',
];

const DEFAULT_RECIPES = Object.fromEntries(
  Object.entries(RECIPES).map(([id, [unit, spec]]) => [id, { unit, items: parseRecipe(spec) }]),
);

export const hasRecipe = (foodId) => Boolean(DEFAULT_RECIPES[foodId]);
export const defaultRecipe = (foodId) => DEFAULT_RECIPES[foodId];

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

export const BUILT_IN = [...dishes, ...duhok, ...breakfast, ...sweetsDrinks, ...basics, ...market].map(rowToFood);

/** A user-made food: values are entered per serving, stored that way, converted here. */
export function customToFood(c) {
  const hasGrams = c.servingG > 0;
  const g = hasGrams ? c.servingG : 100;
  const scale = (v) => (v * 100) / g;
  return {
    id: c.id, cat: 'custom', custom: true, name: c.name, keys: c.barcode ?? '',
    per100: { kcal: scale(c.kcal), p: scale(c.p), c: scale(c.c), f: scale(c.f) },
    portions: [{ unit: 'serving', g, label: c.servingName || '' }],
    grams: hasGrams,
  };
}

/**
 * All foods as the user sees them: their own foods first, then built-in foods
 * with their edited numbers, and dishes calculated from (their own or the
 * default) ingredients. Ingredients are always plain foods, never other dishes.
 */
export function buildFoods(state) {
  const custom = state.customFoods.map(customToFood);
  const plain = BUILT_IN.map((food) => {
    const own = !hasRecipe(food.id) && state.overrides[food.id];
    return own ? { ...food, per100: { ...own }, edited: true } : food;
  });
  const ingredients = new Map([...plain, ...custom].map((f) => [f.id, f]));
  const builtIn = plain.map((food) => {
    const recipe = DEFAULT_RECIPES[food.id];
    if (!recipe) return food;
    const own = state.recipes?.[food.id];
    return applyRecipe(food, recipe.unit, own ?? recipe.items, ingredients, Boolean(own));
  });
  return [...custom, ...builtIn];
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
