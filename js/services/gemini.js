// Food-photo analysis with Google Gemini (free tier). The user's own API key is
// kept only on this phone, in its own storage slot (never in backups or the code).

import { buildPrompt, parseAiResult, RESPONSE_SCHEMA } from '../core/photoAi.js';
import { BUILT_IN } from '../foods/index.js';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
// Newest first; the next one is tried if a model is missing or busy.
const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];
const KEY_STORAGE = 'mycalories.geminiKey';
const TIMEOUT_MS = 45000;

export function getKey() {
  try { return localStorage.getItem(KEY_STORAGE) ?? ''; } catch { return ''; }
}

export function setKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
    return true;
  } catch {
    return false;
  }
}

/** Error with a code the UI turns into a translated message. */
export class AiError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // 'noKey' | 'badKey' | 'quota' | 'offline' | 'failed'
  }
}

async function post(model, key, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${API}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
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

function requestBody(image, withSchema) {
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

async function errorCode(res) {
  const body = await res.json().catch(() => ({}));
  const msg = String(body?.error?.message ?? '');
  if (res.status === 429) return 'quota';
  if (res.status === 403 || /api key/i.test(msg)) return 'badKey';
  if (res.status === 404 || res.status === 503 || res.status === 500) return 'tryNextModel';
  if (res.status === 400) return /schema|json/i.test(msg) ? 'noSchema' : 'failed';
  return 'failed';
}

/**
 * @param {{base64: string, mime: string}} image
 * @param {Map<string, object>} foodsById
 */
export async function analyzePhoto(image, foodsById) {
  const key = getKey();
  if (!key) throw new AiError('noKey');
  if (!navigator.onLine) throw new AiError('offline');
  let lastError = 'failed';
  for (const model of MODELS) {
    let withSchema = true;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const res = await post(model, key, requestBody(image, withSchema));
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        try {
          return parseAiResult(text, foodsById);
        } catch {
          throw new AiError('failed');
        }
      }
      const code = await errorCode(res);
      if (code === 'noSchema' && withSchema) { withSchema = false; continue; }
      if (code === 'badKey') throw new AiError('badKey');
      lastError = code === 'tryNextModel' || code === 'noSchema' ? 'failed' : code;
      break; // try the next model
    }
  }
  throw new AiError(lastError);
}

/** Cheap check that a key works (lists one model). */
export async function testKey(key) {
  try {
    const res = await fetch(`${API}?pageSize=1`, { headers: { 'x-goog-api-key': key.trim() } });
    return res.ok ? 'ok' : (res.status === 429 ? 'quota' : 'badKey');
  } catch {
    return 'offline';
  }
}
