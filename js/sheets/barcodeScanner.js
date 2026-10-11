// Barcode scanner: live camera, typed number, or a photo of the barcode.
// Found products are saved to "My foods" so the next scan works offline.

import { h, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { openSheet } from '../ui/sheet.js';
import { cleanBarcode, isValidBarcode } from '../core/barcode.js';
import { findCustomByBarcode, saveCustomFood } from '../core/store.js';
import { lookupBarcode } from '../services/openFoodFacts.js';
import { shrinkImage } from '../services/image.js';
import { openFoodDetail } from './foodDetail.js';
import { openCustomFood } from './customFood.js';

const SCAN_INTERVAL_MS = 250;
const BARCODE_PHOTO_MAX_SIDE = 2000;
let zxingLoading = null;

/** Loads the barcode library (vendor/zxing.min.js) the first time it's needed. */
function loadZxing() {
  if (globalThis.ZXing) return Promise.resolve(globalThis.ZXing);
  zxingLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = './vendor/zxing.min.js';
    script.onload = () => resolve(globalThis.ZXing);
    script.onerror = () => { zxingLoading = null; reject(new Error('barcode library failed to load')); };
    document.head.append(script);
  });
  return zxingLoading;
}

function makeReader(ZXing) {
  const { BarcodeFormat: F, DecodeHintType: H } = ZXing;
  const hints = new Map([
    [H.POSSIBLE_FORMATS, [F.EAN_13, F.EAN_8, F.UPC_A]],
    [H.TRY_HARDER, true],
  ]);
  return new ZXing.BrowserMultiFormatReader(hints, SCAN_INTERVAL_MS);
}

export function openBarcodeScanner(app, { dateKey, meal, onChange }) {
  const { t, lang } = app.d;
  let reader = null;
  let busy = false;
  let closed = false; // once true, nothing may start the camera or open new screens

  const video = h('video', { class: 'scan-video', playsinline: true, muted: true, autoplay: true });
  video.muted = true; // iPhone only plays inline video without sound when the property is set
  const cameraBox = h('div', { class: 'scan-box' }, video, h('div', { class: 'scan-line' }));
  const status = h('p', { class: 'scan-status' }, t('pointCamera'));
  const codeInput = h('input', {
    class: 'input', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 20,
    placeholder: '5449000000996', 'aria-label': t('typeBarcode'),
  });
  const photoInput = h('input', { type: 'file', accept: 'image/*', class: 'hidden' });

  const setStatus = (text, cls = '') => { status.className = `scan-status ${cls}`.trim(); status.textContent = text; };
  const stopCamera = () => {
    try { reader?.reset(); } catch { /* already stopped */ }
    reader = null;
  };

  function openFood(foodId) {
    sheet.close();
    onChange?.();
    const food = app.d.foodsById.get(foodId);
    if (food) openFoodDetail(app, { food, dateKey, meal, onChange });
  }

  async function startCamera() {
    if (closed) return;
    try {
      const ZXing = await loadZxing();
      if (closed) return;
      const own = makeReader(ZXing);
      reader = own;
      await own.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' } } },
        video,
        (result) => { if (result && !closed) handle(result.getText()); },
      );
      // The sheet may have closed while iOS showed the camera permission prompt.
      if (closed || reader !== own) own.reset();
    } catch {
      if (closed) return;
      cameraBox.classList.add('off');
      setStatus(t('cameraDenied'), 'error');
    }
  }

  async function handle(raw) {
    const code = cleanBarcode(raw);
    if (!isValidBarcode(code)) { setStatus(t('invalidBarcode'), 'error'); return; }
    if (busy || closed) return;
    busy = true;
    stopCamera();
    navigator.vibrate?.(40);
    const saved = findCustomByBarcode(app.state, code);
    if (saved) { openFood(saved.id); return; }
    setStatus(`${t('lookingUp')} ${code}`);
    const result = await lookupBarcode(code, lang);
    if (result.status === 'found') {
      const next = saveCustomFood(app.state, result.food); // saved even if the sheet was closed meanwhile
      app.commit(next, t('productSaved'));
      if (!closed) openFood(next.customFoods[0].id);
      return;
    }
    if (closed) return;
    if (result.status === 'notFound') {
      sheet.close();
      toast(t('productNotFound'));
      openCustomFood(app, null, (food) => {
        onChange?.();
        if (food) openFoodDetail(app, { food, dateKey, meal, onChange });
      }, { barcode: code });
      return;
    }
    busy = false;
    setStatus(t('offline'), 'error');
    if (!cameraBox.classList.contains('off')) startCamera();
  }

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files?.[0];
    photoInput.value = '';
    if (!file || closed) return;
    try {
      const ZXing = await loadZxing();
      const { dataUrl } = await shrinkImage(file, BARCODE_PHOTO_MAX_SIDE);
      const result = await makeReader(ZXing).decodeFromImageUrl(dataUrl);
      handle(result.getText());
    } catch {
      if (closed) return;
      setStatus(t('noBarcodeInPhoto'), 'error');
      if (!busy && !cameraBox.classList.contains('off')) startCamera();
    }
  });

  // Picker closed without a photo: bring the live view back.
  photoInput.addEventListener('cancel', () => {
    if (!busy && !closed && !cameraBox.classList.contains('off')) startCamera();
  });

  // The iPhone photo picker takes over the camera, so pause the live view first.
  const pickPhoto = () => { stopCamera(); photoInput.click(); };
  const submitTyped = () => handle(codeInput.value);
  codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitTyped(); });

  const sheet = openSheet({
    title: t('scanTitle'),
    closeLabel: t('close'),
    tall: true,
    onClose: () => { closed = true; stopCamera(); },
    body: h('div', { class: 'stack' },
      cameraBox,
      status,
      h('div', { class: 'field' },
        h('span', { class: 'field-label' }, t('typeBarcode')),
        h('div', { class: 'inline-form' }, codeInput, h('button', { class: 'btn primary', onClick: submitTyped }, t('find')))),
      h('button', { class: 'btn', onClick: pickPhoto }, icon('camera'), t('photoOfBarcode')),
      photoInput),
  });
  startCamera();
}
