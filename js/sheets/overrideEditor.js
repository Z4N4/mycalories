// Fold-out panel to change a built-in food's calories / macros (per 100 g),
// for when your family's recipe is richer or lighter than the average.

import { h, fmt1, parseNumber } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { numberField, fieldError } from '../ui/controls.js';
import { setOverride, clearOverride } from '../core/store.js';
import { BUILT_IN } from '../foods/index.js';

const MAX_PER_100 = { kcal: 900, p: 100, c: 100, f: 100 };

export function overrideEditor(app, food, onSaved) {
  const { t } = app.d;
  const original = BUILT_IN.find((f) => f.id === food.id)?.per100;
  const fields = {
    kcal: numberField({ id: 'ov-kcal', label: t('kcal'), value: fmt1(food.per100.kcal) }),
    p: numberField({ id: 'ov-p', label: t('protein'), value: fmt1(food.per100.p), unit: t('gramShort') }),
    c: numberField({ id: 'ov-c', label: t('carbs'), value: fmt1(food.per100.c), unit: t('gramShort') }),
    f: numberField({ id: 'ov-f', label: t('fat'), value: fmt1(food.per100.f), unit: t('gramShort') }),
  };
  const errorSlot = h('div');

  function save() {
    const values = Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, parseNumber(f.input.value)]));
    const bad = Object.keys(values).find((k) => !(values[k] >= 0 && values[k] <= MAX_PER_100[k]));
    if (bad) {
      errorSlot.replaceChildren(fieldError(t('errNumber')));
      fields[bad].input.focus();
      return;
    }
    errorSlot.replaceChildren();
    app.commit(setOverride(app.state, food.id, values), t('saved'));
    done();
  }

  function reset() {
    app.commit(clearOverride(app.state, food.id), t('saved'));
    Object.entries(fields).forEach(([k, f]) => { f.input.value = fmt1(original[k]); });
    done();
  }

  const actions = h('div', { class: 'footer-row' });
  function renderActions() {
    actions.replaceChildren(
      app.state.overrides[food.id] ? h('button', { class: 'btn ghost', onClick: reset }, t('resetValues')) : '',
      h('button', { class: 'btn primary', onClick: save }, t('save')),
    );
  }

  function done() {
    panel.open = false;
    renderActions();
    onSaved();
  }

  const panel = h('details', { class: 'override' },
    h('summary', { class: 'link-btn' }, icon('edit'), t('editValues')),
    h('div', { class: 'stack' },
      h('p', { class: 'muted small' }, t('per100')),
      h('div', { class: 'grid-2' }, Object.values(fields).map((f) => f.el)),
      errorSlot,
      actions));
  renderActions();
  return panel;
}
