// Moving all data (entries, settings, recipes, photos) out of and into the app:
// a backup file, or copy & paste. Copy/paste is how data moves from Safari to
// the Home Screen app, because iPhone gives the two separate storage.

import { h, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { parseBackup, setSettings } from '../core/store.js';
import { todayKey } from '../core/dates.js';
import { splitTransfer } from '../core/photoData.js';
import { exportPhotos, importPhotos, clearPhotos, photosPending } from '../services/photos.js';

/** Everything as one JSON text. Synchronous, so it can run inside a tap. */
export function allDataText(app) {
  return JSON.stringify({ ...app.state, photos: exportPhotos() });
}

export async function exportBackup(app) {
  if (photosPending()) { toast(app.d.t('photosPreparing')); return; }
  const name = `mycalories-backup-${todayKey()}.json`;
  const file = new File([allDataText(app)], name, { type: 'application/json' });
  // On iPhone the share sheet lets you "Save to Files", WhatsApp it to yourself, etc.
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return; // user closed the share sheet
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Replace everything with the data in `text` (backup file or pasted copy).
 * @returns {Promise<boolean>} true when restored
 */
export async function restoreFromText(app, text, { ask = true } = {}) {
  const { t } = app.d;
  let parts;
  let restored;
  try {
    parts = splitTransfer(text.trim());
    restored = parseBackup(parts.data);
  } catch {
    toast(`⚠️ ${t('importFailed')}`);
    return false;
  }
  if (ask && !window.confirm(t('importConfirm'))) return false;
  try {
    // "Replace everything" includes photos: old photos from this phone go first.
    await clearPhotos();
    await importPhotos(parts.photos);
  } catch {
    /* photos are a bonus; the entries still restore */
  }
  app.commit(setSettings(restored, { onboarded: true }), t('importDone'));
  return true;
}

export async function importBackup(app, file) {
  if (!file) return;
  await restoreFromText(app, await file.text());
}

/** Copy all data to the clipboard; shows the text to copy by hand if that's blocked. */
export function copyAllData(app) {
  const { t } = app.d;
  // Photos are still being prepared (just after opening or saving one): try again in a moment.
  if (photosPending()) { toast(t('photosPreparing')); return; }
  const text = allDataText(app);
  const shown = () => toast(t('dataCopied'));
  const manual = () => {
    const box = h('textarea', { class: 'input transfer-box', readonly: true }, text);
    openSheet({ title: t('copyData'), closeLabel: t('close'), body: h('div', { class: 'stack' }, h('p', { class: 'muted small' }, t('copyFallback')), box) });
    setTimeout(() => { box.focus(); box.select(); }, 350);
  };
  if (!navigator.clipboard?.writeText) { manual(); return; }
  navigator.clipboard.writeText(text).then(shown, manual);
}

/** Sheet with every way to bring data in: paste, backup file, or paste by hand. */
export function openRestoreSheet(app, onDone) {
  const { t } = app.d;
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json,text/plain', class: 'hidden' });
  const box = h('textarea', { class: 'input transfer-box', placeholder: t('pasteHere') });
  const finish = (ok) => { if (ok) { sheet.close(); onDone?.(); } };

  const pasteBtn = h('button', {
    class: 'btn primary big',
    onClick: async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text.trim()) { toast(t('nothingToPaste')); return; }
        finish(await restoreFromText(app, text, { ask: app.state.settings.onboarded }));
      } catch {
        toast(t('pasteBlocked'));
        box.focus();
      }
    },
  }, icon('download'), t('pasteData'));

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (file) finish(await restoreFromText(app, await file.text(), { ask: app.state.settings.onboarded }));
  });

  const sheet = openSheet({
    title: t('restoreData'),
    closeLabel: t('close'),
    body: h('div', { class: 'stack' },
      h('p', { class: 'muted small' }, t('restoreHint')),
      navigator.clipboard?.readText ? pasteBtn : '',
      h('button', { class: 'btn', onClick: () => fileInput.click() }, icon('upload'), t('importData')),
      fileInput,
      h('p', { class: 'muted small' }, t('pasteManual')),
      box,
      h('button', {
        class: 'btn',
        onClick: async () => finish(await restoreFromText(app, box.value, { ask: app.state.settings.onboarded })),
      }, icon('check'), t('restoreData'))),
  });
}
