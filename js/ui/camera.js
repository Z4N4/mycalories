// Full-screen in-app camera: live view, big shutter button, gallery button and
// flash (where the phone allows it). Falls back to the photo picker if the
// camera can't start.

import { h } from './dom.js';
import { icon } from './icons.js';

const MAX_SIDE = 1280;
const JPEG_QUALITY = 0.85;

/**
 * @param {object} opts
 * @param {(key: string) => string} opts.t
 * @param {(photo: Blob) => void} opts.onPhoto  called with the captured or chosen image
 */
export function openCamera({ t, onPhoto }) {
  let stream = null;
  let closed = false;
  let torchOn = false;
  let capturing = false; // stops a double tap from sending two photos

  const video = h('video', { class: 'cam-video', playsinline: true, muted: true, autoplay: true });
  video.muted = true;
  const fileInput = h('input', { type: 'file', accept: 'image/*', class: 'hidden' });
  const message = h('div', { class: 'cam-message hidden' });
  const flashBtn = h('button', { class: 'cam-round hidden', 'aria-label': t('flash'), 'aria-pressed': 'false' }, icon('flash'));
  const shutter = h('button', { class: 'cam-shutter', 'aria-label': t('capture'), disabled: true }, h('span'));

  const overlay = h('div', { class: 'cam', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('photoTitle') },
    video,
    h('div', { class: 'cam-frame' }, h('i'), h('i'), h('i'), h('i')),
    h('div', { class: 'cam-top' },
      h('button', { class: 'cam-round', 'aria-label': t('close'), onClick: () => close() }, icon('close')),
      h('span', { class: 'cam-hint' }, t('cameraHint')),
      flashBtn),
    message,
    h('div', { class: 'cam-bottom' },
      h('button', { class: 'cam-round big', 'aria-label': t('gallery'), onClick: () => fileInput.click() }, icon('gallery')),
      shutter,
      h('span', { class: 'cam-spacer' })),
    fileInput);

  function stop() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  function close() {
    if (closed) return;
    closed = true;
    stop();
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisible);
    overlay.classList.remove('open');
    setTimeout(() => overlay.remove(), 200);
    document.body.classList.remove('cam-open');
  }

  function deliver(photo) {
    close();
    onPhoto(photo);
  }

  function capture() {
    const w = video.videoWidth;
    const hgt = video.videoHeight;
    const live = stream?.getVideoTracks()[0]?.readyState === 'live';
    if (capturing || !w || !hgt || !live) return;
    capturing = true;
    shutter.disabled = true;
    const scale = Math.min(1, MAX_SIDE / Math.max(w, hgt));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(hgt * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    overlay.classList.add('flashing');
    canvas.toBlob((blob) => {
      if (blob) { deliver(blob); return; }
      // Could not make the picture: let the user try again.
      capturing = false;
      shutter.disabled = false;
      overlay.classList.remove('flashing');
    }, 'image/jpeg', JPEG_QUALITY);
  }

  async function toggleTorch() {
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    try {
      torchOn = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: torchOn }] });
      flashBtn.classList.toggle('on', torchOn);
      flashBtn.setAttribute('aria-pressed', String(torchOn));
    } catch {
      flashBtn.classList.add('hidden');
    }
  }

  function showFallback() {
    message.replaceChildren(
      h('p', null, t('cameraBlocked')),
      h('button', { class: 'btn primary', onClick: () => fileInput.click() }, icon('gallery'), t('takePhoto')));
    message.classList.remove('hidden');
  }

  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } },
      });
      if (closed) { stop(); return; } // closed while iPhone asked for permission
      video.srcObject = stream;
      await video.play().catch(() => {});
      shutter.disabled = false;
      const track = stream.getVideoTracks()[0];
      // iPhone stops the camera when the app goes to the background; start it again.
      track?.addEventListener('ended', () => {
        if (closed || capturing) return;
        shutter.disabled = true;
        stop();
        start();
      });
      const caps = track?.getCapabilities?.();
      if (caps?.torch) flashBtn.classList.remove('hidden');
    } catch {
      if (!closed) showFallback();
    }
  }

  shutter.addEventListener('click', capture);
  flashBtn.addEventListener('click', toggleTorch);
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (file) deliver(file);
  });
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  // Back from the background with a dead camera (iOS may not fire 'ended'): restart it.
  const onVisible = () => {
    if (document.visibilityState !== 'visible' || closed || capturing) return;
    if (stream && stream.getVideoTracks()[0]?.readyState === 'live') return;
    shutter.disabled = true;
    stop();
    start();
  };
  document.addEventListener('visibilitychange', onVisible);

  document.body.append(overlay);
  document.body.classList.add('cam-open');
  requestAnimationFrame(() => overlay.classList.add('open'));
  if (navigator.mediaDevices?.getUserMedia) start();
  else showFallback();
  return { close };
}
