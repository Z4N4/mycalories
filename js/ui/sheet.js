// Bottom sheets (the panels that slide up from the bottom, like iOS).
// Sheets stack: opening one from another keeps the first underneath.

import { h } from './dom.js';
import { icon } from './icons.js';

const stack = [];

/**
 * @param {{ title: string|Node, body: Node, footer?: Node, tall?: boolean, onClose?: () => void, closeLabel: string }} opts
 */
export function openSheet({ title, body, footer, tall = false, onClose, closeLabel }) {
  const titleEl = h('h2', { class: 'sheet-title' }, title);
  const bodyEl = h('div', { class: 'sheet-body' }, body);
  const footerEl = h('div', { class: 'sheet-footer' }, footer);
  const panel = h('div', { class: `sheet${tall ? ' tall' : ''}`, role: 'dialog', 'aria-modal': 'true' },
    h('div', { class: 'sheet-handle' }),
    h('header', { class: 'sheet-header' },
      titleEl,
      h('button', { class: 'icon-btn', 'aria-label': closeLabel, onClick: () => close() }, icon('close'))),
    bodyEl,
    footerEl);
  const backdrop = h('div', { class: 'sheet-backdrop', onClick: (e) => { if (e.target === backdrop) close(); } }, panel);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    const i = stack.indexOf(api);
    if (i >= 0) stack.splice(i, 1);
    backdrop.classList.remove('open');
    setTimeout(() => backdrop.remove(), 260);
    if (!stack.length) document.body.classList.remove('sheet-open');
    onClose?.();
  }

  const api = {
    close,
    panel,
    setTitle: (t) => titleEl.replaceChildren(t),
    setBody: (node) => bodyEl.replaceChildren(node),
    setFooter: (node) => footerEl.replaceChildren(node ?? ''),
  };

  stack.push(api);
  document.body.classList.add('sheet-open');
  document.body.append(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('open'));
  return api;
}

export function closeTopSheet() {
  stack[stack.length - 1]?.close();
}

export function closeAllSheets() {
  [...stack].reverse().forEach((s) => s.close());
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTopSheet();
});
