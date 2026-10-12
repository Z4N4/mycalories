// Small picture for a food: the user's own photo if they added one, otherwise
// the food's colour icon.

import { h } from './dom.js';
import { foodEmoji } from '../foods/emoji.js';
import { photoUrl } from '../services/photos.js';

const FALLBACK = { id: '', cat: 'custom' };

/** @param {object|undefined} food @param {'sm'|'md'|'lg'} size */
export function foodThumb(food, size = 'md') {
  const url = food && !food.adhoc ? photoUrl(food.id) : undefined;
  if (url) return h('img', { class: `thumb ${size}`, src: url, alt: '', loading: 'lazy', decoding: 'async' });
  const f = food ?? FALLBACK;
  return h('span', { class: `thumb emoji ${size} cat-${f.cat}`, 'aria-hidden': 'true' }, foodEmoji(f));
}
