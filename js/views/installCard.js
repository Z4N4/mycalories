// Card shown when the app runs in a normal Safari tab: how to install it, and
// how to take the data along (Safari and the Home Screen app don't share storage).

import { h } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { copyAllData } from './backup.js';

const HIDE_KEY = 'mycalories.installCardHidden';

/** True when opened from the Home Screen (not in a Safari tab). */
export function isStandalone() {
  return navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

const isHidden = () => { try { return localStorage.getItem(HIDE_KEY) === '1'; } catch { return false; } };

export function installCard(app) {
  if (isStandalone() || isHidden()) return '';
  const { t } = app.d;
  const card = h('section', { class: 'card install-card' },
    h('div', { class: 'install-head' },
      h('span', { class: 'install-icon' }, '📲'),
      h('h3', { class: 'grow' }, t('installTitle')),
      h('button', {
        class: 'icon-btn small', 'aria-label': t('hide'),
        onClick: () => { try { localStorage.setItem(HIDE_KEY, '1'); } catch { /* ignore */ } card.remove(); },
      }, icon('close'))),
    h('ol', { class: 'install-steps' },
      h('li', null, t('installStep1')),
      h('li', null, t('installStep2')),
      h('li', null, t('installStep3'))),
    h('button', { class: 'btn primary', onClick: () => copyAllData(app) }, icon('copy'), t('copyData')));
  return card;
}
