// Meal plan screen: a day of meals that fits the calorie goal, with swap and
// "add to diary" per meal or for the whole day.

import { h, fmt } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { segmented } from '../ui/controls.js';
import { dayLabel, fullDate, portionText } from '../ui/labels.js';
import { planDay } from '../core/planner.js';
import { addDays, todayKey } from '../core/dates.js';
import { addEntry, setSettings, swapPlanMeal } from '../core/store.js';
import { foodName } from '../foods/index.js';
import { MEAL_NAMES } from '../i18n/strings.js';

function entryFrom(item, meal) {
  const { food } = item;
  return {
    foodId: food.id, meal, unit: item.unit, qty: item.qty, grams: item.grams,
    kcal: item.kcal, p: item.p, c: item.c, f: item.f, name: food.custom ? food.name : food.n,
  };
}

function addMeals(app, dateKey, meals, message) {
  const next = meals.reduce(
    (state, m) => m.items.reduce((s, item) => addEntry(s, dateKey, entryFrom(item, m.meal)), state),
    app.state,
  );
  app.commit(next, message);
}

function mealCard(app, dateKey, m) {
  const { t, lang } = app.d;
  return h('section', { class: 'card meal plan-meal' },
    h('header', { class: 'meal-header' },
      h('h3', null, MEAL_NAMES[m.meal][lang]),
      h('span', { class: 'meal-kcal' }, `${fmt(m.kcal)} ${t('kcal')}`)),
    h('div', { class: 'entries' }, m.items.map((item) => h('div', { class: 'entry static' },
      h('span', { class: 'entry-text' },
        h('span', { class: 'entry-name' }, foodName(item.food, lang)),
        h('span', { class: 'entry-sub' }, portionText(item.unit, item.qty, item.grams, lang, item.food, t))),
      h('span', { class: 'entry-kcal' }, fmt(item.kcal))))),
    h('div', { class: 'plan-actions' },
      h('button', {
        class: 'btn ghost',
        onClick: () => app.commit(swapPlanMeal(app.state, dateKey, m.meal)),
      }, icon('swap'), t('swap')),
      h('button', {
        class: 'btn soft',
        onClick: () => addMeals(app, dateKey, [m], t('mealAdded')),
      }, icon('plus'), t('addMeal'))));
}

export function renderPlan(app) {
  const { t, lang, goal, macros, foodsById } = app.d;
  const dateKey = app.ui.planDate ?? todayKey();
  const style = app.state.settings.planStyle ?? 'traditional';
  const plan = planDay({ dateKey, goal, style, swaps: app.state.planSwaps?.[dateKey] ?? {}, foodsById });
  const { total } = plan;

  return h('div', { class: 'page' },
    h('header', { class: 'page-header date-nav' },
      h('button', { class: 'icon-btn', 'aria-label': t('yesterday'), onClick: () => app.setUi({ planDate: addDays(dateKey, -1) }) }, icon('prev', 'flip')),
      h('button', { class: 'date-title', disabled: dateKey === todayKey(), onClick: () => app.setUi({ planDate: todayKey() }) },
        h('span', { class: 'title' }, `${t('planTitle')} · ${dayLabel(dateKey, t, lang)}`),
        h('span', { class: 'sub' }, fullDate(dateKey, lang))),
      h('button', { class: 'icon-btn', 'aria-label': t('tomorrow'), onClick: () => app.setUi({ planDate: addDays(dateKey, 1) }) }, icon('next', 'flip'))),
    segmented([
      { value: 'traditional', label: t('styleTraditional') },
      { value: 'simple', label: t('styleSimple') },
    ], style, (value) => app.commit(setSettings(app.state, { planStyle: value }))),
    h('section', { class: 'card plan-summary' },
      h('div', { class: 'week-total' },
        h('div', null,
          h('span', { class: 'stat-label' }, t('planTotal')),
          h('span', { class: 'big-num' }, fmt(total.kcal), h('small', null, ` ${t('kcal')}`))),
        h('div', { class: 'end' },
          h('span', { class: 'stat-label' }, t('goal')),
          h('span', { class: 'stat-num' }, fmt(goal)))),
      h('div', { class: 'macro-chips start' },
        h('span', { class: 'chip protein' }, `${t('protein')} ${fmt(total.p)}/${macros.p}${t('gramShort')}`),
        h('span', { class: 'chip carbs' }, `${t('carbs')} ${fmt(total.c)}/${macros.c}${t('gramShort')}`),
        h('span', { class: 'chip fat' }, `${t('fat')} ${fmt(total.f)}/${macros.f}${t('gramShort')}`)),
      h('p', { class: 'muted small' }, t('planHint'))),
    plan.meals.map((m) => mealCard(app, dateKey, m)),
    h('button', {
      class: 'btn primary big',
      onClick: () => {
        addMeals(app, dateKey, plan.meals, t('dayAdded'));
        app.go('today', { date: dateKey });
      },
    }, icon('check'), t('addDay')));
}
