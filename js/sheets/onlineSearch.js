// "Search online": any food or drink in the world. Two sources side by side:
// packaged products from Open Food Facts (label values) and an AI estimate
// (anything, e.g. restaurant or home dishes). The chosen one is saved to
// "My foods", so next time it is found instantly, even offline.

import { h, fmt, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { saveCustomFood, findCustomByBarcode } from '../core/store.js';
import { searchProducts } from '../services/openFoodFacts.js';
import { lookupOnline, aiAvailable } from '../services/ai.js';
import { openFoodDetail } from './foodDetail.js';

export function openOnlineSearch(app, { query: startQuery, dateKey, meal, onChange }) {
  const { t, lang } = app.d;
  const input = h('input', { class: 'input search-input', type: 'search', value: startQuery, enterkeyhint: 'search', autocomplete: 'off' });
  const productsEl = h('div', { class: 'stack' });
  const aiEl = h('div', { class: 'stack' });
  let run = 0; // ignore answers from an older search
  let used = false; // a double tap must not save the food twice

  function useFood(found) {
    if (used) return;
    used = true;
    // Already saved (same barcode)? Use that instead of a copy.
    const existing = found.barcode ? findCustomByBarcode(app.state, found.barcode) : null;
    let id = existing?.id;
    if (!id) {
      const { confidence: _c, ...clean } = found;
      const next = saveCustomFood(app.state, clean);
      id = next.customFoods[0].id;
      app.commit(next, t('savedToMyFoods'));
    }
    sheet.close();
    onChange?.();
    const food = app.d.foodsById.get(id);
    if (food) openFoodDetail(app, { food, dateKey, meal, onChange });
  }

  const resultRow = (found, badge) => h('button', { class: 'food-row', onClick: () => useFood(found) },
    h('span', { class: 'thumb md emoji' }, badge),
    h('span', { class: 'food-text' },
      h('span', { class: 'food-name' }, found.name),
      h('span', { class: 'food-sub' }, `${found.servingName || `${fmt(found.servingG)} g`} · ${fmt(found.kcal)} ${t('kcal')}`,
        found.confidence === 'low' ? ` · ${t('notSure')}` : '')),
    h('span', { class: 'food-add' }, icon('plus')));

  const section = (el, title, body) => el.replaceChildren(h('h3', { class: 'section-title small' }, title), body);
  const loading = () => h('div', { class: 'analyzing' }, h('span', { class: 'spinner' }), t('lookingUp'));
  const list = (rows) => h('div', { class: 'food-list' }, rows);

  async function search() {
    const query = input.value.trim();
    if (query.length < 2) return;
    run += 1;
    const mine = run;
    section(productsEl, `📦 ${t('onlineProducts')}`, loading());
    section(aiEl, `✨ ${t('onlineAi')}`, aiAvailable() ? loading() : h('p', { class: 'muted small' }, t('aiCouldHelp')));

    searchProducts(query, lang).then((res) => {
      if (mine !== run) return;
      if (res.status !== 'ok') { section(productsEl, `📦 ${t('onlineProducts')}`, h('p', { class: 'field-error' }, t(res.status === 'busy' ? 'searchBusy' : 'offline'))); return; }
      section(productsEl, `📦 ${t('onlineProducts')}`, res.foods.length
        ? list(res.foods.map((f) => resultRow(f, '📦')))
        : h('p', { class: 'muted small' }, t('noResults')));
    });

    if (!aiAvailable()) return;
    lookupOnline(query).then((foods) => {
      if (mine !== run) return;
      section(aiEl, `✨ ${t('onlineAi')}`, foods.length
        ? h('div', { class: 'stack' }, list(foods.map((f) => resultRow(f, '✨'))), h('p', { class: 'note' }, icon('info'), t('aiCheckNote')))
        : h('p', { class: 'muted small' }, t('noResults')));
    }).catch((err) => {
      if (mine !== run) return;
      const key = { quota: 'aiQuota', badKey: 'aiBadKey', offline: 'offline' }[err?.code] ?? 'aiFailed';
      section(aiEl, `✨ ${t('onlineAi')}`, h('div', null,
        h('p', { class: 'field-error' }, t(key)),
        err?.detail ? h('p', { class: 'muted small detail-text', dir: 'ltr' }, err.detail) : ''));
    });
  }

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } });
  const sheet = openSheet({
    title: t('searchOnline'),
    closeLabel: t('close'),
    tall: true,
    body: h('div', { class: 'stack' },
      h('div', { class: 'inline-form' },
        h('div', { class: 'search-wrap grow' }, icon('search', 'search-icon'), input),
        h('button', { class: 'btn primary', onClick: search }, t('find'))),
      h('p', { class: 'muted small' }, t('onlineHint')),
      productsEl,
      aiEl),
  });
  if (!navigator.onLine) toast(t('offline'));
  search();
}
