// Google Gemini (free tier), kept as a second AI option next to Groq.
// Works with old "AIza…" keys and the newer auth keys (both in x-goog-api-key;
// a token-style fallback is remembered if Google asks for it).

import { AiError, cleanKey } from './aiError.js';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
// Only models open to new users (gemini-2.5-flash is closed to them).
const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash'];
const KEY_STORAGE = 'mycalories.geminiKey';
const MODE_STORAGE = 'mycalories.geminiKeyMode';
const TIMEOUT_MS = 25000;
const TEST_TIMEOUT_MS = 15000;

export function getKey() {
  try { return localStorage.getItem(KEY_STORAGE) ?? ''; } catch { return ''; }
}

function getMode() {
  try { return localStorage.getItem(MODE_STORAGE) === 'bearer' ? 'bearer' : 'header'; } catch { return 'header'; }
}

export function setKey(key, mode = 'header') {
  try {
    const clean = cleanKey(key);
    if (clean) {
      localStorage.setItem(KEY_STORAGE, clean);
      localStorage.setItem(MODE_STORAGE, mode);
    } else {
      localStorage.removeItem(KEY_STORAGE);
      localStorage.removeItem(MODE_STORAGE);
    }
    return true;
  } catch {
    return false;
  }
}

const authHeaders = (key, mode) => (mode === 'bearer' ? { Authorization: `Bearer ${key}` } : { 'x-goog-api-key': key });

async function post(model, key, body, timeoutMs = TIMEOUT_MS, mode = getMode()) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(key, mode) },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new AiError(controller.signal.aborted ? 'failed' : 'offline', controller.signal.aborted ? 'The AI took too long.' : '');
  } finally {
    clearTimeout(timer);
  }
}

async function classify(res) {
  const body = await res.json().catch(() => ({}));
  const detail = String(body?.error?.message ?? `HTTP ${res.status}`).slice(0, 300);
  const status = String(body?.error?.status ?? '');
  if (res.status === 429 || status === 'RESOURCE_EXHAUSTED') return new AiError('quota', detail);
  if (res.status === 401 || res.status === 403 || /api key|credential|unauthenticated/i.test(detail)) return new AiError('badKey', detail);
  return new AiError('failed', detail);
}

/**
 * Ask Gemini for JSON, optionally about a photo. The first model's error is the
 * one reported (it's the one that matters), not the last fallback's.
 * @param {{prompt: string, image?: {base64: string, mime: string}}} opts
 * @returns {Promise<string>} the answer text
 */
export async function geminiJson({ prompt, image }) {
  const key = getKey();
  if (!key) throw new AiError('noKey');
  if (!navigator.onLine) throw new AiError('offline');
  const parts = [...(image ? [{ inline_data: { mime_type: image.mime, data: image.base64 } }] : []), { text: prompt }];
  const body = { contents: [{ parts }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } };
  let first = null;
  for (const model of MODELS) {
    const res = await post(model, key, body);
    if (res.ok) {
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    }
    const err = await classify(res);
    if (err.code === 'badKey') throw err;
    first ??= err;
  }
  throw first;
}

/** Checks a key with a tiny real request; returns the way of sending it that works. */
export async function testKey(rawKey) {
  const key = cleanKey(rawKey);
  const body = { contents: [{ parts: [{ text: 'Reply with the word OK.' }] }], generationConfig: { maxOutputTokens: 20 } };
  let first = null;
  for (const mode of ['header', 'bearer']) {
    for (const model of MODELS) {
      let res;
      try {
        res = await post(model, key, body, TEST_TIMEOUT_MS, mode);
      } catch (err) {
        return { status: err.code, detail: err.detail, mode };
      }
      if (res.ok) return { status: 'ok', detail: '', mode };
      const err = await classify(res);
      if (err.code === 'quota') return { status: 'quota', detail: err.detail, mode };
      first ??= { status: err.code, detail: err.detail, mode };
      if (err.code === 'badKey') break;
    }
    if (!(first?.status === 'badKey' && /oauth|access token/i.test(first.detail))) break;
    first = null;
  }
  return first ?? { status: 'failed', detail: '', mode: 'header' };
}
