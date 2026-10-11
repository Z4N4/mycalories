// Form for sex, age, height, weight, activity and goal.
// Used by the welcome screens and by Settings.

import { h, parseNumber } from '../ui/dom.js';
import { segmented, choiceList, numberField, fieldError } from '../ui/controls.js';
import { ACTIVITY } from '../core/calc.js';

const LIMITS = {
  age: [10, 120],
  heightCm: [100, 250],
  weightKg: [25, 350],
};

/**
 * @returns {{ el: HTMLElement, read: () => object|null }} read() returns the
 *   new profile values, or null after showing an error.
 */
export function profileForm(t, profile) {
  let choice = { sex: profile.sex, activity: profile.activity, goal: profile.goal };
  const set = (patch) => { choice = { ...choice, ...patch }; };

  const age = numberField({ id: 'pf-age', label: t('age'), value: profile.age, unit: t('years') });
  const height = numberField({ id: 'pf-height', label: t('height'), value: profile.heightCm, unit: t('cm') });
  const weight = numberField({ id: 'pf-weight', label: t('weight'), value: profile.weightKg, unit: t('kg') });
  const errorSlot = h('div');

  const el = h('div', { class: 'stack' },
    h('div', { class: 'field' },
      h('span', { class: 'field-label' }, t('sex')),
      segmented([
        { value: 'male', label: t('male') },
        { value: 'female', label: t('female') },
      ], choice.sex, (sex) => set({ sex }))),
    h('div', { class: 'grid-3' }, age.el, height.el, weight.el),
    errorSlot,
    h('div', { class: 'field' },
      h('span', { class: 'field-label' }, t('activity')),
      choiceList(Object.keys(ACTIVITY).map((value) => ({ value, label: t(`act_${value}`) })),
        choice.activity, (activity) => set({ activity }))),
    h('div', { class: 'field' },
      h('span', { class: 'field-label' }, t('goalType')),
      choiceList([
        { value: 'lose', label: t('goal_lose'), hint: t('goal_lose_hint') },
        { value: 'keep', label: t('goal_keep') },
        { value: 'gain', label: t('goal_gain'), hint: t('goal_gain_hint') },
      ], choice.goal, (goal) => set({ goal }))));

  function read() {
    const values = {
      age: parseNumber(age.input.value),
      heightCm: parseNumber(height.input.value),
      weightKg: parseNumber(weight.input.value),
    };
    const inputs = { age: age.input, heightCm: height.input, weightKg: weight.input };
    const bad = Object.keys(LIMITS).find((k) => {
      const [min, max] = LIMITS[k];
      return !(values[k] >= min && values[k] <= max);
    });
    Object.values(inputs).forEach((input) => input.classList.remove('invalid'));
    if (bad) {
      inputs[bad].classList.add('invalid');
      errorSlot.replaceChildren(fieldError(`${t('errNumber')} (${LIMITS[bad][0]}–${LIMITS[bad][1]})`));
      inputs[bad].focus();
      return null;
    }
    errorSlot.replaceChildren();
    return { ...choice, age: Math.round(values.age), heightCm: values.heightCm, weightKg: values.weightKg };
  }

  return { el, read };
}
