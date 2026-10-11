// Week screen (Saturday → Friday): bar chart, weekly total vs goal, averages.

import { h, fmt } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { weekBars } from '../ui/charts.js';
import { weekRange } from '../ui/labels.js';
import { periodSummary } from '../core/calc.js';
import { addDays, todayKey, weekKeys, weekStart } from '../core/dates.js';
import { DAY_SHORT, isRtl } from '../i18n/strings.js';

export function statCard(label, value, sub, cls = '') {
  return h('div', { class: `card stat-card ${cls}`.trim() },
    h('span', { class: 'stat-label' }, label),
    h('bdi', { class: 'stat-num', dir: 'ltr' }, value),
    sub && h('span', { class: 'stat-sub' }, sub));
}

function weekNav(app, keys) {
  const { t, lang } = app.d;
  const isThisWeek = keys.includes(todayKey());
  const anchor = app.ui.weekOf ?? todayKey();
  return h('header', { class: 'page-header date-nav' },
    h('button', { class: 'icon-btn', 'aria-label': '‹', onClick: () => app.setUi({ weekOf: addDays(weekStart(anchor), -7) }) }, icon('prev', 'flip')),
    h('button', { class: 'date-title', disabled: isThisWeek, onClick: () => app.setUi({ weekOf: todayKey() }) },
      h('span', { class: 'title' }, isThisWeek ? t('thisWeek') : t('tabWeek')),
      h('span', { class: 'sub' }, weekRange(keys, lang))),
    h('button', { class: 'icon-btn', 'aria-label': '›', onClick: () => app.setUi({ weekOf: addDays(weekStart(anchor), 7) }) }, icon('next', 'flip')));
}

export function renderWeek(app) {
  const { t, lang, goal } = app.d;
  const keys = weekKeys(app.ui.weekOf ?? todayKey());
  const sum = periodSummary(app.state.log, keys, goal);
  const today = todayKey();
  const pct = sum.goalTotal ? Math.min(100, (sum.total / sum.goalTotal) * 100) : 0;
  const overWeek = sum.total > sum.goalTotal;

  const days = sum.days.map((d, i) => ({ key: d.key, value: d.kcal, label: DAY_SHORT[lang][i], today: d.key === today }));
  // The chart is drawn left-to-right; in Badini/Arabic Saturday belongs on the right.
  const shownDays = isRtl(lang) ? [...days].reverse() : days;
  const openDay = (key) => app.go('today', { date: key });
  const m = sum.avgMacros;

  return h('div', { class: 'page' },
    weekNav(app, keys),
    h('section', { class: 'card' },
      h('div', { class: 'week-total' },
        h('div', null,
          h('span', { class: 'stat-label' }, t('weekTotal')),
          h('span', { class: `big-num${overWeek ? ' over' : ''}` }, fmt(sum.total), h('small', null, ` ${t('kcal')}`))),
        h('div', { class: 'end' },
          h('span', { class: 'stat-label' }, t('weekGoal')),
          h('span', { class: 'stat-num' }, fmt(sum.goalTotal)))),
      h('div', { class: `meter big${overWeek ? ' over' : ''}` }, h('span', { style: `width:${pct}%` })),
      weekBars(shownDays, goal, openDay),
      h('p', { class: 'muted small center' }, t('tapDayHint'))),
    h('div', { class: 'grid-2' },
      statCard(t('dailyAverage'), fmt(sum.average), `${t('goal')} ${fmt(goal)}`),
      statCard(t('loggedDays'), `${sum.loggedDays} / 7`),
      statCard(t('daysOver'), String(sum.overDays), null, sum.overDays ? 'warn' : '')),
    h('section', { class: 'card stack' },
      h('span', { class: 'stat-label' }, t('avgMacros')),
      h('div', { class: 'macro-chips start' },
        h('span', { class: 'chip protein' }, `${t('protein')} ${m.p}${t('gramShort')}`),
        h('span', { class: 'chip carbs' }, `${t('carbs')} ${m.c}${t('gramShort')}`),
        h('span', { class: 'chip fat' }, `${t('fat')} ${m.f}${t('gramShort')}`))));
}
