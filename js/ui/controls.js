// Reusable form controls.

import { h } from './dom.js';
import { icon } from './icons.js';

/**
 * Row of buttons where exactly one is selected.
 * @param {{value: string, label: string}[]} options
 */
export function segmented(options, value, onChange, className = '') {
  let current = value;
  const buttons = options.map((opt) => h('button', {
    type: 'button',
    class: `seg-btn${opt.value === current ? ' active' : ''}`,
    'aria-pressed': String(opt.value === current),
    onClick: () => {
      current = opt.value;
      buttons.forEach((b, i) => {
        const on = options[i].value === current;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      onChange(opt.value);
    },
  }, opt.label));
  return h('div', { class: `segmented ${className}`.trim(), role: 'group' }, buttons);
}

/**
 * Vertical list of choices with a title and optional hint.
 * @param {{value: string, label: string, hint?: string}[]} options
 */
export function choiceList(options, value, onChange) {
  let current = value;
  const items = options.map((opt) => h('button', {
    type: 'button',
    class: `choice${opt.value === current ? ' active' : ''}`,
    onClick: () => {
      current = opt.value;
      items.forEach((el, i) => el.classList.toggle('active', options[i].value === current));
      onChange(opt.value);
    },
  },
  h('span', { class: 'choice-text' },
    h('span', { class: 'choice-label' }, opt.label),
    opt.hint && h('span', { class: 'choice-hint' }, opt.hint)),
  h('span', { class: 'choice-check' }, icon('check'))));
  return h('div', { class: 'choices' }, items);
}

/** Labeled number input. Uses a decimal keypad on iPhone. */
export function numberField({ label, value, unit, placeholder, id }) {
  const input = h('input', {
    id, class: 'input', type: 'text', inputmode: 'decimal', autocomplete: 'off',
    value: value == null ? '' : String(value), placeholder: placeholder ?? '',
  });
  const el = h('label', { class: 'field', for: id },
    h('span', { class: 'field-label' }, label),
    h('span', { class: 'input-wrap' }, input, unit && h('span', { class: 'input-unit' }, unit)));
  return { el, input };
}

export function textField({ label, value, placeholder, id, maxlength = 80 }) {
  const input = h('input', {
    id, class: 'input', type: 'text', autocomplete: 'off', maxlength, value: value ?? '', placeholder: placeholder ?? '',
  });
  const el = h('label', { class: 'field', for: id }, h('span', { class: 'field-label' }, label), input);
  return { el, input };
}

export function fieldError(text) {
  return h('p', { class: 'field-error', role: 'alert' }, text);
}
