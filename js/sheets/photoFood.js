// Calories from a photo: Gemini names the foods and estimates grams, the user
// checks the amounts, then the chosen items are added to the meal.

import { h, fmt, parseNumber } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet, closeAllSheets } from '../ui/sheet.js';
import { segmented } from '../ui/controls.js';
import { nutritionFor } from '../core/calc.js';
import { MEALS, addEntry } from '../core/store.js';
import { foodName } from '../foods/index.js';
import { MEAL_NAMES } from '../i18n/strings.js';
import { analyzePhoto, getKey, AiError } from '../services/gemini.js';
import { shrinkImage } from '../services/image.js';

const GRAM_STEP = 10;
const ERROR_TEXT = { noKey: 'aiNoKey', badKey: 'aiBadKey', quota: 'aiQuota', offline: 'offline', failed: 'aiFailed' };

function noKeyBody(app, t) {
  return h('div', { class: 'stack center-block' },
    h('div', { class: 'big-icon' }, icon('sparkle')),
    h('p', null, t('aiNoKey')),
    h('button', { class: 'btn primary', onClick: () => { closeAllSheets(); app.go('settings'); } }, icon('key'), t('openSettings')));
}

/** One row per recognised food: include toggle, name, grams stepper, kcal. */
function itemRow(app, item, onChange) {
  const { t, lang } = app.d;
  const kcalEl = h('span', { class: 'ai-kcal' });
  const grams = h('input', { class: 'input grams-input', type: 'text', inputmode: 'numeric', value: String(item.grams), 'aria-label': t('grams') });
  const refresh = () => {
    kcalEl.textContent = `${fmt(nutritionFor(item.food, item.grams).kcal)} ${t('kcal')}`;
    row.classList.toggle('off', !item.on);
  };
  const setGrams = (g) => {
    item.grams = Math.max(1, Math.min(2000, Math.round(g)));
    grams.value = String(item.grams);
    refresh();
    onChange();
  };
  grams.addEventListener('input', () => {
    const g = parseNumber(grams.value);
    if (g > 0) { item.grams = Math.min(2000, Math.round(g)); refresh(); onChange(); }
  });
  const toggle = h('button', {
    class: 'ai-toggle', 'aria-pressed': 'true', 'aria-label': foodName(item.food, lang),
    onClick: () => {
      item.on = !item.on;
      toggle.setAttribute('aria-pressed', String(item.on));
      refresh();
      onChange();
    },
  }, icon('check'));
  const row = h('div', { class: 'ai-row' },
    toggle,
    h('div', { class: 'ai-main' },
      h('span', { class: 'ai-name' }, foodName(item.food, lang),
        item.confidence === 'low' ? h('span', { class: 'badge warn' }, t('notSure')) : ''),
      h('div', { class: 'ai-controls' },
        h('button', { class: 'icon-btn small round', 'aria-label': '−', onClick: () => setGrams(item.grams - GRAM_STEP) }, icon('minus')),
        h('span', { class: 'input-wrap grams-wrap' }, grams, h('span', { class: 'input-unit' }, t('gramShort'))),
        h('button', { class: 'icon-btn small round', 'aria-label': '+', onClick: () => setGrams(item.grams + GRAM_STEP) }, icon('plus')),
        kcalEl)));
  refresh();
  return row;
}

export function openPhotoFood(app, { dateKey, meal: startMeal, onChange }) {
  const { t, lang } = app.d;
  let meal = startMeal;
  let items = [];

  const fileInput = h('input', { type: 'file', accept: 'image/*', class: 'hidden' });
  const pickBtn = () => h('button', { class: 'btn primary big', onClick: () => fileInput.click() }, icon('camera'), t('takePhoto'));

  function startView() {
    return h('div', { class: 'stack' },
      h('div', { class: 'photo-drop', onClick: () => fileInput.click() }, icon('camera'), h('span', null, t('takePhoto'))),
      h('p', { class: 'note' }, icon('info'), t('photoHint')),
      h('p', { class: 'note' }, icon('info'), t('aiPrivacy')));
  }

  function errorView(code, preview) {
    sheet.setFooter(null);
    return h('div', { class: 'stack' },
      preview,
      h('p', { class: 'field-error center' }, t(ERROR_TEXT[code] ?? 'aiFailed')),
      code === 'badKey' || code === 'noKey'
        ? h('button', { class: 'btn', onClick: () => { closeAllSheets(); app.go('settings'); } }, t('openSettings'))
        : pickBtn());
  }

  function totalKcal() {
    return items.filter((i) => i.on).reduce((s, i) => s + nutritionFor(i.food, i.grams).kcal, 0);
  }

  function addAll() {
    const chosen = items.filter((i) => i.on && i.grams > 0);
    if (!chosen.length) return;
    const next = chosen.reduce((state, i) => addEntry(state, dateKey, {
      foodId: i.custom ? 'ai_other' : i.food.id, meal, unit: 'g', qty: i.grams, grams: i.grams,
      ...nutritionFor(i.food, i.grams), name: i.custom ? i.food.name : i.food.n,
    }), app.state);
    app.commit(next, t('added'));
    sheet.close();
    onChange?.();
  }

  function resultsView(preview) {
    if (!items.length) return errorViewNoFood(preview);
    const addBtn = h('button', { class: 'btn primary grow', onClick: addAll });
    const updateTotal = () => {
      const kcal = totalKcal();
      addBtn.textContent = `${t('addSelected')} · ${fmt(kcal)} ${t('kcal')}`;
      addBtn.disabled = !items.some((i) => i.on);
    };
    sheet.setFooter(h('div', { class: 'footer-row' }, addBtn));
    updateTotal();
    return h('div', { class: 'stack' },
      preview,
      h('p', { class: 'muted small' }, t('aiFound')),
      h('div', { class: 'ai-list' }, items.map((i) => itemRow(app, i, updateTotal))),
      h('div', { class: 'field' },
        h('span', { class: 'field-label' }, t('meal')),
        segmented(MEALS.map((m) => ({ value: m, label: MEAL_NAMES[m][lang] })), meal, (m) => { meal = m; }, 'meals-seg')),
      h('p', { class: 'note' }, icon('info'), t('aiCheckNote')),
      pickBtn());
  }

  function errorViewNoFood(preview) {
    sheet.setFooter(null);
    return h('div', { class: 'stack' }, preview, h('p', { class: 'center muted' }, t('noFoodFound')), pickBtn());
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    sheet.setFooter(null);
    let image;
    try {
      image = await shrinkImage(file);
    } catch {
      sheet.setBody(errorView('failed', h('p', { class: 'field-error center' }, t('imageUnreadable'))));
      return;
    }
    const preview = h('img', { class: 'photo-preview', src: image.dataUrl, alt: '' });
    sheet.setBody(h('div', { class: 'stack' }, preview, h('div', { class: 'analyzing' }, h('span', { class: 'spinner' }), t('analyzing'))));
    try {
      const found = await analyzePhoto(image, app.d.foodsById);
      items = found.map((i) => ({ ...i, on: true }));
      sheet.setBody(resultsView(preview));
    } catch (err) {
      sheet.setBody(errorView(err instanceof AiError ? err.code : 'failed', preview));
    }
  });

  const sheet = openSheet({
    title: t('photoTitle'),
    closeLabel: t('close'),
    tall: true,
    body: getKey() ? startView() : noKeyBody(app, t),
  });
  sheet.panel.append(fileInput);
}
