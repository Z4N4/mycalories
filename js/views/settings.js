// Settings: language, your details, daily goal, my foods, backup, reset.

import { h, fmt, parseNumber } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { segmented, numberField, fieldError } from '../ui/controls.js';
import { dailyGoal } from '../core/calc.js';
import { setSettings, setProfile, setWeight, createInitialState } from '../core/store.js';
import { todayKey } from '../core/dates.js';
import { LANG_LABELS } from '../i18n/strings.js';
import { profileForm } from './profileForm.js';
import { openCustomFood } from '../sheets/customFood.js';
import { exportBackup, importBackup } from './backup.js';
import { aiSection } from './aiSettings.js';

function section(title, iconName, ...children) {
  return h('section', { class: 'card stack' }, h('h2', { class: 'section-title' }, icon(iconName), title), ...children);
}

function openProfile(app) {
  const { t } = app.d;
  const form = profileForm(t, app.state.profile);
  const sheet = openSheet({
    title: t('profile'),
    closeLabel: t('close'),
    body: form.el,
    footer: h('button', {
      class: 'btn primary grow',
      onClick: () => {
        const profile = form.read();
        if (!profile) return;
        const weightChanged = profile.weightKg !== app.state.profile.weightKg;
        // A new weight also goes into the weight log, so the two never disagree.
        const withProfile = setProfile(app.state, profile);
        app.commit(weightChanged ? setWeight(withProfile, todayKey(), profile.weightKg) : withProfile, t('saved'));
        sheet.close();
      },
    }, t('save')),
  });
}

function goalSection(app) {
  const { t, goal, macros } = app.d;
  const { profile } = app.state;
  const calculated = dailyGoal({ ...profile, customGoal: null });
  const custom = Number.isFinite(profile.customGoal);
  const own = numberField({ id: 'own-goal', label: t('useMyOwnGoal'), value: custom ? profile.customGoal : '', unit: t('kcal'), placeholder: String(calculated) });
  const errorSlot = h('div');

  const saveOwn = () => {
    const n = parseNumber(own.input.value);
    if (!(n >= 800 && n <= 6000)) {
      errorSlot.replaceChildren(fieldError(`${t('errNumber')} (800–6000)`));
      return;
    }
    app.commit(setProfile(app.state, { customGoal: Math.round(n) }), t('saved'));
  };

  return section(t('dailyGoal'), 'target',
    h('div', { class: 'goal-now' }, h('strong', null, fmt(goal)), h('span', null, ` ${t('kcal')}`)),
    h('p', { class: 'muted small' }, `${t('macroTargets')}: ${macros.p} / ${macros.c} / ${macros.f} ${t('gramShort')}`),
    h('div', { class: 'list-row' },
      h('span', { class: 'grow' }, t('calculatedGoal')),
      h('strong', null, `${fmt(calculated)} ${t('kcal')}`)),
    h('div', { class: 'inline-form' }, own.el, h('button', { class: 'btn', onClick: saveOwn }, t('save'))),
    errorSlot,
    custom && h('button', {
      class: 'link-btn',
      onClick: () => app.commit(setProfile(app.state, { customGoal: null }), t('saved')),
    }, t('useCalculated')));
}

function profileSection(app) {
  const { t } = app.d;
  const p = app.state.profile;
  const row = (label, value) => h('div', { class: 'list-row' }, h('span', { class: 'grow muted' }, label), h('strong', null, value));
  return section(t('profile'), 'user',
    row(t('sex'), t(p.sex)),
    row(t('age'), `${p.age} ${t('years')}`),
    row(t('height'), `${p.heightCm} ${t('cm')}`),
    row(t('weight'), `${p.weightKg} ${t('kg')}`),
    row(t('activity'), t(`act_${p.activity}`)),
    row(t('goalType'), t(`goal_${p.goal}`)),
    h('button', { class: 'btn', onClick: () => openProfile(app) }, icon('edit'), t('edit')));
}

function myFoodsSection(app) {
  const { t } = app.d;
  const foods = app.state.customFoods;
  return section(t('myFoods'), 'bowl',
    foods.length
      ? h('div', { class: 'list' }, foods.map((f) => h('button', {
        class: 'list-row tap', onClick: () => openCustomFood(app, f),
      }, h('span', { class: 'grow' }, f.name), h('span', { class: 'muted' }, `${fmt(f.kcal)} ${t('kcal')}`), icon('edit'))))
      : h('p', { class: 'muted' }, t('noMyFoods')),
    h('button', { class: 'btn', onClick: () => openCustomFood(app, null) }, icon('plus'), t('createFood')));
}

function dataSection(app) {
  const { t } = app.d;
  const fileInput = h('input', {
    type: 'file', accept: 'application/json,.json', class: 'hidden',
    onChange: () => { importBackup(app, fileInput.files?.[0]); fileInput.value = ''; },
  });
  return section(t('backup'), 'download',
    h('p', { class: 'muted small' }, t('backupHint')),
    h('div', { class: 'grid-2' },
      h('button', { class: 'btn', onClick: () => exportBackup(app) }, icon('download'), t('exportData')),
      h('button', { class: 'btn', onClick: () => fileInput.click() }, icon('upload'), t('importData'))),
    fileInput,
    h('button', {
      class: 'btn danger-ghost',
      onClick: () => {
        if (!window.confirm(t('resetConfirm'))) return;
        app.commit(setSettings(createInitialState(), { lang: app.state.settings.lang }));
        app.setUi({ onboardStep: 0 });
      },
    }, icon('trash'), t('resetAll')));
}

export function renderSettings(app) {
  const { t, lang } = app.d;
  return h('div', { class: 'page' },
    h('header', { class: 'page-header' }, h('h1', null, t('tabSettings'))),
    section(t('language'), 'globe',
      segmented(Object.entries(LANG_LABELS).map(([value, label]) => ({ value, label })), lang,
        (code) => app.commit(setSettings(app.state, { lang: code })), 'lang-seg')),
    goalSection(app),
    profileSection(app),
    aiSection(app),
    myFoodsSection(app),
    dataSection(app),
    section(t('about'), 'info',
      h('p', { class: 'muted small' }, t('disclaimer')),
      h('p', { class: 'muted small' }, t('installHint')),
      h('p', { class: 'muted small' }, 'MyCalories 1.0')));
}
