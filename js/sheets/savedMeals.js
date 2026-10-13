// Saved meals: keep a usual meal (e.g. samoon + 2 eggs + cheese + tea) and add
// all of it again with one tap.

import { h, fmt } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { textField, fieldError } from '../ui/controls.js';
import { foodThumb } from '../ui/foodThumb.js';
import { sumEntries } from '../core/calc.js';
import { saveMeal, addSavedMeal, deleteSavedMeal } from '../core/store.js';
import { entryName } from '../foods/index.js';
import { MEAL_NAMES } from '../i18n/strings.js';

const TAP_GUARD_MS = 800; // adding the same meal again on purpose is fine, a double tap is not

/** Ask for a name and save the given entries as a meal. */
export function openSaveMeal(app, meal, entries) {
  const { t, lang } = app.d;
  const name = textField({ id: 'saved-meal-name', label: t('mealName'), value: `${MEAL_NAMES[meal][lang]} · ${fmt(sumEntries(entries).kcal)} ${t('kcal')}`, maxlength: 40 });
  const errorSlot = h('div');
  let saved = false; // a double tap must not save the meal twice
  const save = () => {
    const value = name.input.value.trim();
    if (!value) { errorSlot.replaceChildren(fieldError(t('errName'))); return; }
    if (saved) return;
    saved = true;
    app.commit(saveMeal(app.state, value, entries), t('mealSaved'));
    sheet.close();
  };
  const sheet = openSheet({
    title: t('saveMeal'),
    closeLabel: t('close'),
    body: h('div', { class: 'stack' },
      h('p', { class: 'muted small' }, t('saveMealHint')),
      name.el,
      errorSlot,
      h('div', { class: 'food-list' }, entries.map((e) => h('div', { class: 'food-row static' },
        foodThumb(app.d.foodsById.get(e.foodId), 'sm'),
        h('span', { class: 'food-text' }, h('span', { class: 'food-name' }, entryName(e, app.d.foodsById, lang))),
        h('span', { class: 'muted' }, `${fmt(e.kcal)} ${t('kcal')}`))))),
    footer: h('div', { class: 'footer-row' }, h('button', { class: 'btn primary grow', onClick: save }, icon('check'), t('save'))),
  });
}

/** Rows for the "My meals" tab of the Add food sheet. */
export function savedMealRows(app, { dateKey, meal, onChange }) {
  const { t, lang } = app.d;
  let busy = false; // a double tap adds the meal once
  return app.state.savedMeals.map((saved) => {
    const kcal = sumEntries(saved.items).kcal;
    const names = saved.items.slice(0, 4).map((e) => entryName(e, app.d.foodsById, lang)).join(lang === 'en' ? ', ' : '، ');
    return h('div', { class: 'food-row saved-meal' },
      h('button', {
        class: 'saved-meal-main',
        onClick: () => {
          if (busy) return;
          busy = true;
          setTimeout(() => { busy = false; }, TAP_GUARD_MS);
          const before = app.state;
          const after = addSavedMeal(before, dateKey, meal, saved);
          app.commit(after, t('quickAdded', { n: saved.items.length }), {
            label: t('undo'), run: () => { if (app.state === after) app.commit(before); },
          });
          onChange?.();
        },
      },
      h('span', { class: 'thumb md emoji' }, '🍽️'),
      h('span', { class: 'food-text' },
        h('span', { class: 'food-name' }, saved.name),
        h('span', { class: 'food-sub' }, `${saved.items.length} · ${fmt(kcal)} ${t('kcal')} · ${names}${saved.items.length > 4 ? '…' : ''}`)),
      h('span', { class: 'food-add' }, icon('plus'))),
      h('button', {
        class: 'icon-btn small', 'aria-label': t('delete'),
        onClick: () => {
          if (!window.confirm(t('deleteMealConfirm'))) return;
          app.commit(deleteSavedMeal(app.state, saved.id), t('deleted'));
          onChange?.();
        },
      }, icon('trash')));
  });
}
