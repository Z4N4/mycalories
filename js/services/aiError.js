/** AI failure with a code the UI translates, plus the service's own message for details. */
export class AiError extends Error {
  constructor(code, detail = '') {
    super(code);
    this.code = code; // 'noKey' | 'badKey' | 'quota' | 'offline' | 'failed'
    this.detail = detail;
  }
}

/** Removes spaces, line breaks, quotes and invisible marks that sneak in when pasting. */
export function cleanKey(key) {
  return String(key ?? '').replace(/[\s"'`​-‏⁦-⁩]/g, '');
}

/**
 * Loose length check only: there is more than one key format (Groq "gsk_…",
 * old Google "AIza…" keys and newer auth keys), so the real check is a request.
 */
export function isPlausibleKey(key) {
  const clean = cleanKey(key);
  return clean.length >= 20 && clean.length <= 400 && /^[\x21-\x7E]+$/.test(clean);
}

export function readKey(storageKey) {
  try { return localStorage.getItem(storageKey) ?? ''; } catch { return ''; }
}

export function writeKey(storageKey, key) {
  try {
    const clean = cleanKey(key);
    if (clean) localStorage.setItem(storageKey, clean);
    else localStorage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}
