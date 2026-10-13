// App state and every change to it. Each function returns a NEW state object
// and never modifies the one passed in.

import { isValidKey } from './dates.js';
import { cleanRecipeItems } from './recipes.js';
import { isValidSplit } from './calc.js';

export const VERSION = 1;
export const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'];
export const LANGS = ['ku', 'ar', 'en'];
export const MAX_RECENT = 30;

export function createInitialState() {
  return {
    version: VERSION,
    settings: { lang: 'ku', onboarded: false, planStyle: 'traditional' },
    profile: {
      sex: 'male', age: 25, heightCm: 175, weightKg: 75,
      activity: 'light', goal: 'keep', customGoal: null,
      goalChange: null, // own deficit/surplus in kcal per day (null = default)
      macroSplit: null, // own protein/carbs/fat % (null = 25/45/30)
    },
    log: {},
    customFoods: [],
    overrides: {},
    recipes: {},
    planSwaps: {},
    savedMeals: [], // [{id, name, items: [entry without id/meal]}]
    favorites: [],
    recent: [],
    weights: {},
  };
}

export function newId(prefix = 'e') {
  const rand = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`;
  return `${prefix}_${rand.replace(/[^a-z0-9]/gi, '').slice(0, 16)}`;
}

const withDay = (state, key, entries) => {
  const { [key]: _old, ...rest } = state.log;
  return { ...state, log: entries.length ? { ...rest, [key]: entries } : rest };
};

const pushRecent = (recent, foodId) => [foodId, ...recent.filter((id) => id !== foodId)].slice(0, MAX_RECENT);

export function addEntry(state, key, entry) {
  const entries = [...(state.log[key] ?? []), { ...entry, id: newId() }];
  return { ...withDay(state, key, entries), recent: pushRecent(state.recent, entry.foodId) };
}

export function updateEntry(state, key, id, changes) {
  const entries = (state.log[key] ?? []).map((e) => (e.id === id ? { ...e, ...changes, id } : e));
  return withDay(state, key, entries);
}

export function removeEntry(state, key, id) {
  return withDay(state, key, (state.log[key] ?? []).filter((e) => e.id !== id));
}

export function copyMeal(state, fromKey, toKey, meal) {
  const copies = (state.log[fromKey] ?? [])
    .filter((e) => e.meal === meal)
    .map((e) => ({ ...e, id: newId() }));
  return withDay(state, toKey, [...(state.log[toKey] ?? []), ...copies]);
}

const MAX_SAVED_MEALS = 50;
const MAX_MEAL_ITEMS = 30;

/** Save a meal's entries under a name, to add them all again later with one tap. */
export function saveMeal(state, name, entries) {
  const items = entries.slice(0, MAX_MEAL_ITEMS).map(({ id: _id, meal: _meal, ...rest }) => ({ ...rest }));
  const meal = { id: newId('m'), name: String(name).trim().slice(0, 40), items };
  return { ...state, savedMeals: [meal, ...state.savedMeals].slice(0, MAX_SAVED_MEALS) };
}

export function addSavedMeal(state, key, meal, saved) {
  return saved.items.reduce((s, item) => addEntry(s, key, { ...item, meal }), state);
}

export function deleteSavedMeal(state, id) {
  return { ...state, savedMeals: state.savedMeals.filter((m) => m.id !== id) };
}

export function toggleFavorite(state, foodId) {
  const has = state.favorites.includes(foodId);
  return { ...state, favorites: has ? state.favorites.filter((id) => id !== foodId) : [foodId, ...state.favorites] };
}

export function saveCustomFood(state, food) {
  const exists = food.id && state.customFoods.some((f) => f.id === food.id);
  const customFoods = exists
    ? state.customFoods.map((f) => (f.id === food.id ? { ...food } : f))
    : [{ ...food, id: newId('c') }, ...state.customFoods];
  return { ...state, customFoods };
}

export function findCustomByBarcode(state, barcode) {
  return state.customFoods.find((f) => f.barcode && f.barcode === barcode);
}

export function deleteCustomFood(state, id) {
  return {
    ...state,
    customFoods: state.customFoods.filter((f) => f.id !== id),
    favorites: state.favorites.filter((f) => f !== id),
    recent: state.recent.filter((f) => f !== id),
  };
}

/** Replace the built-in per-100g numbers of a food with the user's own. */
export function setOverride(state, foodId, per100) {
  return { ...state, overrides: { ...state.overrides, [foodId]: { ...per100 } } };
}

export function clearOverride(state, foodId) {
  const { [foodId]: _old, ...rest } = state.overrides;
  return { ...state, overrides: rest };
}

const latestWeight = (weights) => {
  const keys = Object.keys(weights).sort();
  return keys.length ? weights[keys[keys.length - 1]] : null;
};

export function setWeight(state, key, kg) {
  const weights = { ...state.weights, [key]: kg };
  return { ...state, weights, profile: { ...state.profile, weightKg: latestWeight(weights) } };
}

export function removeWeight(state, key) {
  const { [key]: _old, ...weights } = state.weights;
  const latest = latestWeight(weights);
  return { ...state, weights, profile: { ...state.profile, weightKg: latest ?? state.profile.weightKg } };
}

export function setProfile(state, changes) {
  return { ...state, profile: { ...state.profile, ...changes } };
}

/** The user's own ingredient list for a dish (replaces the default recipe). */
export function setRecipe(state, foodId, items) {
  return { ...state, recipes: { ...state.recipes, [foodId]: items.map((i) => ({ id: i.id, g: i.g })) } };
}

export function clearRecipe(state, foodId) {
  const { [foodId]: _old, ...rest } = state.recipes;
  return { ...state, recipes: rest };
}

const MAX_PLAN_DAYS = 31;

/** Remember which suggestion of a meal is shown on a planned day ('swap'). */
export function swapPlanMeal(state, dateKey, meal) {
  const day = state.planSwaps[dateKey] ?? {};
  const days = { ...state.planSwaps, [dateKey]: { ...day, [meal]: (day[meal] ?? 0) + 1 } };
  const recent = Object.keys(days).sort().slice(-MAX_PLAN_DAYS);
  return { ...state, planSwaps: Object.fromEntries(recent.map((k) => [k, days[k]])) };
}

export function setSettings(state, changes) {
  return { ...state, settings: { ...state.settings, ...changes } };
}

// ---------- Backup import: never trust the file, rebuild a clean state ----------

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const inRange = (v, min, max) => isNum(v) && v >= min && v <= max;

const cleanName = (name) => {
  if (typeof name === 'string') return name.slice(0, 80);
  if (isObj(name)) return Object.fromEntries(['en', 'ar', 'ku'].map((k) => [k, typeof name[k] === 'string' ? name[k].slice(0, 80) : '']));
  return '';
};

function cleanEntry(e) {
  if (!isObj(e) || typeof e.foodId !== 'string' || !MEALS.includes(e.meal) || typeof e.unit !== 'string') return null;
  if (![e.kcal, e.p, e.c, e.f, e.grams].every((v) => inRange(v, 0, 50000)) || !inRange(e.qty, 0.001, 10000)) return null;
  return {
    id: typeof e.id === 'string' ? e.id : newId(),
    foodId: e.foodId, meal: e.meal, unit: e.unit.slice(0, 20), qty: e.qty, grams: e.grams,
    kcal: e.kcal, p: e.p, c: e.c, f: e.f, name: cleanName(e.name),
  };
}

function cleanLog(log) {
  if (!isObj(log)) return {};
  return Object.fromEntries(Object.entries(log).map(([key, entries]) => {
    if (!isValidKey(key) || !Array.isArray(entries)) throw new Error(`Bad day in backup: ${key}`);
    return [key, entries.map(cleanEntry).filter(Boolean)];
  }).filter(([, entries]) => entries.length));
}

function cleanCustomFood(f) {
  if (!isObj(f) || typeof f.id !== 'string' || !f.id.startsWith('c_') || typeof f.name !== 'string') return null;
  // 30000 covers a big scanned package (3 kg at 900 kcal/100 g)
  if (![f.kcal, f.p, f.c, f.f].every((v) => inRange(v, 0, 30000))) return null;
  const servingG = f.servingG ?? 0;
  if (!(servingG === 0 || inRange(servingG, 1, 3000))) return null;
  return {
    id: f.id, name: f.name.slice(0, 80),
    servingName: typeof f.servingName === 'string' ? f.servingName.slice(0, 30) : '',
    barcode: typeof f.barcode === 'string' && /^\d{6,14}$/.test(f.barcode) ? f.barcode : '',
    servingG, kcal: f.kcal, p: f.p, c: f.c, f: f.f,
  };
}

function cleanProfile(p, defaults) {
  if (!isObj(p)) return defaults;
  return {
    sex: p.sex === 'female' ? 'female' : 'male',
    age: inRange(p.age, 10, 120) ? p.age : defaults.age,
    heightCm: inRange(p.heightCm, 100, 250) ? p.heightCm : defaults.heightCm,
    weightKg: inRange(p.weightKg, 25, 350) ? p.weightKg : defaults.weightKg,
    activity: typeof p.activity === 'string' ? p.activity : defaults.activity,
    goal: ['lose', 'keep', 'gain'].includes(p.goal) ? p.goal : defaults.goal,
    customGoal: inRange(p.customGoal, 500, 10000) ? p.customGoal : null,
    goalChange: Number.isInteger(p.goalChange) && inRange(p.goalChange, -1500, 1000) && p.goalChange !== 0 ? p.goalChange : null,
    macroSplit: isValidSplit(p.macroSplit) ? { p: p.macroSplit.p, c: p.macroSplit.c, f: p.macroSplit.f } : null,
  };
}

const cleanIds = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

/** Parse an exported backup file. Throws with a message if it is not a MyCalories backup. */
export function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Not a valid backup file');
  }
  if (!isObj(raw) || raw.version !== VERSION) throw new Error('Not a MyCalories backup');
  const base = createInitialState();
  const lang = LANGS.includes(raw.settings?.lang) ? raw.settings.lang : base.settings.lang;
  const weights = isObj(raw.weights)
    ? Object.fromEntries(Object.entries(raw.weights).filter(([k, v]) => isValidKey(k) && inRange(v, 25, 350)))
    : {};
  const recipes = isObj(raw.recipes)
    ? Object.fromEntries(Object.entries(raw.recipes).map(([k, v]) => [k, cleanRecipeItems(v)]).filter(([, v]) => v))
    : {};
  const savedMeals = Array.isArray(raw.savedMeals)
    ? raw.savedMeals.map((m) => {
      if (!isObj(m) || typeof m.name !== 'string' || !m.name.trim() || !Array.isArray(m.items)) return null;
      const items = m.items.slice(0, MAX_MEAL_ITEMS).map((e) => cleanEntry({ ...e, meal: 'lunch' }))
        .filter(Boolean).map(({ id: _id, meal: _meal, ...rest }) => rest);
      return items.length ? { id: typeof m.id === 'string' ? m.id.slice(0, 40) : newId('m'), name: m.name.trim().slice(0, 40), items } : null;
    }).filter(Boolean).slice(0, MAX_SAVED_MEALS)
    : [];
  const planStyle = raw.settings?.planStyle === 'simple' ? 'simple' : 'traditional';
  const planSwaps = isObj(raw.planSwaps)
    ? Object.fromEntries(Object.entries(raw.planSwaps)
      .filter(([k, v]) => isValidKey(k) && isObj(v))
      .map(([k, v]) => [k, Object.fromEntries(Object.entries(v)
        .filter(([meal, n]) => MEALS.includes(meal) && Number.isInteger(n) && n >= 0 && n < 1000))]))
    : {};
  const overrides = isObj(raw.overrides)
    ? Object.fromEntries(Object.entries(raw.overrides).filter(([, v]) => isObj(v) && [v.kcal, v.p, v.c, v.f].every(isNum)))
    : {};
  return {
    ...base,
    settings: { lang, onboarded: true, planStyle },
    profile: cleanProfile(raw.profile, base.profile),
    log: cleanLog(raw.log),
    customFoods: Array.isArray(raw.customFoods) ? raw.customFoods.map(cleanCustomFood).filter(Boolean) : [],
    overrides,
    recipes,
    planSwaps,
    savedMeals,
    favorites: cleanIds(raw.favorites),
    recent: cleanIds(raw.recent).slice(0, MAX_RECENT),
    weights,
  };
}
