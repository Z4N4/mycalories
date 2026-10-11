import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadState, saveState, STORAGE_KEY } from '../js/core/persist.js';
import { createInitialState, addEntry, setSettings } from '../js/core/store.js';

function fakeStorage({ failSet = false, failGet = false } = {}) {
  const data = new Map();
  return {
    data,
    getItem: (k) => { if (failGet) throw new Error('blocked'); return data.has(k) ? data.get(k) : null; },
    setItem: (k, v) => { if (failSet) throw new Error('full'); data.set(k, v); },
  };
}

const entry = { foodId: 'dolma', meal: 'lunch', unit: 'plate', qty: 1, grams: 350, kcal: 560, p: 15, c: 70, f: 24 };

test('first launch gives a fresh, not-onboarded state', () => {
  const { state, error } = loadState(fakeStorage());
  assert.equal(error, undefined);
  assert.equal(state.settings.onboarded, false);
});

test('saved state loads back with entries and onboarding flag', () => {
  const storage = fakeStorage();
  const s = setSettings(addEntry(createInitialState(), '2026-10-12', entry), { onboarded: true, lang: 'en' });
  assert.equal(saveState(storage, s), true);
  const { state } = loadState(storage);
  assert.equal(state.settings.onboarded, true);
  assert.equal(state.settings.lang, 'en');
  assert.equal(state.log['2026-10-12'][0].kcal, 560);
});

test('corrupt data is kept aside and the app starts fresh', () => {
  const storage = fakeStorage();
  storage.setItem(STORAGE_KEY, '{broken');
  const { state, error } = loadState(storage);
  assert.equal(error, 'corrupt');
  assert.equal(state.settings.onboarded, false);
  assert.ok([...storage.data.keys()].some((k) => k.startsWith(`${STORAGE_KEY}.corrupt-`)));
});

test('storage errors are reported, never thrown', () => {
  assert.equal(loadState(fakeStorage({ failGet: true })).error, 'storage');
  assert.equal(saveState(fakeStorage({ failSet: true }), createInitialState()), false);
});
