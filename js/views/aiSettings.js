// Settings card for the AI keys: Groq (recommended, fast and free) and Google
// Gemini (second option). Keys stay only on this phone.

import { h, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { fieldError } from '../ui/controls.js';
import { isPlausibleKey } from '../services/aiError.js';
import { getGroqKey, setGroqKey, testGroqKey } from '../services/groq.js';
import { getKey as getGeminiKey, setKey as setGeminiKey, testKey as testGeminiKey } from '../services/gemini.js';

const PROVIDERS = {
  groq: { page: 'https://console.groq.com/keys', howTo: 'groqHowTo', get: getGroqKey, set: (k) => setGroqKey(k), test: testGroqKey },
  gemini: { page: 'https://aistudio.google.com/apikey', howTo: 'aiHowTo', get: getGeminiKey, set: (k, mode) => setGeminiKey(k, mode), test: testGeminiKey },
};

/** Key box for one provider: paste → checked with the service → saved. */
function keyBox(app, name) {
  const { t } = app.d;
  const p = PROVIDERS[name];
  if (p.get()) {
    return h('div', { class: 'list-row' },
      h('span', { class: 'grow good-text' }, t('aiKeySet')),
      h('button', {
        class: 'btn danger-ghost',
        onClick: () => { p.set(''); app.commit(app.state); toast(t('aiKeyRemoved')); },
      }, t('removeKey')));
  }
  const input = h('input', {
    class: 'input', type: 'password', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    placeholder: t('aiKeyPlaceholder'), 'aria-label': t('aiKey'),
  });
  const errorSlot = h('div');
  const saveBtn = h('button', { class: 'btn primary' }, t('save'));
  // Our message plus the service's own reason, so a problem can be diagnosed.
  const showError = (message, detail) => errorSlot.replaceChildren(
    fieldError(message),
    detail ? h('p', { class: 'muted small detail-text', dir: 'ltr' }, detail) : '');

  saveBtn.addEventListener('click', async () => {
    const key = input.value;
    if (!isPlausibleKey(key)) { showError(t('aiKeyTooShort')); return; }
    saveBtn.disabled = true;
    errorSlot.replaceChildren(h('p', { class: 'muted small' }, t('aiKeyChecking')));
    const { status, detail, mode } = await p.test(key);
    saveBtn.disabled = false;
    if (status === 'offline') { showError(t('offline')); return; }
    if (status === 'badKey') { showError(t('aiKeyInvalid'), detail); return; }
    if (status === 'failed') { showError(t('aiKeyFailed'), detail); return; }
    p.set(key, mode);
    app.commit(app.state, status === 'quota' ? t('aiKeySavedQuota') : t('aiKeySaved'));
  });

  return h('div', { class: 'stack' },
    h('p', { class: 'muted small' }, t(p.howTo)),
    h('a', { class: 'btn', href: p.page, target: '_blank', rel: 'noopener noreferrer' }, icon('key'), t('getKey')),
    h('div', { class: 'inline-form' }, input, saveBtn),
    errorSlot);
}

export function aiSection(app) {
  const { t } = app.d;
  const geminiOpen = Boolean(getGeminiKey()) && !getGroqKey();
  return h('section', { class: 'card stack' },
    h('h2', { class: 'section-title' }, icon('sparkle'), t('aiSection')),
    h('p', { class: 'muted small' }, t('aiUses')),
    h('h3', { class: 'section-title small' }, 'Groq', h('span', { class: 'badge' }, t('recommended'))),
    keyBox(app, 'groq'),
    h('details', { class: 'override', open: geminiOpen },
      h('summary', { class: 'link-btn' }, icon('key'), t('useGemini')),
      keyBox(app, 'gemini')),
    h('p', { class: 'muted small' }, t('aiPrivacy')));
}
