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
    placeholder: t('aiKeyPlaceholder'), 'aria-label': t('aiKey'),
  });
  const errorSlot = h('div');
  const saveBtn = h('button', { class: 'btn primary' }, t('save'));

  // Shows our message plus Google's own reason, so a problem can be diagnosed.
  const showError = (message, detail) => errorSlot.replaceChildren(
    fieldError(message),
    detail ? h('p', { class: 'muted small detail-text', dir: 'ltr' }, `Google: ${detail}`) : '',
  );

  saveBtn.addEventListener('click', async () => {
    const key = input.value;
    if (!isPlausibleKey(key)) {
      showError(t('aiKeyTooShort'));
      return;
    }
    saveBtn.disabled = true;
    errorSlot.replaceChildren(h('p', { class: 'muted small' }, t('aiKeyChecking')));
    const { status, detail, mode } = await testKey(key);
    saveBtn.disabled = false;
    if (status === 'offline') { showError(t('offline')); return; }
    if (status === 'badKey') { showError(t('aiKeyInvalid'), detail); return; }
    if (status === 'failed') { showError(t('aiKeyFailed'), detail); return; }
    setKey(key, mode);
    app.commit(app.state, status === 'quota' ? t('aiKeySavedQuota') : t('aiKeySaved'));
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
