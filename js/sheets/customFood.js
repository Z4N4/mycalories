// Create or edit one of "My foods". Values are entered for one serving.

import { h, fmt1, parseNumber } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { numberField, textField, fieldError } from '../ui/controls.js';
import { saveCustomFood, deleteCustomFood } from '../core/store.js';
import { deletePhoto } from '../services/photos.js';

const MAX_KCAL = 5000;
const MAX_MACRO = 500;
const MAX_GRAMS = 3000;

/**
 * @param {object|null} existing stored custom food, or null to create one
 * @param {(food?: object) => void} [onDone] gets the saved food (as shown in lists)
 * @param {{barcode?: string}} [prefill] e.g. a scanned barcode that wasn't found online
 */
export function openCustomFood(app, existing, onDone, prefill = {}) {
  const { t } = app.d;
  const barcode = existing?.barcode || prefill.barcode || '';
  const optional = `(${t('optional')})`;
  const val = (v) => (v == null || v === 0 ? '' : fmt1(v));
  const name = textField({ id: 'cf-name', label: t('foodName'), value: existing?.name });
  const servingName = textField({ id: 'cf-sname', label: `${t('servingName')} ${optional}`, value: existing?.servingName, maxlength: 30 });
  const servingG = numberField({ id: 'cf-sg', label: `${t('servingGrams')} ${optional}`, value: val(existing?.servingG), unit: t('gramShort') });
  const kcal = numberField({ id: 'cf-kcal', label: t('kcal'), value: existing ? fmt1(existing.kcal) : '' });
  const p = numberField({ id: 'cf-p', label: t('protein'), value: val(existing?.p), unit: t('gramShort'), placeholder: '0' });
  const c = numberField({ id: 'cf-c', label: t('carbs'), value: val(existing?.c), unit: t('gramShort'), placeholder: '0' });
  const f = numberField({ id: 'cf-f', label: t('fat'), value: val(existing?.f), unit: t('gramShort'), placeholder: '0' });
  const errorSlot = h('div');

  const num = (field, max, { required = false } = {}) => {
    const text = field.input.value.trim();
    if (!text && !required) return 0;
    const n = parseNumber(text);
    return n >= 0 && n <= max ? n : NaN;
  };

  function fail(field, message) {
    errorSlot.replaceChildren(fieldError(message));
    field.input.focus();
  }

  function save() {
    const food = {
      ...(existing ?? {}),
      name: name.input.value.trim(),
      barcode,
      servingName: servingName.input.value.trim(),
      servingG: num(servingG, MAX_GRAMS),
      kcal: num(kcal, MAX_KCAL, { required: true }),
      p: num(p, MAX_MACRO), c: num(c, MAX_MACRO), f: num(f, MAX_MACRO),
    };
    if (!food.name) return fail(name, t('errName'));
    const checks = [[servingG, food.servingG], [kcal, food.kcal], [p, food.p], [c, food.c], [f, food.f]];
    const bad = checks.find(([, v]) => Number.isNaN(v));
    if (bad) return fail(bad[0], t('errNumber'));
    const next = saveCustomFood(app.state, food);
    const savedId = existing?.id ?? next.customFoods[0].id;
    app.commit(next, t('saved'));
    sheet.close();
    onDone?.(app.d.foodsById.get(savedId));
    return undefined;
  }

  function remove() {
    if (!window.confirm(t('deleteFoodConfirm'))) return;
    deletePhoto(existing.id).catch(() => {});
    app.commit(deleteCustomFood(app.state, existing.id), t('deleted'));
    sheet.close();
    onDone?.();
  }

  const sheet = openSheet({
    title: existing ? existing.name : t('createFood'),
    closeLabel: t('close'),
    body: h('div', { class: 'stack' },
      barcode && h('p', { class: 'muted small' }, icon('barcode'), ` ${t('barcode')}: `, h('bdi', { dir: 'ltr' }, barcode)),
      name.el,
      h('div', { class: 'grid-2' }, servingName.el, servingG.el),
      h('h3', { class: 'section-title small' }, t('perServing')),
      h('div', { class: 'grid-2' }, kcal.el, p.el, c.el, f.el),
      errorSlot),
    footer: h('div', { class: 'footer-row' },
      existing && h('button', { class: 'btn danger-ghost', onClick: remove }, icon('trash'), t('delete')),
      h('button', { class: 'btn primary grow', onClick: save }, t('save'))),
  });
  setTimeout(() => { if (!existing) name.input.focus(); }, 300);
}
