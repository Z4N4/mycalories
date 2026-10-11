// Calorie and nutrition math. All functions are pure.

export const ACTIVITY = {
  sedentary: 1.2, // desk job, little exercise
  light: 1.375, // exercise 1-3 days/week
  moderate: 1.55, // exercise 3-5 days/week
  active: 1.725, // exercise 6-7 days/week
  veryActive: 1.9, // hard physical work or training twice a day
};

export const GOAL_DELTA = { lose: -500, keep: 0, gain: 300 };

const MIN_KCAL = { male: 1500, female: 1200 };
const MACRO_SPLIT = { p: 0.25, c: 0.45, f: 0.3 };
const KCAL_PER_GRAM = { p: 4, c: 4, f: 9 };

const round1 = (n) => Math.round(n * 10) / 10;

/** Mifflin-St Jeor basal metabolic rate. */
export function bmr({ sex, age, heightCm, weightKg }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'female' ? base - 161 : base + 5;
}

export function tdee(profile) {
  return bmr(profile) * (ACTIVITY[profile.activity] ?? ACTIVITY.sedentary);
}

/** Daily kcal target: the user's own number, or calculated from the profile. */
export function dailyGoal(profile) {
  if (Number.isFinite(profile.customGoal) && profile.customGoal > 0) return Math.round(profile.customGoal);
  const raw = tdee(profile) + (GOAL_DELTA[profile.goal] ?? 0);
  const min = MIN_KCAL[profile.sex] ?? MIN_KCAL.female;
  return Math.max(min, Math.round(raw / 10) * 10);
}

/** Grams of protein / carbs / fat for a kcal target. */
export function macroTargets(kcal) {
  return {
    p: Math.round((kcal * MACRO_SPLIT.p) / KCAL_PER_GRAM.p),
    c: Math.round((kcal * MACRO_SPLIT.c) / KCAL_PER_GRAM.c),
    f: Math.round((kcal * MACRO_SPLIT.f) / KCAL_PER_GRAM.f),
  };
}

/** Weight in grams for a quantity of a portion unit ('g' means grams). */
export function gramsFor(food, unit, qty) {
  if (unit === 'g') return qty;
  const portion = food.portions.find((p) => p.unit === unit);
  return portion ? portion.g * qty : 0;
}

export function nutritionFor(food, grams) {
  const factor = grams / 100;
  const { kcal, p, c, f } = food.per100;
  return {
    kcal: Math.round(kcal * factor),
    p: round1(p * factor),
    c: round1(c * factor),
    f: round1(f * factor),
  };
}

export function sumEntries(entries = []) {
  const total = entries.reduce(
    (acc, e) => ({ kcal: acc.kcal + e.kcal, p: acc.p + e.p, c: acc.c + e.c, f: acc.f + e.f }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
  return { kcal: Math.round(total.kcal), p: round1(total.p), c: round1(total.c), f: round1(total.f) };
}

/** Totals for a set of days (a week or a month). Average counts only days with food logged. */
export function periodSummary(log, keys, goal) {
  const days = keys.map((key) => ({ key, ...sumEntries(log[key]), logged: Boolean(log[key]?.length) }));
  const logged = days.filter((d) => d.logged);
  const total = days.reduce((s, d) => s + d.kcal, 0);
  const sum = (field) => logged.reduce((s, d) => s + d[field], 0);
  const avg = (field) => (logged.length ? sum(field) / logged.length : 0);
  return {
    days,
    total,
    loggedDays: logged.length,
    average: Math.round(avg('kcal')),
    avgMacros: { p: Math.round(avg('p')), c: Math.round(avg('c')), f: Math.round(avg('f')) },
    goalTotal: goal * keys.length,
    overDays: logged.filter((d) => d.kcal > goal).length,
  };
}
