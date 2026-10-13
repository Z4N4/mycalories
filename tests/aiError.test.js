import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlausibleKey, cleanKey } from '../js/services/aiError.js';

test('isPlausibleKey accepts Groq and both Google key formats', () => {
  assert.equal(isPlausibleKey('gsk_' + 'x'.repeat(52)), true);
  assert.equal(isPlausibleKey('AIzaSyA1234567890abcdefghijklmnopqrstu'), true);
  assert.equal(isPlausibleKey('AQ.Ab8RN6Lx_example-auth.key/with+chars=1234567890'), true);
  assert.equal(isPlausibleKey('short'), false);
  assert.equal(isPlausibleKey('كلمة عربية طويلة جداً جداً جداً'), false);
});

test('cleanKey strips spaces, line breaks, quotes and invisible marks from a paste', () => {
  assert.equal(cleanKey(' "AIza Sy\nA123" \u200b'), 'AIzaSyA123');
});
