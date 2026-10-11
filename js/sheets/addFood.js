// "Add food" sheet: search in any language, recent, favorites, my foods, categories.

import { h, fmt, fmtQty } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { unitName } from '../ui/labels.js';
import { searchFoods } from '../core/search.js';
import { sumEntries, nutritionFor } from '../core/calc.js';
import { CATEGORIES, foodName } from '../foods/index.js';
import { CATEGORY_NAMES, MEAL_NAMES } from '../i18n/strings.js';
import { openFoodDetail } from './foodDetail.js';
import { openCustomFood } from './customFood.js';
import { openBarcodeScanner } from './barcodeScanner.js';
import { openPhotoFood } from './photoFood.js';

const MAX_SEARCH_RESULTS = 80;

function foodsFor(app, filter, query) {
  const { foods, foodsById } = app.d;
  const { recent, favorites } = app.state;
  if (query.trim()) return searchFoods(foods, query).slice(0, MAX_SEARCH_RESULTS);
  const byIds = (ids) => ids.map((id) => foodsById.get(id)).filter(Boolean);
  if (filter === 'recent') return byIds(recent);
  if (filter === 'favorites') return byIds(favorites);
  if (filter === 'mine') return foods.filter((f) => f.custom);
  if (filter.startsWith('cat:')) return foods.filter((f) => f.cat === filter.slice(4));
  return foods;
}

function emptyText(t, filter, query) {
  if (query.trim()) return t('noResults');
  return { recent: t('noRecent'), favorites: t('noFavorites'), mine: t('noMyFoods') }[filter] ?? t('noResults');
}

function foodRow(app, food, onPick) {
  const { lang, t } = app.d;
  const portion = food.portions[0];
  const kcal = nutritionFor(food, portion.g).kcal;
  const isFav = app.state.favorites.includes(food.id);
  return h('button', { class: 'food-row', onClick: () => onPick(food) },
    h('span', { class: 'food-text' },
      h('span', { class: 'food-name' }, foodName(food, lang), isFav && icon('star', 'fav-mark')),
      h('span', { class: 'food-sub' }, `${fmtQty(1)} ${unitName(portion.unit, lang, food)} · ${fmt(kcal)} ${t('kcal')}`)),
    h('span', { class: 'food-add' }, icon('plus')));
}

export function openAddFood(app, dateKey, meal) {
  const { t, lang } = app.d;
  let filter = app.state.recent.length ? 'recent' : 'all';
  let query = '';

  const input = h('input', {
    class: 'input search-input', type: 'search', placeholder: t('searchPlaceholder'),
    enterkeyhint: 'search', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false',
  });
  const chipsEl = h('div', { class: 'chips scroll-x' });
  const listEl = h('div', { class: 'food-list' });
  const totalEl = h('span', { class: 'footer-total' });

  const filters = [
    { id: 'recent', label: t('recent') },
    { id: 'favorites', label: `⭐ ${t('favorites')}` },
    { id: 'mine', label: t('myFoods') },
    { id: 'all', label: t('all') },
    ...CATEGORIES.map((c) => ({ id: `cat:${c}`, label: CATEGORY_NAMES[c][lang] })),
  ];

  function pick(food) {
    openFoodDetail(app, { food, dateKey, meal, onChange: refresh });
  }

  function renderChips() {
    chipsEl.replaceChildren(...filters.map((f) => h('button', {
      class: `chip-btn${!query && f.id === filter ? ' active' : ''}`,
      onClick: () => { filter = f.id; query = ''; input.value = ''; refresh(); },
    }, f.label)));
  }

  function renderList() {
    const foods = foodsFor(app, filter, query);
    const create = h('button', {
      class: 'food-row create',
      onClick: () => openCustomFood(app, null, (food) => { refresh(); if (food) pick(food); }),
    }, h('span', { class: 'food-text' }, h('span', { class: 'food-name' }, t('createFood'))), h('span', { class: 'food-add' }, icon('edit')));
    listEl.replaceChildren(
      ...(foods.length ? foods.map((f) => foodRow(app, f, pick)) : [h('p', { class: 'empty' }, emptyText(t, filter, query))]),
      (filter === 'mine' || query || !foods.length) ? create : '',
    );
  }

  function renderTotal() {
    const entries = (app.state.log[dateKey] ?? []).filter((e) => e.meal === meal);
    totalEl.textContent = `${MEAL_NAMES[meal][lang]}: ${fmt(sumEntries(entries).kcal)} ${t('kcal')}`;
  }

  function refresh() {
    renderChips();
    renderList();
    renderTotal();
  }

  input.addEventListener('input', () => {
    query = input.value;
    renderChips();
    renderList();
    listEl.scrollTop = 0;
  });

  const sheet = openSheet({
    title: `${t('addFood')} · ${MEAL_NAMES[meal][lang]}`,
    closeLabel: t('close'),
    tall: true,
    body: h('div', { class: 'add-food' },
      h('div', { class: 'quick-actions' },
        h('button', { class: 'quick-btn', onClick: () => openBarcodeScanner(app, { dateKey, meal, onChange: refresh }) },
          icon('barcode'), t('scanBarcode')),
        h('button', { class: 'quick-btn', onClick: () => openPhotoFood(app, { dateKey, meal, onChange: refresh }) },
          icon('camera'), t('photo'))),
      h('div', { class: 'search-wrap' }, icon('search', 'search-icon'), input),
      chipsEl,
      listEl),
    footer: h('div', { class: 'footer-row' },
      totalEl,
      h('button', { class: 'btn primary', onClick: () => sheet.close() }, icon('check'), t('close'))),
  });
  refresh();
}
