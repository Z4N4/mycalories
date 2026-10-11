// Month screen: calendar of every day (green = within goal, orange = over) and monthly totals.

import { h, fmt } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { periodSummary, sumEntries } from '../core/calc.js';
import { fromKey, monthGrid, monthKeys, todayKey } from '../core/dates.js';
import { DAY_SHORT, MONTHS } from '../i18n/strings.js';
import { statCard } from './week.js';

function currentMonth(app) {
  if (app.ui.month) return app.ui.month;
  const d = fromKey(todayKey());
  return { y: d.getFullYear(), m: d.getMonth() };
}

function shiftMonth({ y, m }, delta) {
  const d = new Date(y, m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

function dayCell(app, key) {
  if (!key) return h('span', { class: 'cal-cell blank' });
  const { goal } = app.d;
  const today = todayKey();
  const entries = app.state.log[key];
  const kcal = sumEntries(entries).kcal;
  const status = !entries?.length ? 'none' : kcal > goal ? 'over' : 'ok';
  const cls = ['cal-cell', status, key === today && 'today', key > today && 'future'].filter(Boolean).join(' ');
  return h('button', { class: cls, onClick: () => app.go('today', { date: key }) },
    h('span', { class: 'cal-day' }, String(fromKey(key).getDate())),
    h('span', { class: 'cal-kcal' }, entries?.length ? fmt(kcal) : ''));
}

export function renderMonth(app) {
  const { t, lang, goal } = app.d;
  const month = currentMonth(app);
  const now = fromKey(todayKey());
  const isThisMonth = month.y === now.getFullYear() && month.m === now.getMonth();
  const today = todayKey();
  const keys = monthKeys(month.y, month.m).filter((k) => k <= today);
  const sum = periodSummary(app.state.log, keys, goal);

  return h('div', { class: 'page' },
    h('header', { class: 'page-header date-nav' },
      h('button', { class: 'icon-btn', 'aria-label': '‹', onClick: () => app.setUi({ month: shiftMonth(month, -1) }) }, icon('prev', 'flip')),
      h('button', { class: 'date-title', disabled: isThisMonth, onClick: () => app.setUi({ month: null }) },
        h('span', { class: 'title' }, MONTHS[lang][month.m]),
        h('span', { class: 'sub' }, String(month.y))),
      h('button', { class: 'icon-btn', 'aria-label': '›', onClick: () => app.setUi({ month: shiftMonth(month, 1) }) }, icon('next', 'flip'))),
    h('section', { class: 'card' },
      h('div', { class: 'calendar' },
        DAY_SHORT[lang].map((d) => h('span', { class: 'cal-head' }, d)),
        monthGrid(month.y, month.m).map((key) => dayCell(app, key))),
      h('div', { class: 'legend' },
        h('span', null, h('i', { class: 'dot-ok' }), t('underGoal')),
        h('span', null, h('i', { class: 'dot-over' }), t('overGoal')),
        h('span', null, h('i', { class: 'dot-none' }), t('noData')))),
    h('div', { class: 'grid-2' },
      statCard(t('dailyAverage'), fmt(sum.average), `${t('goal')} ${fmt(goal)}`),
      statCard(t('monthTotal'), fmt(sum.total), t('kcal')),
      statCard(t('loggedDays'), String(sum.loggedDays)),
      statCard(t('daysOver'), String(sum.overDays), null, sum.overDays ? 'warn' : '')));
}
