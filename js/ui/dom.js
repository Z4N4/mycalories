// Tiny DOM builder. Text always goes in as text nodes, so food names typed by
// the user can never inject HTML.

const append = (el, children) => {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
};

/**
 * @param {string} tag
 * @param {Record<string, any>|null} [props]
 * @param {...any} children
 * @returns {HTMLElement}
 */
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'value' || key === 'checked') el[key] = value;
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  append(el, children);
  return el;
}

export function replaceChildren(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Whole number with Western digits and thousands separators. */
export const fmt = (n) => numberFormat.format(Math.round(n || 0));

/** Up to one decimal, no trailing ".0". */
export const fmt1 = (n) => String(Math.round((n || 0) * 10) / 10);

const LTR_ISOLATE = '⁦';
const POP_ISOLATE = '⁩';

/**
 * Quantities like 0.5 / 1.5 shown as ½ / 1½. Mixed numbers are wrapped in a
 * left-to-right isolate so "1½" doesn't turn into "½1" inside Badini/Arabic text.
 */
export function fmtQty(q) {
  const whole = Math.floor(q);
  const frac = Math.round((q - whole) * 100) / 100;
  const symbol = { 0.25: '¼', 0.5: '½', 0.75: '¾' }[frac];
  if (!symbol) return fmt1(q);
  return whole ? `${LTR_ISOLATE}${whole}${symbol}${POP_ISOLATE}` : symbol;
}

/** Parse a number typed by the user, accepting Arabic digits and comma decimals. */
export function parseNumber(text) {
  const western = String(text ?? '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[٫,]/g, '.')
    .trim();
  if (!/^\d*\.?\d+$|^\d+\.$/.test(western)) return NaN;
  return Number(western);
}

let toastTimer;
/** Short message above the tab bar, with an optional action button (e.g. Undo). */
export function toast(message, action) {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);
  const el = h('div', { class: 'toast', role: 'status' },
    h('span', null, message),
    action && h('button', {
      class: 'toast-action',
      onClick: () => { el.remove(); action.run(); },
    }, action.label));
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('show'));
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, action ? 5000 : 2200);
}
