// Weight screen: log weight, see the trend and history.

import { h, fmt1, parseNumber } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { weightLine } from '../ui/charts.js';
import { fullDate } from '../ui/labels.js';
import { fieldError } from '../ui/controls.js';
import { todayKey, isValidKey } from '../core/dates.js';
import { setWeight, removeWeight } from '../core/store.js';
import { statCard } from './week.js';
import { isRtl } from '../i18n/strings.js';

const MAX_CHART_POINTS = 60;

function entryForm(app) {
  const { t } = app.d;
  const today = todayKey();
  const kg = h('input', {
    class: 'input', type: 'text', inputmode: 'decimal', 'aria-label': t('weight'),
    value: app.state.weights[today] != null ? fmt1(app.state.weights[today]) : '', placeholder: fmt1(app.state.profile.weightKg),
  });
  const date = h('input', { class: 'input', type: 'date', value: today, max: today, 'aria-label': t('date') });
  const errorSlot = h('div');

  function save() {
    const value = parseNumber(kg.value);
    if (!(value >= 25 && value <= 350) || !isValidKey(date.value) || date.value > today) {
      errorSlot.replaceChildren(fieldError(`${t('errNumber')} (25–350 ${t('kg')})`));
      return;
    }
    app.commit(setWeight(app.state, date.value, Math.round(value * 10) / 10), t('saved'));
  }

  return h('section', { class: 'card stack' },
    h('h2', { class: 'section-title' }, icon('weight'), t('logWeight')),
    h('div', { class: 'weight-form' },
      h('span', { class: 'input-wrap' }, kg, h('span', { class: 'input-unit' }, t('kg'))),
      date,
      h('button', { class: 'btn primary', onClick: save }, t('save'))),
    errorSlot);
}

export function renderWeight(app) {
  const { t, lang } = app.d;
  const points = Object.entries(app.state.weights)
    .map(([key, kg]) => ({ key, kg }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));

  if (!points.length) {
    return h('div', { class: 'page' },
      h('header', { class: 'page-header' }, h('h1', null, t('tabWeight'))),
      entryForm(app),
      h('p', { class: 'empty' }, t('noWeights')));
  }

  const first = points[0].kg;
  const last = points[points.length - 1].kg;
  const diff = Math.round((last - first) * 10) / 10;
  const sign = diff > 0 ? '+' : '';

  return h('div', { class: 'page' },
    h('header', { class: 'page-header' }, h('h1', null, t('tabWeight'))),
    entryForm(app),
    h('div', { class: 'grid-3' },
      statCard(t('startWeight'), fmt1(first), t('kg')),
      statCard(t('currentWeight'), fmt1(last), t('kg')),
      statCard(t('change'), `${sign}${fmt1(diff)}`, t('kg'), diff < 0 ? 'good' : '')),
    points.length > 1 && h('section', { class: 'card chart-card' }, weightLine(points.slice(-MAX_CHART_POINTS), isRtl(lang))),
    h('section', { class: 'card' },
      h('h2', { class: 'section-title' }, t('history')),
      h('div', { class: 'list' },
        [...points].reverse().map((p) => h('div', { class: 'list-row' },
          h('span', { class: 'grow' }, fullDate(p.key, lang)),
          h('strong', null, `${fmt1(p.kg)} ${t('kg')}`),
          h('button', {
            class: 'icon-btn small', 'aria-label': t('delete'),
            onClick: () => {
              const before = app.state;
              const after = removeWeight(before, p.key);
              app.commit(after, t('deleted'), { label: t('undo'), run: () => { if (app.state === after) app.commit(before); } });
            },
          }, icon('trash')))))));
}
