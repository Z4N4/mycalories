// Settings card "Daily goal": calories (deficit / surplus size or own number)
// and the protein / carbs / fat split.

import { h, fmt, fmt1, parseNumber } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { numberField, fieldError } from '../ui/controls.js';
import {
  dailyGoal, goalChange, kgPerWeek, macroTargets, isValidSplit,
  DEFICIT_OPTIONS, SURPLUS_OPTIONS, DEFAULT_SPLIT, MACRO_PRESETS,
} from '../core/calc.js';
import { setProfile } from '../core/store.js';

const MACROS = [
  { key: 'p', label: 'protein', perGram: 4 },
  { key: 'c', label: 'carbs', perGram: 4 },
  { key: 'f', label: 'fat', perGram: 9 },
];

const sameSplit = (a, b) => a.p === b.p && a.c === b.c && a.f === b.f;
const signed = (n) => `${n > 0 ? '+' : '−'}${Math.abs(n)}`;

/** Chips for how big the daily deficit (or surplus) is. */
function changeChooser(app) {
  const { t } = app.d;
  const { profile } = app.state;
  if (profile.goal === 'keep') return h('p', { class: 'muted small' }, t('keepingWeight'));
  const options = profile.goal === 'lose' ? DEFICIT_OPTIONS : SURPLUS_OPTIONS;
  const current = goalChange(profile);
  return h('div', { class: 'field' },
    h('span', { class: 'field-label' }, t(profile.goal === 'lose' ? 'deficitSize' : 'surplusSize')),
    h('div', { class: 'change-grid' }, options.map((v) => h('button', {
      class: `change-btn${v === current && !Number.isFinite(profile.customGoal) ? ' active' : ''}`,
      onClick: () => app.commit(setProfile(app.state, { goalChange: v, customGoal: null }), t('saved')),
    },
    // Numbers are isolated so "−750" never flips around inside Badini/Arabic text.
    h('strong', null, h('bdi', { dir: 'ltr' }, signed(v)), ` ${t('kcal')}`),
    h('small', null, '≈ ', h('bdi', { dir: 'ltr' }, signed(kgPerWeek(v))), ` ${t('kg')} / ${t('perWeek')}`)))),
    Math.abs(current) >= 750 && h('p', { class: 'note' }, icon('info'), t('bigDeficitNote')));
}

/** Presets and own percentages for protein / carbs / fat. */
function macroChooser(app) {
  const { t, goal } = app.d;
  const saved = isValidSplit(app.state.profile.macroSplit) ? app.state.profile.macroSplit : DEFAULT_SPLIT;
  let draft = { ...saved };
  const presetName = Object.keys(MACRO_PRESETS).find((k) => sameSplit(MACRO_PRESETS[k], saved)) ?? 'custom';
  let showCustom = presetName === 'custom';

  const editor = h('div', { class: 'macro-editor' });
  const totalEl = h('p', { class: 'macro-total' });
  const saveBtn = h('button', { class: 'btn primary' }, t('save'));

  const fields = MACROS.map((m) => {
    const field = numberField({ id: `split-${m.key}`, label: t(m.label), value: draft[m.key], unit: '%' });
    const grams = h('span', { class: 'macro-grams', dir: 'ltr' });
    field.input.addEventListener('input', () => {
      const n = parseNumber(field.input.value);
      draft = { ...draft, [m.key]: Number.isFinite(n) ? Math.round(n) : 0 };
      refresh();
    });
    return { ...m, field, grams };
  });

  function refresh() {
    const sum = draft.p + draft.c + draft.f;
    const ok = isValidSplit(draft);
    fields.forEach((m) => {
      const g = Math.round((goal * draft[m.key]) / 100 / m.perGram);
      m.grams.textContent = `${fmt(g)} ${t('gramShort')}`;
    });
    totalEl.className = `macro-total${sum === 100 ? ' ok' : ' bad'}`;
    totalEl.textContent = sum === 100 ? `${t('total')}: 100% ✓` : `${t('total')}: ${sum}% · ${t('mustBe100')}`;
    saveBtn.disabled = !ok;
  }

  saveBtn.addEventListener('click', () => {
    if (!isValidSplit(draft)) return;
    app.commit(setProfile(app.state, { macroSplit: { ...draft } }), t('saved'));
  });

  editor.append(
    ...fields.map((m) => h('div', { class: 'macro-edit-row' }, m.field.el, m.grams)),
    totalEl,
    saveBtn);
  editor.hidden = !showCustom;
  refresh();

  const pick = (name) => {
    if (name === 'custom') {
      showCustom = true;
      editor.hidden = false;
      chips.querySelectorAll('.chip-btn').forEach((c) => c.classList.toggle('active', c.dataset.name === 'custom'));
      return;
    }
    app.commit(setProfile(app.state, { macroSplit: name === 'balanced' ? null : { ...MACRO_PRESETS[name] } }), t('saved'));
  };

  const chips = h('div', { class: 'chips wrap' },
    [...Object.keys(MACRO_PRESETS), 'custom'].map((name) => h('button', {
      class: `chip-btn${name === presetName ? ' active' : ''}`, 'data-name': name, onClick: () => pick(name),
    }, t(`split_${name}`), name !== 'custom'
      ? h('small', { dir: 'ltr' }, ` ${MACRO_PRESETS[name].p}/${MACRO_PRESETS[name].c}/${MACRO_PRESETS[name].f}`)
      : '')));

  return h('div', { class: 'field' },
    h('span', { class: 'field-label' }, t('macroSplit')),
    chips,
    editor);
}

/** The user's own calorie number instead of the calculated one. */
function ownGoal(app) {
  const { t } = app.d;
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
  return h('div', { class: 'stack' },
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

export function goalSection(app) {
  const { t, goal, macros } = app.d;
  const split = isValidSplit(app.state.profile.macroSplit) ? app.state.profile.macroSplit : DEFAULT_SPLIT;
  const kcalFrom = (key) => (key === 'f' ? 9 : 4);
  return h('section', { class: 'card stack' },
    h('h2', { class: 'section-title' }, icon('target'), t('dailyGoal')),
    h('div', { class: 'goal-now' }, h('strong', null, fmt(goal)), h('span', null, ` ${t('kcal')}`)),
    h('div', { class: 'macro-chips start' },
      ['p', 'c', 'f'].map((k) => h('span', { class: `chip ${{ p: 'protein', c: 'carbs', f: 'fat' }[k]}` },
        `${t({ p: 'protein', c: 'carbs', f: 'fat' }[k])} ${macros[k]}${t('gramShort')} · ${split[k]}%`))),
    h('p', { class: 'muted small' }, `${t('macroKcal')}: ${fmt(macros.p * kcalFrom('p') + macros.c * kcalFrom('c') + macros.f * kcalFrom('f'))} ${t('kcal')} · ${fmt1(macros.p / Math.max(1, app.state.profile.weightKg))} ${t('gramShort')} ${t('protein')}/${t('kg')}`),
    changeChooser(app),
    macroChooser(app),
    ownGoal(app));
}

