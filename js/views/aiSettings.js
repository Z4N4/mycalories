// Settings card for the free Gemini key used by "Calories from a photo".

import { h, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { fieldError } from '../ui/controls.js';
import { isPlausibleKey } from '../core/photoAi.js';
import { getKey, setKey, testKey } from '../services/gemini.js';

const KEY_PAGE = 'https://aistudio.google.com/apikey';

export function aiSection(app) {
  const { t } = app.d;
  const hasKey = Boolean(getKey());
  const input = h('input', {
    class: 'input', type: 'password', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    placeholder: 'AIza…', 'aria-label': t('aiKey'),
  });
  const errorSlot = h('div');
  const saveBtn = h('button', { class: 'btn primary' }, t('save'));

  saveBtn.addEventListener('click', async () => {
    const key = input.value.trim();
    if (!isPlausibleKey(key)) {
      errorSlot.replaceChildren(fieldError(t('aiKeyInvalid')));
      return;
    }
    saveBtn.disabled = true;
    const result = await testKey(key);
    saveBtn.disabled = false;
    if (result === 'badKey') {
      errorSlot.replaceChildren(fieldError(t('aiKeyInvalid')));
      return;
    }
    if (result === 'offline') {
      errorSlot.replaceChildren(fieldError(t('offline')));
      return;
    }
    setKey(key);
    app.commit(app.state, t('aiKeySaved'));
  });

  const remove = () => {
    setKey('');
    app.commit(app.state);
    toast(t('aiKeyRemoved'));
  };

  return h('section', { class: 'card stack' },
    h('h2', { class: 'section-title' }, icon('sparkle'), t('aiSection')),
    hasKey
      ? h('div', { class: 'list-row' },
        h('span', { class: 'grow good-text' }, t('aiKeySet')),
        h('button', { class: 'btn danger-ghost', onClick: remove }, t('removeKey')))
      : h('div', { class: 'stack' },
        h('p', { class: 'muted small' }, t('aiHowTo')),
        h('a', { class: 'btn', href: KEY_PAGE, target: '_blank', rel: 'noopener noreferrer' }, icon('key'), t('getKey')),
        h('div', { class: 'inline-form' }, input, saveBtn),
        errorSlot),
    h('p', { class: 'muted small' }, t('aiPrivacy')));
}
