// App controller: holds the state, saves it, and draws the current screen.

import { loadState, saveState } from './core/persist.js';
import { dailyGoal, macroTargets } from './core/calc.js';
import { todayKey } from './core/dates.js';
import { buildFoods } from './foods/index.js';
import { makeT, isRtl } from './i18n/strings.js';
import { h, replaceChildren, toast } from './ui/dom.js';
import { icon } from './ui/icons.js';
import { renderOnboarding } from './views/onboarding.js';
import { renderToday } from './views/today.js';
import { renderWeek } from './views/week.js';
import { renderMonth } from './views/month.js';
import { renderWeight } from './views/weight.js';
import { renderSettings } from './views/settings.js';

const TABS = [
  { id: 'today', icon: 'today', label: 'tabToday', render: renderToday },
  { id: 'week', icon: 'week', label: 'tabWeek', render: renderWeek },
  { id: 'month', icon: 'month', label: 'tabMonth', render: renderMonth },
  { id: 'weight', icon: 'weight', label: 'tabWeight', render: renderWeight },
  { id: 'settings', icon: 'settings', label: 'tabSettings', render: renderSettings },
];

const storage = (() => {
  try { return window.localStorage; } catch { return null; }
})();

const loaded = storage ? loadState(storage) : { state: null, error: 'storage' };
let state = loaded.state ?? loadState({ getItem: () => null, setItem: () => {} }).state;
let ui = { tab: 'today', date: todayKey(), today: todayKey() };
let cache = { for: null, value: null };

/** Values computed from the state, recomputed only when the state changes. */
function derive() {
  if (cache.for === state) return cache.value;
  const foods = buildFoods(state);
  const lang = state.settings.lang;
  const goal = dailyGoal(state.profile);
  cache = {
    for: state,
    value: {
      foods, foodsById: new Map(foods.map((f) => [f.id, f])),
      lang, t: makeT(lang), goal, macros: macroTargets(goal),
    },
  };
  return cache.value;
}

export const app = {
  get state() { return state; },
  get ui() { return ui; },
  get d() { return derive(); },

  /** Save a new state and redraw. Optional message (and undo) shown as a toast. */
  commit(next, message, undo) {
    state = next;
    if (storage && !saveState(storage, state)) toast(derive().t('saveFailed'));
    render();
    if (message) toast(message, undo);
  },

  go(tab, patch = {}) {
    ui = { ...ui, tab, ...patch };
    render();
    window.scrollTo({ top: 0 });
  },

  setUi(patch) {
    ui = { ...ui, ...patch };
    render();
  },
};

function tabBar(t) {
  return h('nav', { class: 'tabbar' },
    TABS.map((tab) => h('button', {
      class: `tab${ui.tab === tab.id ? ' active' : ''}`,
      'aria-current': ui.tab === tab.id ? 'page' : null,
      onClick: () => app.go(tab.id, tab.id === 'today' ? { date: todayKey() } : {}),
    }, icon(tab.icon), h('span', null, t(tab.label)))));
}

export function render() {
  const { lang, t } = derive();
  document.documentElement.lang = lang === 'ku' ? 'ku-Arab' : lang;
  document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
  const root = document.getElementById('app');
  if (!state.settings.onboarded) {
    replaceChildren(root, renderOnboarding(app));
    return;
  }
  const view = (TABS.find((tab) => tab.id === ui.tab) ?? TABS[0]).render(app);
  replaceChildren(root, h('main', { class: 'main' }, view), tabBar(t));
}

// When the app is reopened on a new day, jump "Today" forward.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const now = todayKey();
  if (now === ui.today) return;
  ui = { ...ui, today: now, date: ui.date === ui.today ? now : ui.date };
  render();
});

render();
if (loaded.error === 'corrupt') toast(derive().t('dataCorrupt'));
if (loaded.error === 'storage') toast(derive().t('storageBlocked'));

navigator.storage?.persist?.().catch(() => {});
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
