// Export / import of all data as a JSON file.

import { toast } from '../ui/dom.js';
import { parseBackup } from '../core/store.js';
import { todayKey } from '../core/dates.js';

export async function exportBackup(app) {
  const name = `mycalories-backup-${todayKey()}.json`;
  const text = JSON.stringify(app.state, null, 1);
  const file = new File([text], name, { type: 'application/json' });
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

export async function importBackup(app, file) {
  const { t } = app.d;
  if (!file) return;
  let restored;
  try {
    restored = parseBackup(await file.text());
  } catch {
    toast(`⚠️ ${t('importFailed')}`);
    return;
  }
  if (!window.confirm(t('importConfirm'))) return;
  app.commit(restored, t('importDone'));
}
