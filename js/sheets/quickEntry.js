// "Type what you ate": write "200g rice and 100g chicken breast", see what the
// app understood, fix anything (food, amount, unit), and only then add it.

import { h, fmt, fmt1, parseNumber } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { segmented } from '../ui/controls.js';
import { foodThumb } from '../ui/foodThumb.js';
import { unitName } from '../ui/labels.js';
import { parseQuickEntry, resolveAmount } from '../core/quickEntry.js';
import { searchFoods } from '../core/search.js';
import { MEALS, addEntry } from '../core/store.js';
import { foodName } from '../foods/index.js';
import { MEAL_NAMES } from '../i18n/strings.js';

const MAX_TEXT = 600;

/** Sheet to choose a different food for one line: its alternatives first, then search. */
function openFoodPicker(app, { candidates, query, onPick }) {
  const { t, lang, foods } = app.d;
  const input = h('input', { class: 'input search-input', type: 'search', value: query, placeholder: t('searchPlaceholder'), autocomplete: 'off' });
  const list = h('div', { class: 'food-list' });
  const render = () => {
    const q = input.value.trim();
    const found = q ? searchFoods(foods, q).slice(0, 40) : [];
    const shown = [...candidates, ...found.filter((f) => !candidates.includes(f))];
    list.replaceChildren(...(shown.length ? shown : []).map((food) => h('button', {
      class: 'food-row', onClick: () => { sheet.close(); onPick(food); },
    }, foodThumb(food, 'md'), h('span', { class: 'food-text' }, h('span', { class: 'food-name' }, foodName(food, lang))), h('span', { class: 'food-add' }, icon('check')))));
    if (!shown.length) list.append(h('p', { class: 'empty' }, t('noResults')));
  };
  input.addEventListener('input', render);
  const sheet = openSheet({
    title: t('chooseFood'),
    closeLabel: t('close'),
    tall: true,
    body: h('div', { class: 'add-food' }, h('div', { class: 'search-wrap' }, icon('search', 'search-icon'), input), list),
  });
  render();
}

/**
 * @param {{dateKey: string, meal: string, text?: string, onChange?: () => void}} opts
 */
