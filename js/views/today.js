// Today screen: calorie ring, macros, and the four meals for the chosen day.

import { h, fmt } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { ring } from '../ui/charts.js';
import { dayLabel, fullDate, portionText } from '../ui/labels.js';
import { sumEntries } from '../core/calc.js';
import { addDays, todayKey } from '../core/dates.js';
import { MEALS, copyMeal } from '../core/store.js';
import { MEAL_NAMES } from '../i18n/strings.js';
import { entryName } from '../foods/index.js';
import { openAddFood } from '../sheets/addFood.js';
import { openEntry } from '../sheets/foodDetail.js';

function dateNav(app, key) {
  const { t, lang } = app.d;
  const isToday = key === todayKey();
  return h('header', { class: 'page-header date-nav' },
    h('button', { class: 'icon-btn', 'aria-label': t('yesterday'), onClick: () => app.setUi({ date: addDays(key, -1) }) },
      icon('prev', 'flip')),
    h('button', {
      class: 'date-title', onClick: () => app.setUi({ date: todayKey() }), disabled: isToday,
    },
    h('span', { class: 'title' }, dayLabel(key, t, lang)),
    h('span', { class: 'sub' }, fullDate(key, lang))),
    h('button', { class: 'icon-btn', 'aria-label': t('tomorrow'), onClick: () => app.setUi({ date: addDays(key, 1) }) },
      icon('next', 'flip')));
}

function macroBar(label, value, target, cls, t) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return h('div', { class: `macro ${cls}` },
    h('div', { class: 'macro-top' },
      h('span', { class: 'macro-label' }, label),
      h('bdi', { class: 'macro-num', dir: 'ltr' }, `${fmt(value)} / ${fmt(target)} ${t('gramShort')}`)),
    h('div', { class: 'meter' }, h('span', { style: `width:${pct}%` })));
}

function summary(app, totals) {
  const { t, goal, macros } = app.d;
  const left = goal - totals.kcal;
  const over = left < 0;
  return h('section', { class: 'card summary' },
    h('div', { class: 'ring-wrap' },
      ring(totals.kcal, goal),
      h('div', { class: 'ring-center' },
        h('span', { class: `ring-big${over ? ' over' : ''}` }, fmt(Math.abs(left))),
        h('span', { class: 'ring-small' }, over ? `${t('over')} · ${t('kcal')}` : `${t('remaining')} · ${t('kcal')}`))),
    h('div', { class: 'summary-stats' },
      h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, t('goal')), h('span', { class: 'stat-num' }, fmt(goal))),
      h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, t('eaten')), h('span', { class: 'stat-num' }, fmt(totals.kcal)))),
    h('div', { class: 'macros' },
      macroBar(t('protein'), totals.p, macros.p, 'protein', t),
      macroBar(t('carbs'), totals.c, macros.c, 'carbs', t),
      macroBar(t('fat'), totals.f, macros.f, 'fat', t)));
}

function copyFromYesterday(app, key, meal) {
  const { t } = app.d;
  const from = addDays(key, -1);
  const count = (app.state.log[from] ?? []).filter((e) => e.meal === meal).length;
  if (!count) {
    app.commit(app.state, t('nothingToCopy'));
    return;
  }
  const before = app.state;
  const after = copyMeal(before, from, key, meal);
  app.commit(after, t('copiedN', { n: count }), {
    label: t('undo'),
    run: () => { if (app.state === after) app.commit(before); },
  });
}

function entryRow(app, key, entry) {
  const { lang, t, foodsById } = app.d;
  const food = foodsById.get(entry.foodId);
  return h('button', { class: 'entry', onClick: () => openEntry(app, key, entry) },
    h('span', { class: 'entry-text' },
      h('span', { class: 'entry-name' }, entryName(entry, foodsById, lang)),
      h('span', { class: 'entry-sub' }, portionText(entry.unit, entry.qty, entry.grams, lang, food, t))),
    h('span', { class: 'entry-kcal' }, fmt(entry.kcal)));
}

function mealCard(app, key, meal, entries) {
  const { t, lang } = app.d;
  const total = sumEntries(entries).kcal;
  return h('section', { class: 'card meal' },
    h('header', { class: 'meal-header' },
      h('h3', null, MEAL_NAMES[meal][lang]),
      h('span', { class: 'meal-kcal' }, entries.length ? `${fmt(total)} ${t('kcal')}` : ''),
      h('button', {
        class: 'icon-btn small', 'aria-label': t('copyYesterday'), title: t('copyYesterday'),
        onClick: () => copyFromYesterday(app, key, meal),
      }, icon('copy'))),
    entries.length
      ? h('div', { class: 'entries' }, entries.map((e) => entryRow(app, key, e)))
      : h('p', { class: 'empty' }, t('nothingYet')),
    h('button', { class: 'add-row', onClick: () => openAddFood(app, key, meal) }, icon('plus'), t('addFood')));
}

export function renderToday(app) {
  const key = app.ui.date;
  const entries = app.state.log[key] ?? [];
  return h('div', { class: 'page' },
    dateNav(app, key),
    summary(app, sumEntries(entries)),
    MEALS.map((meal) => mealCard(app, key, meal, entries.filter((e) => e.meal === meal))));
}
