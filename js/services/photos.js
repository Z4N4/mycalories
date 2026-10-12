// The user's own food photos, kept on the phone in IndexedDB (localStorage is
// too small for pictures). All photos are loaded once at start-up so lists can
// show them instantly.

import { isPhotoDataUrl } from '../core/photoData.js';

const DB_NAME = 'mycalories';
const STORE = 'photos';
const OPEN_TIMEOUT_MS = 4000;
const urls = new Map(); // foodId → object URL for <img>
// foodId → data URL text, kept ready so "copy my data" / backup can run
// instantly inside the tap (iPhone only allows clipboard and sharing then).
const dataUrls = new Map();
let pendingConversions = 0;
let dbPromise = null;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('IndexedDB open timed out')), OPEN_TIMEOUT_MS);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => {
      clearTimeout(timer);
      const db = req.result;
      // iOS may drop the connection while the app is in the background.
      db.onclose = () => { dbPromise = null; };
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => { clearTimeout(timer); reject(req.error); };
  }).catch((err) => { dbPromise = null; throw err; });
  return dbPromise;
}

function transaction(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const result = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(result?.result ?? result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Runs a transaction; if the cached connection died, reopens once and retries. */
async function run(mode, fn) {
  try {
    return await transaction(await openDb(), mode, fn);
  } catch {
    dbPromise = null;
    return transaction(await openDb(), mode, fn);
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function remember(foodId, blob) {
  const old = urls.get(foodId);
  if (old) URL.revokeObjectURL(old);
  dataUrls.delete(foodId);
  if (!blob) {
    urls.delete(foodId);
    return;
  }
  const url = URL.createObjectURL(blob);
  urls.set(foodId, url);
  pendingConversions += 1;
  blobToDataUrl(blob)
    // Only keep it if this is still the current photo (it may have changed meanwhile).
    .then((d) => { if (urls.get(foodId) === url) dataUrls.set(foodId, d); })
    .catch(() => {})
    .finally(() => { pendingConversions -= 1; });
}

/** data:image/...;base64,... → Blob, without fetch() (blocked by the page's security policy). */
function dataUrlToBlob(dataUrl) {
  const [head, body] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(head)[1];
  const bytes = Uint8Array.from(atob(body), (ch) => ch.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

/** Load every saved photo into memory. Safe to call when storage is blocked. */
export async function loadPhotos() {
  try {
    await run('readonly', (store) => {
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        if (cursor.value instanceof Blob) remember(String(cursor.key), cursor.value);
        cursor.continue();
      };
      return null;
    });
  } catch {
    /* no IndexedDB (private mode): the app just shows the food icons */
  }
}

/** @returns {string|undefined} URL to show in an <img>, if the user added a photo */
export const photoUrl = (foodId) => urls.get(foodId);
export const hasPhoto = (foodId) => urls.has(foodId);
/** True while photos are still being prepared for copying (a moment after start-up or saving). */
export const photosPending = () => pendingConversions > 0;

export async function savePhoto(foodId, blob) {
  await run('readwrite', (store) => store.put(blob, foodId));
  remember(foodId, blob);
}

export async function deletePhoto(foodId) {
  await run('readwrite', (store) => store.delete(foodId));
  remember(foodId, null);
}

/** Removes every saved photo (used by "Delete all data" and before a restore). */
export async function clearPhotos() {
  [...urls.keys()].forEach((id) => remember(id, null));
  await run('readwrite', (store) => store.clear());
}

/** All photos as {foodId: dataUrl}, for backups and moving data to another app. */
export function exportPhotos() {
  return Object.fromEntries(dataUrls);
}

/** Saves photos from a backup; a broken photo is skipped without stopping the rest. */
export async function importPhotos(map) {
  if (!map || typeof map !== 'object') return 0;
  let count = 0;
  for (const [id, dataUrl] of Object.entries(map)) {
    if (typeof id !== 'string' || id.length > 60 || !isPhotoDataUrl(dataUrl)) continue;
    try {
      await savePhoto(id, dataUrlToBlob(dataUrl));
      count += 1;
    } catch {
      /* skip this one */
    }
  }
  return count;
}
