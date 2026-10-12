// Food-photo analysis with Google Gemini (free tier). The user's own API key is
// kept only on this phone, in its own storage slot (never in backups or the code).
// Works with both old "standard" keys (AIza…) and the newer "auth" keys that
// Google AI Studio creates since May 2026; both go in the x-goog-api-key header.

import { buildPrompt, parseAiResult, RESPONSE_SCHEMA, cleanKey } from '../core/photoAi.js';
import { BUILT_IN } from '../foods/index.js';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
// Newest first; the next one is tried if a model is missing or busy.
const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];
const KEY_STORAGE = 'mycalories.geminiKey';
// 'header' = x-goog-api-key (what Google documents); 'bearer' = fallback for keys
// that Google only accepts as an Authorization token.
const MODE_STORAGE = 'mycalories.geminiKeyMode';
const TIMEOUT_MS = 45000;
const TEST_TIMEOUT_MS = 20000;

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

/** Error with a code the UI translates, plus Google's own message for details. */
export class AiError extends Error {
  constructor(code, detail = '') {
    super(code);
    this.code = code; // 'noKey' | 'badKey' | 'quota' | 'offline' | 'failed'
    this.detail = detail;
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
    // A slow model is not the same as having no internet.
    throw new AiError(controller.signal.aborted ? 'failed' : 'offline');
  } finally {
    clearTimeout(timer);
  }
}

function photoBody(image, withSchema) {
  return {
    contents: [{
      parts: [
        { inline_data: { mime_type: image.mime, data: image.base64 } },
        { text: buildPrompt(BUILT_IN) },
      ],
    }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      ...(withSchema ? { responseJsonSchema: RESPONSE_SCHEMA } : {}),
    },
  };
}

/** Sort a failed response into something the app can act on, keeping Google's message. */
async function classify(res) {
  const body = await res.json().catch(() => ({}));
  const detail = String(body?.error?.message ?? `HTTP ${res.status}`).slice(0, 300);
  const status = String(body?.error?.status ?? '');
  let code = 'failed';
  if (res.status === 429 || status === 'RESOURCE_EXHAUSTED') code = 'quota';
  else if (/api key|api_key|unauthenticated|credential/i.test(detail) || res.status === 401) code = 'badKey';
  else if (res.status === 403) code = 'badKey';
  else if (res.status === 404 || res.status >= 500) code = 'tryNextModel';
  else if (res.status === 400 && /schema|json/i.test(detail)) code = 'noSchema';
  return { code, detail };
}

/**
 * @param {{base64: string, mime: string}} image
 * @param {Map<string, object>} foodsById
 */
export async function analyzePhoto(image, foodsById) {
  const key = getKey();
  if (!key) throw new AiError('noKey');
  if (!navigator.onLine) throw new AiError('offline');
  let last = { code: 'failed', detail: '' };
  for (const model of MODELS) {
    let withSchema = true;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const res = await post(model, key, photoBody(image, withSchema));
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        try {
          return parseAiResult(text, foodsById);
        } catch {
          throw new AiError('failed', 'The answer could not be read.');
        }
      }
      const result = await classify(res);
      if (result.code === 'noSchema' && withSchema) { withSchema = false; continue; }
      if (result.code === 'badKey') throw new AiError('badKey', result.detail);
      last = { code: result.code === 'quota' ? 'quota' : 'failed', detail: result.detail };
      break; // try the next model
    }
  }
  throw new AiError(last.code, last.detail);
}

/**
 * Checks a key with a tiny real request (the same kind the photo feature makes).
 * Tries the documented header first; if Google says it expected a token, tries
 * that once. The working way is returned so it can be saved with the key.
 * @returns {Promise<{status: 'ok'|'quota'|'badKey'|'offline'|'failed', detail: string, mode: string}>}
 */
export async function testKey(rawKey) {
  const key = cleanKey(rawKey);
  const body = { contents: [{ parts: [{ text: 'Reply with the word OK.' }] }], generationConfig: { maxOutputTokens: 20 } };
  let last = { status: 'failed', detail: '', mode: 'header' };
  for (const mode of ['header', 'bearer']) {
    for (const model of MODELS) {
      let res;
      try {
        res = await post(model, key, body, TEST_TIMEOUT_MS, mode);
      } catch (err) {
        return { status: err.code === 'offline' ? 'offline' : 'failed', detail: '', mode };
      }
      if (res.ok) return { status: 'ok', detail: '', mode };
      const { code, detail } = await classify(res);
      if (code === 'quota') return { status: 'quota', detail, mode }; // the key itself is fine
      if (code === 'badKey') { last = { status: 'badKey', detail, mode }; break; }
      last = { status: 'failed', detail, mode };
    }
    // Only try the token form when Google explicitly asked for a token.
    if (last.status !== 'badKey' || !/oauth|access token/i.test(last.detail)) break;
  }
  return last;
}
