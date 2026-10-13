// Groq (free plan): fast AI for photos (Qwen vision) and text (GPT-OSS).
// The user's key stays only on this phone.

import { AiError, cleanKey, readKey, writeKey } from './aiError.js';

const API = 'https://api.groq.com/openai/v1';
const KEY_STORAGE = 'mycalories.groqKey';
export const VISION_MODEL = 'qwen/qwen3.8-27b';
export const TEXT_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const TIMEOUT_MS = 30000;

export const getGroqKey = () => readKey(KEY_STORAGE);
export const setGroqKey = (key) => writeKey(KEY_STORAGE, key);

async function request(path, key, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${API}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new AiError(controller.signal.aborted ? 'failed' : 'offline', controller.signal.aborted ? 'The AI took too long.' : '');
  } finally {
    clearTimeout(timer);
  }
}

async function errorFrom(res) {
  const body = await res.json().catch(() => ({}));
  const detail = String(body?.error?.message ?? `HTTP ${res.status}`).slice(0, 300);
  if (res.status === 401 || res.status === 403) return new AiError('badKey', detail);
  if (res.status === 429) return new AiError('quota', detail);
  return new AiError('failed', detail);
}

/**
 * One chat request that should answer with JSON text.
 * Extra options (JSON mode, no long "thinking") are tried first; if the model
 * rejects them, the request is repeated without them.
 * @param {{model: string, messages: object[], reasoning?: object}} opts
 */
export async function groqChat({ model, messages, reasoning = {} }) {
  const key = getGroqKey();
  if (!key) throw new AiError('noKey');
  if (!navigator.onLine) throw new AiError('offline');
  const base = { model, messages, temperature: 0.2, max_completion_tokens: 1500 };
  const attempts = [{ ...base, ...reasoning, response_format: { type: 'json_object' } }, base];
  let last = null;
  for (const body of attempts) {
    const res = await request('/chat/completions', key, body);
    if (res.ok) {
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? '';
    }
    last = await errorFrom(res);
    if (res.status !== 400) break; // only "bad request" is worth retrying without extras
  }
  throw last;
}

/** Checks a key by listing models (no tokens used). */
export async function testGroqKey(rawKey) {
  try {
    const res = await request('/models', cleanKey(rawKey));
    if (res.ok) return { status: 'ok', detail: '' };
    const err = await errorFrom(res);
    return { status: err.code === 'badKey' ? 'badKey' : err.code, detail: err.detail };
  } catch (err) {
    return { status: err.code ?? 'failed', detail: err.detail ?? '' };
  }
}