export function openQuickEntry(app, { dateKey, meal: startMeal, text = '', onChange }) {
  const { t, lang } = app.d;
  let meal = startMeal;
  let written = text;
  let items = [];

  const sheet = openSheet({ title: t('quickTitle'), closeLabel: t('close'), tall: true, body: h('div') });

  // ---------- step 1: write ----------
  function writeView() {
    const box = h('textarea', { class: 'input quick-box', maxlength: MAX_TEXT, placeholder: t('quickPlaceholder') }, written);
    const go = () => {
      written = box.value.trim();
      if (!written) { box.focus(); return; }
      items = parseQuickEntry(written, app.d.foods).map((it) => ({ ...it, on: true }));
      reviewView();
    };
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } });
    sheet.setBody(h('div', { class: 'stack' },
      h('p', { class: 'muted small' }, t('quickHint')),
      box,
      h('div', { class: 'chips wrap quick-examples' },
        [t('quickEx1'), t('quickEx2'), t('quickEx3')].map((ex) => h('button', {
          class: 'chip-btn small', onClick: () => { box.value = box.value ? `${box.value}, ${ex}` : ex; box.focus(); },
        }, ex)))));
    sheet.setFooter(h('div', { class: 'footer-row' }, h('button', { class: 'btn primary grow', onClick: go }, icon('check'), t('quickUnderstand'))));
    setTimeout(() => box.focus(), 300);
  }

  // ---------- step 2: review ----------
  const update = (key, changes) => { items = items.map((it) => (it.key === key ? { ...it, ...changes } : it)); };

  function amountControls(item, refreshKcal) {
    const { food } = item;
    const qty = h('input', { class: 'input qty-mini', type: 'text', inputmode: 'decimal', value: fmt1(item.qty), 'aria-label': t('quantity') });
    const unit = h('select', { class: 'input unit-select', 'aria-label': t('portion') },
      [...food.portions.map((p) => p.unit), ...(food.grams ? ['g'] : [])].map((u) => {
        const opt = h('option', { value: u }, unitName(u, lang, food));
        if (u === item.unit) opt.selected = true;
        return opt;
      }));
    const apply = (unitValue, qtyValue) => {
      const fixed = resolveAmount(food, unitValue, qtyValue);
      update(item.key, fixed);
      refreshKcal();
    };
    qty.addEventListener('input', () => {
      const n = parseNumber(qty.value);
      const ok = n > 0;
      qty.classList.toggle('invalid', !ok);
      if (ok) { apply(unit.value, n); return; }
      // Empty or 0: this line is left out of "Add" until a real amount is typed.
      update(item.key, { grams: 0, kcal: 0, p: 0, c: 0, f: 0 });
      refreshKcal();
    });
    unit.addEventListener('change', () => {
      // Switching to grams keeps the same weight; switching to a portion starts at 1.
      const current = items.find((it) => it.key === item.key);
      const next = unit.value === 'g' ? current.grams || 100 : 1;
      qty.value = fmt1(next);
      apply(unit.value, next);
    });
    return h('div', { class: 'quick-amount' }, qty, unit);
  }

  function row(item) {
    const kcalEl = h('span', { class: 'ai-kcal' });
    const el = h('div', { class: `quick-row${item.food ? '' : ' missing'}` });
    const refreshKcal = () => {
      const now = items.find((it) => it.key === item.key);
      kcalEl.textContent = now.food ? `${fmt(now.kcal)} ${t('kcal')}` : '';
      el.classList.toggle('off', !now.on);
      renderTotal();
    };
    const choose = () => openFoodPicker(app, {
      candidates: item.candidates,
      query: item.food ? '' : item.query,
      onPick: (food) => {
        // What was typed (e.g. "1" with no unit) is applied to the chosen food's own portion.
        update(item.key, { food, ...resolveAmount(food, item.typedUnit, item.typedQty) });
        el.replaceWith(row(items.find((it) => it.key === item.key)));
        renderTotal();
      },
    });
    const remove = h('button', { class: 'icon-btn small', 'aria-label': t('remove'), onClick: () => { update(item.key, { on: !items.find((it) => it.key === item.key).on }); refreshKcal(); } }, icon('close'));
    if (!item.food) {
      el.append(
        h('span', { class: 'thumb sm emoji' }, '❓'),
        h('div', { class: 'ai-main' },
          h('span', { class: 'quick-typed' }, '“', h('bdi', { dir: 'auto' }, item.text), '”'),
          h('span', { class: 'field-error' }, t('notMatched')),
          h('button', { class: 'btn soft', onClick: choose }, icon('search'), t('chooseFood'))),
        remove);
      refreshKcal();
      return el;
    }
    el.append(
      foodThumb(item.food, 'sm'),
      h('div', { class: 'ai-main' },
        h('button', { class: 'quick-food', onClick: choose }, h('span', null, foodName(item.food, lang)), icon('edit')),
        h('span', { class: 'quick-typed' }, '“', h('bdi', { dir: 'auto' }, item.text), '”'),
        h('div', { class: 'ai-controls' }, amountControls(item, refreshKcal), kcalEl)),
      remove);
    refreshKcal();
    return el;
  }

  const addBtn = h('button', { class: 'btn primary grow' });
  function renderTotal() {
    const chosen = items.filter((it) => it.on && it.food && it.grams > 0);
    const kcal = chosen.reduce((s, it) => s + it.kcal, 0);
    addBtn.textContent = `${t('addSelected')} ${chosen.length} · ${fmt(kcal)} ${t('kcal')}`;
    addBtn.disabled = !chosen.length;
  }

  let added = false; // a double tap must not add everything twice
  addBtn.addEventListener('click', () => {
    const chosen = items.filter((it) => it.on && it.food && it.grams > 0);
    if (!chosen.length || added) return;
    added = true;
    addBtn.disabled = true;
    const next = chosen.reduce((state, it) => addEntry(state, dateKey, {
      foodId: it.food.id, meal, unit: it.unit, qty: it.qty, grams: it.grams,
      kcal: it.kcal, p: it.p, c: it.c, f: it.f, name: it.food.custom ? it.food.name : it.food.n,
    }), app.state);
    app.commit(next, t('quickAdded', { n: chosen.length }));
    sheet.close();
    onChange?.();
  });

  function reviewView() {
    if (!items.length) { writeView(); return; }
    const found = items.filter((it) => it.food).length;
    sheet.setBody(h('div', { class: 'stack' },
      h('p', { class: 'muted small' }, found ? t('quickReview') : t('quickNothing')),
      h('div', { class: 'quick-list' }, items.map(row)),
      h('div', { class: 'field' },
        h('span', { class: 'field-label' }, t('meal')),
        segmented(MEALS.map((m) => ({ value: m, label: MEAL_NAMES[m][lang] })), meal, (m) => { meal = m; }, 'meals-seg')),
      h('button', { class: 'link-btn', onClick: writeView }, icon('edit'), t('editText'))));
    sheet.setFooter(h('div', { class: 'footer-row' }, addBtn));
    renderTotal();
  }

  if (text.trim()) {
    items = parseQuickEntry(text, app.d.foods).map((it) => ({ ...it, on: true }));
    reviewView();
  } else {
    writeView();
  }
}
