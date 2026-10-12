// Recipes ("food templates"): a dish is a list of ingredients with grams for one
// portion. Its calories per 100 g come from those ingredients.

export const MAX_INGREDIENTS = 40;
export const MAX_INGREDIENT_G = 3000;

/** 'rice_plain:120 veg_oil:15' → [{id, g}] */
export function parseRecipe(spec) {
  return spec.trim().split(/\s+/).map((part) => {
    const [id, g] = part.split(':');
    return { id, g: Number(g) };
  });
}

/** Total weight and nutrition of a list of ingredients (unknown ingredients are skipped). */
export function recipeTotals(items, foodsById) {
  return items.reduce((acc, { id, g }) => {
    const food = foodsById.get(id);
    if (!food) return acc;
    const k = g / 100;
    return {
      grams: acc.grams + g,
      kcal: acc.kcal + food.per100.kcal * k,
      p: acc.p + food.per100.p * k,
      c: acc.c + food.per100.c * k,
      f: acc.f + food.per100.f * k,
    };
  }, { grams: 0, kcal: 0, p: 0, c: 0, f: 0 });
}

/**
 * New food whose numbers come from its ingredients. The recipe portion (e.g. one
 * plate) weighs what its ingredients weigh; a half plate follows automatically.
 */
export function applyRecipe(food, unit, items, foodsById, edited) {
  const totals = recipeTotals(items, foodsById);
  const flag = edited ? { edited: true } : {};
  // No usable ingredients (e.g. they were deleted): keep the reference numbers.
  if (totals.grams <= 0) return { ...food, recipe: { unit, items }, ...flag };
  const per100 = {
    kcal: (totals.kcal * 100) / totals.grams,
    p: (totals.p * 100) / totals.grams,
    c: (totals.c * 100) / totals.grams,
    f: (totals.f * 100) / totals.grams,
  };
  const g = Math.round(totals.grams);
  const portions = food.portions.map((p) => {
    if (p.unit === unit) return { ...p, g };
    if (unit === 'plate' && p.unit === 'halfPlate') return { ...p, g: g / 2 };
    return p;
  });
  return { ...food, per100, portions, recipe: { unit, items }, ...flag };
}

/** Validates recipe items from an untrusted source (backup file). */
export function cleanRecipeItems(raw) {
  if (!Array.isArray(raw) || !raw.length || raw.length > MAX_INGREDIENTS) return null;
  const items = raw.map((row) => {
    const [id, g] = Array.isArray(row) ? row : [row?.id, row?.g];
    const ok = typeof id === 'string' && /^[a-z0-9_]{1,40}$/i.test(id)
      && typeof g === 'number' && Number.isFinite(g) && g > 0 && g <= MAX_INGREDIENT_G;
    return ok ? { id, g } : null;
  });
  return items.every(Boolean) ? items : null;
}
