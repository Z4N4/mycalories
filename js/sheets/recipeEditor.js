// "Food template" editor: see a dish's ingredients and change each one
// (grams, remove, add), so "your shawarma" can differ from the default.

import { h, fmt, parseNumber } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { unitName } from '../ui/labels.js';
import { recipeTotals, MAX_INGREDIENTS, MAX_INGREDIENT_G } from '../core/recipes.js';
import { searchFoods } from '../core/search.js';
import { setRecipe, clearRecipe } from '../core/store.js';
import { foodName, hasRecipe } from '../foods/index.js';

const DEFAULT_ADD_G = 50;
const COMMON_INGREDIENTS = [
  'rice_plain', 'bulgur_plain', 'pasta_plain', 'samoon', 'pita', 'lavash', 'khubz_tannour', 'nan_saj',
  'chicken_thigh', 'chicken_breast', 'lamb', 'beef', 'mince', 'egg_boiled', 'veg_oil', 'olive_oil', 'ghee', 'butter',
  'onion', 'tomato', 'tomato_paste', 'garlic', 'potato_boiled', 'fries', 'eggplant_fried', 'pepper', 'zucchini',
  'carrot', 'peas', 'chickpeas', 'white_beans', 'lentils', 'herbs', 'lettuce', 'cucumber', 'torshi',
  'cheese_white', 'cheese_mozzarella', 'yogurt', 'toum', 'mayo', 'ketchup', 'amba', 'tahini',
  'almonds', 'raisins', 'sugar', 'flour', 'water',
];

const stepFor = (g) => (g < 30 ? 5 : 10);

/** Sheet to pick one plain food (not another dish) as an ingredient. */
function openIngredientPicker(app, onPick) {
  const { t, lang, foods, foodsById } = app.d;
  // Foods without a gram weight (custom foods saved "per serving") can't be weighed.
  const plain = foods.filter((f) => !hasRecipe(f.id) && f.grams);
  const input = h('input', { class: 'input search-input', type: 'search', placeholder: t('searchPlaceholder'), autocomplete: 'off' });
  const list = h('div', { class: 'food-list' });
  const render = () => {
    const query = input.value.trim();
    const shown = query
      ? searchFoods(plain, query).slice(0, 60)
      : COMMON_INGREDIENTS.map((id) => foodsById.get(id)).filter(Boolean);
    list.replaceChildren(...shown.map((food) => h('button', {
      class: 'food-row',
      onClick: () => { sheet.close(); onPick(food); },
    }, h('span', { class: 'food-text' }, h('span', { class: 'food-name' }, foodName(food, lang))), h('span', { class: 'food-add' }, icon('plus')))));
  };
  input.addEventListener('input', render);
  const sheet = openSheet({
    title: t('chooseIngredient'),
    closeLabel: t('close'),
    tall: true,
    body: h('div', { class: 'add-food' }, h('div', { class: 'search-wrap' }, icon('search', 'search-icon'), input), list),
  });
  render();
}

/**
 * @param {object} food a dish with food.recipe = {unit, items}
 * @param {() => void} onSaved called after the recipe changed
 */
export function openRecipeEditor(app, food, onSaved) {
  const { t, lang } = app.d;
  let items = food.recipe.items.map((i) => ({ ...i }));
  const rows = h('div', { class: 'ing-list' });
  const totals = h('div', { class: 'ing-total' });
  const saveBtn = h('button', { class: 'btn primary grow' }, t('save'));

  const setGrams = (index, g) => {
    items = items.map((it, i) => (i === index ? { ...it, g: Math.max(1, Math.min(MAX_INGREDIENT_G, Math.round(g))) } : it));
    render();
  };
  const remove = (index) => { items = items.filter((_, i) => i !== index); render(); };

  function row(item, index) {
    const ing = app.d.foodsById.get(item.id);
    const kcal = ing ? (ing.per100.kcal * item.g) / 100 : 0;
    const grams = h('input', { class: 'input grams-input', type: 'text', inputmode: 'numeric', value: String(item.g), 'aria-label': t('grams') });
    grams.addEventListener('change', () => {
      const g = parseNumber(grams.value);
      if (g > 0) setGrams(index, g); else grams.value = String(item.g);
    });
    return h('div', { class: 'ing-row' },
      h('div', { class: 'ing-main' },
        h('span', { class: 'ing-name' }, ing ? foodName(ing, lang) : item.id),
        h('div', { class: 'ai-controls' },
          h('button', { class: 'icon-btn small round', 'aria-label': '−', onClick: () => setGrams(index, item.g - stepFor(item.g)) }, icon('minus')),
          h('span', { class: 'input-wrap grams-wrap' }, grams, h('span', { class: 'input-unit' }, t('gramShort'))),
          h('button', { class: 'icon-btn small round', 'aria-label': '+', onClick: () => setGrams(index, item.g + stepFor(item.g)) }, icon('plus')),
          h('span', { class: 'ai-kcal' }, `${fmt(kcal)} ${t('kcal')}`))),
      h('button', { class: 'icon-btn small', 'aria-label': t('remove'), onClick: () => remove(index) }, icon('close')));
  }

  function render() {
    rows.replaceChildren(...items.map(row));
    const sum = recipeTotals(items, app.d.foodsById);
    totals.replaceChildren(
      h('span', null, `${t('totalWeight')}: ${fmt(sum.grams)} ${t('gramShort')}`),
      h('strong', null, `${fmt(sum.kcal)} ${t('kcal')}`));
    saveBtn.disabled = !items.length;
  }

  saveBtn.addEventListener('click', () => {
    app.commit(setRecipe(app.state, food.id, items), t('recipeSaved'));
    sheet.close();
    onSaved();
  });

  const addBtn = h('button', {
    class: 'btn',
    onClick: () => {
      if (items.length >= MAX_INGREDIENTS) return;
      openIngredientPicker(app, (ing) => { items = [...items, { id: ing.id, g: DEFAULT_ADD_G }]; render(); });
    },
  }, icon('plus'), t('addIngredient'));

  const resetBtn = food.edited && h('button', {
    class: 'link-btn',
    onClick: () => {
      app.commit(clearRecipe(app.state, food.id), t('saved'));
      sheet.close();
      onSaved();
    },
  }, icon('reset'), t('resetRecipe'));

  const sheet = openSheet({
    title: `${t('ingredients')} · ${foodName(food, lang)}`,
    closeLabel: t('close'),
    tall: true,
    body: h('div', { class: 'stack' },
      h('p', { class: 'muted small' }, `${t('onePortion', { unit: unitName(food.recipe.unit, lang, food) })} · ${t('recipeHint')}`),
      rows,
      addBtn,
      resetBtn),
    footer: h('div', { class: 'footer-row' }, totals, saveBtn),
  });
  render();
}
