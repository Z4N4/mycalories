// Food detail sheet: choose portion, amount and meal, see calories, then add.
// Also used to edit or delete an entry already in the diary.

import { h, fmt, fmt1, fmtQty, parseNumber } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { segmented } from '../ui/controls.js';
import { unitName } from '../ui/labels.js';
import { gramsFor, nutritionFor } from '../core/calc.js';
import { MEALS, addEntry, updateEntry, removeEntry, toggleFavorite } from '../core/store.js';
import { foodName } from '../foods/index.js';
import { CATEGORY_NAMES, MEAL_NAMES } from '../i18n/strings.js';
import { overrideEditor } from './overrideEditor.js';
import { openCustomFood } from './customFood.js';

const QUICK_QTY = [0.5, 1, 1.5, 2, 3];
const QUICK_GRAMS = [50, 100, 150, 200, 300];

const stepFor = (unit) => (unit === 'g' ? 10 : 0.5);
const minFor = (unit) => (unit === 'g' ? 1 : 0.25);

function titleNode(app, food, onToggle) {
  const { lang, t } = app.d;
  const fav = app.state.favorites.includes(food.id);
  return h('span', { class: 'detail-title' },
    h('span', null, foodName(food, lang)),
    !food.adhoc && h('button', {
      class: `icon-btn star${fav ? ' on' : ''}`, 'aria-pressed': String(fav), 'aria-label': t('favorites'), onClick: onToggle,
    }, icon('star')));
}

/**
 * @param {object} opts
 * @param {object} opts.food
 * @param {string} opts.dateKey
 * @param {string} opts.meal
 * @param {object} [opts.entry] existing diary entry when editing
 * @param {() => void} [opts.onChange]
 */
export function openFoodDetail(app, { food: startFood, dateKey, meal: startMeal, entry, onChange }) {
  const { t, lang } = app.d;
  let food = startFood;
  let sel = {
    unit: entry?.unit ?? food.portions[0].unit,
    qty: entry?.qty ?? 1,
    meal: entry?.meal ?? startMeal,
  };

  const qtyInput = h('input', { class: 'input qty-input', type: 'text', inputmode: 'decimal', value: fmt1(sel.qty), 'aria-label': t('quantity') });
  const unitsEl = h('div', { class: 'chips wrap' });
  const quickEl = h('div', { class: 'chips' });
  const previewEl = h('div', { class: 'preview' });
  const primary = h('button', { class: 'btn primary grow' }, entry ? t('update') : t('add'));

  const grams = () => gramsFor(food, sel.unit, sel.qty);
  const valid = () => Number.isFinite(sel.qty) && sel.qty > 0 && grams() > 0;

  function setQty(q, { fromInput = false } = {}) {
    sel = { ...sel, qty: q };
    if (!fromInput) qtyInput.value = Number.isFinite(q) ? fmt1(q) : '';
    renderQuick();
    renderPreview();
  }

  function setUnit(unit) {
    const qty = unit === 'g' ? Math.round(grams()) || 100 : 1;
    sel = { ...sel, unit };
    renderUnits();
    setQty(qty);
  }

  function renderUnits() {
    const options = [...food.portions.map((p) => ({ unit: p.unit, g: p.g })), ...(food.grams ? [{ unit: 'g' }] : [])];
    unitsEl.replaceChildren(...options.map((o) => h('button', {
      class: `chip-btn${o.unit === sel.unit ? ' active' : ''}`, onClick: () => setUnit(o.unit),
    }, unitName(o.unit, lang, food), o.g && food.grams ? h('small', null, ` ${fmt(o.g)}${t('gramShort')}`) : '')));
  }

  function renderQuick() {
    const values = sel.unit === 'g' ? QUICK_GRAMS : QUICK_QTY;
    quickEl.replaceChildren(...values.map((v) => h('button', {
      class: `chip-btn small${v === sel.qty ? ' active' : ''}`, onClick: () => setQty(v),
    }, sel.unit === 'g' ? String(v) : fmtQty(v))));
  }

  function renderPreview() {
    const ok = valid();
    primary.disabled = !ok;
    const n = ok ? nutritionFor(food, grams()) : { kcal: 0, p: 0, c: 0, f: 0 };
    previewEl.replaceChildren(
      h('div', { class: 'preview-kcal' }, h('strong', null, fmt(n.kcal)), h('span', null, t('kcal'))),
      h('div', { class: 'preview-macros' },
        h('span', { class: 'chip protein' }, `${t('protein')} ${fmt1(n.p)}${t('gramShort')}`),
        h('span', { class: 'chip carbs' }, `${t('carbs')} ${fmt1(n.c)}${t('gramShort')}`),
        h('span', { class: 'chip fat' }, `${t('fat')} ${fmt1(n.f)}${t('gramShort')}`)),
      food.grams && sel.unit !== 'g' && ok ? h('div', { class: 'preview-grams muted' }, `≈ ${fmt(grams())} ${t('gramShort')}`) : '');
  }

  const step = (dir) => {
    const base = Number.isFinite(sel.qty) ? sel.qty : 0;
    setQty(Math.max(minFor(sel.unit), Math.round((base + dir * stepFor(sel.unit)) * 100) / 100));
  };
  qtyInput.addEventListener('input', () => setQty(parseNumber(qtyInput.value), { fromInput: true }));
  qtyInput.addEventListener('focus', () => qtyInput.select());

  function buildEntry() {
    const g = grams();
    return {
      foodId: food.id, meal: sel.meal, unit: sel.unit, qty: sel.qty, grams: Math.round(g),
      ...nutritionFor(food, g), name: food.custom ? food.name : food.n,
    };
  }

  primary.addEventListener('click', () => {
    if (!valid()) return;
    const next = entry
      ? updateEntry(app.state, dateKey, entry.id, buildEntry())
      : addEntry(app.state, dateKey, buildEntry());
    app.commit(next, entry ? t('saved') : t('added'));
    sheet.close();
    onChange?.();
  });

  function toggleFav() {
    app.commit(toggleFavorite(app.state, food.id));
    sheet.setTitle(titleNode(app, food, toggleFav));
    onChange?.();
  }

  function onFoodValuesChanged() {
    const fresh = app.d.foodsById.get(food.id);
    if (!fresh) { // the custom food was deleted
      sheet.close();
      onChange?.();
      return;
    }
    food = fresh;
    renderUnits();
    renderPreview();
    onChange?.();
  }

  const deleteBtn = entry && h('button', {
    class: 'btn danger-ghost',
    onClick: () => {
      const before = app.state;
      const after = removeEntry(before, dateKey, entry.id);
      app.commit(after, t('deleted'), { label: t('undo'), run: () => { if (app.state === after) app.commit(before); } });
      sheet.close();
    },
  }, icon('trash'), t('delete'));

  let editLink;
  if (food.adhoc) editLink = '';
  else editLink = food.custom
    ? h('button', { class: 'link-btn', onClick: () => openCustomFood(app, app.state.customFoods.find((c) => c.id === food.id), onFoodValuesChanged) }, icon('edit'), t('edit'))
    : overrideEditor(app, food, onFoodValuesChanged);

  const body = h('div', { class: 'stack detail' },
    h('div', { class: 'detail-meta muted' },
      food.adhoc ? '' : (CATEGORY_NAMES[food.cat]?.[lang] ?? ''),
      food.edited ? h('span', { class: 'badge' }, t('editedBadge')) : ''),
    h('div', { class: 'field' }, h('span', { class: 'field-label' }, t('portion')), unitsEl),
    h('div', { class: 'field' },
      h('span', { class: 'field-label' }, t('quantity')),
      h('div', { class: 'stepper' },
        h('button', { class: 'icon-btn round', 'aria-label': '−', onClick: () => step(-1) }, icon('minus')),
        qtyInput,
        h('button', { class: 'icon-btn round', 'aria-label': '+', onClick: () => step(1) }, icon('plus'))),
      quickEl),
    h('div', { class: 'field' },
      h('span', { class: 'field-label' }, t('meal')),
      segmented(MEALS.map((m) => ({ value: m, label: MEAL_NAMES[m][lang] })), sel.meal, (meal) => { sel = { ...sel, meal }; }, 'meals-seg')),
    previewEl,
    h('p', { class: 'note' }, icon('info'), t('estimateNote')),
    editLink);

  const sheet = openSheet({
    title: titleNode(app, food, toggleFav),
    closeLabel: t('close'),
    body,
    footer: h('div', { class: 'footer-row' }, deleteBtn, primary),
  });
  renderUnits();
  renderQuick();
  renderPreview();
}

