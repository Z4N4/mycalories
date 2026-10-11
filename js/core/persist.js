// Saving to and loading from the phone's storage (localStorage).

import { createInitialState, parseBackup } from './store.js';

export const STORAGE_KEY = 'mycalories.v1';

/**
 * @param {Storage} storage
 * @returns {{ state: object, error?: 'storage'|'corrupt' }}
 */
export function loadState(storage) {
  let text;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: createInitialState(), error: 'storage' };
  }
  if (!text) return { state: createInitialState() };
  try {
    const restored = parseBackup(text);
    const onboarded = JSON.parse(text)?.settings?.onboarded === true;
    return { state: { ...restored, settings: { ...restored.settings, onboarded } } };
  } catch {
    // Keep the unreadable copy so nothing is lost for good, then start fresh.
    try { storage.setItem(`${STORAGE_KEY}.corrupt-${Date.now()}`, text); } catch { /* storage full */ }
    return { state: createInitialState(), error: 'corrupt' };
  }
}

/** @returns {boolean} false if the phone refused to save (e.g. storage full). */
export function saveState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
