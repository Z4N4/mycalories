// Photo area at the top of a food: shows the user's photo (or the food icon)
// with buttons to add, change or remove their own photo.

import { h, toast } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { foodThumb } from '../ui/foodThumb.js';
import { openCamera } from '../ui/camera.js';
import { photoToBlob } from '../services/image.js';
import { savePhoto, deletePhoto, hasPhoto } from '../services/photos.js';

/** @param {() => void} onChanged lets lists behind the sheet redraw */
export function photoPanel(app, food, onChanged) {
  const { t } = app.d;
  const el = h('div', { class: 'photo-panel' });

  async function store(photo) {
    try {
      await savePhoto(food.id, await photoToBlob(photo));
      toast(t('photoSaved'));
    } catch {
      toast(`⚠️ ${t('photoFailed')}`);
    }
    render();
    onChanged();
  }

  async function remove() {
    try { await deletePhoto(food.id); } catch { /* already gone */ }
    render();
    onChanged();
  }

  function render() {
    const mine = hasPhoto(food.id);
    el.replaceChildren(
      h('button', { class: 'photo-hero', 'aria-label': t(mine ? 'changePhoto' : 'addPhoto'), onClick: () => openCamera({ t, onPhoto: store }) },
        foodThumb(food, 'lg'),
        h('span', { class: 'photo-hero-badge' }, icon('camera'))),
      h('div', { class: 'photo-actions' },
        h('button', { class: 'link-btn', onClick: () => openCamera({ t, onPhoto: store }) }, icon('camera'), t(mine ? 'changePhoto' : 'addPhoto')),
        mine && h('button', { class: 'link-btn danger', onClick: remove }, icon('trash'), t('removePhoto'))));
  }

  render();
  return el;
}