/**
 * A stand-in food rebuilt from the entry itself, for entries whose food isn't in
 * the list (e.g. "other" foods from a photo), so their grams can still be edited.
 */
function adhocFood(entry, lang) {
  const factor = 100 / entry.grams;
  const name = typeof entry.name === 'string' ? entry.name : (entry.name?.[lang] || entry.name?.en || '?');
  return {
    id: entry.foodId, cat: 'custom', custom: true, adhoc: true, name, keys: '',
    per100: { kcal: entry.kcal * factor, p: entry.p * factor, c: entry.c * factor, f: entry.f * factor },
    portions: [{ unit: 'serving', g: 100 }], grams: true,
  };
}

/** Open an existing diary entry for editing. */
export function openEntry(app, dateKey, entry) {
  const food = app.d.foodsById.get(entry.foodId);
  if (food) {
    openFoodDetail(app, { food, dateKey, meal: entry.meal, entry });
    return;
  }
  if (entry.grams > 0) {
    const stored = entry.unit === 'g' ? entry : { ...entry, unit: 'g', qty: entry.grams };
    openFoodDetail(app, { food: adhocFood(entry, app.d.lang), dateKey, meal: entry.meal, entry: stored });
    return;
  }
  // The food was deleted: only allow removing the entry.
  const { t } = app.d;
  const sheet = openSheet({
    title: typeof entry.name === 'string' ? entry.name : (entry.name?.[app.d.lang] ?? '?'),
    closeLabel: t('close'),
    body: h('p', { class: 'muted' }, `${fmt(entry.kcal)} ${t('kcal')}`),
    footer: h('button', {
      class: 'btn danger-ghost grow',
      onClick: () => { app.commit(removeEntry(app.state, dateKey, entry.id), t('deleted')); sheet.close(); },
    }, icon('trash'), t('removeFromDay')),
  });
}
