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
import { renderPlan } from './views/plan.js';
import { renderStats } from './views/stats.js';
import { renderWeight } from './views/weight.js';
import { renderSettings } from './views/settings.js';
import { loadPhotos } from './services/photos.js';

const TABS = [
  { id: 'today', icon: 'today', label: 'tabToday', render: renderToday },
  { id: 'plan', icon: 'plan', label: 'tabPlan', render: renderPlan },
  { id: 'stats', icon: 'stats', label: 'tabStats', render: renderStats },
  { id: 'weight', icon: 'weight', label: 'tabWeight', render: renderWeight },
  { id: 'settings', icon: 'settings', label: 'tabSettings', render: renderSettings },
];

const storage = (() => {
  try { return window.localStorage; } catch { return null; }
})();

const loaded = storage ? loadState(storage) : { state: null, error: 'storage' };
let state = loaded.state ?? loadState({ getItem: () => null, setItem: () => {} }).state;
// Where the user was (tab, day, scroll), so reopening the app continues there.
const UI_KEY = 'mycalories.ui';
const TAB_IDS = ['today', 'plan', 'stats', 'weight', 'settings'];

function loadUi() {
  const fresh = { tab: 'today', date: todayKey(), today: todayKey() };
  try {
    const saved = JSON.parse(storage?.getItem(UI_KEY) ?? 'null');
    if (!saved || !TAB_IDS.includes(saved.tab)) return fresh;
    const sameDay = saved.savedOn === todayKey();
    return {
      ...fresh,
      tab: saved.tab,
      statsMode: saved.statsMode === 'month' ? 'month' : 'week',
      // A day picked yesterday shouldn't stick; on a new day start from today.
      ...(sameDay && typeof saved.date === 'string' ? { date: saved.date } : {}),
      ...(sameDay && typeof saved.planDate === 'string' ? { planDate: saved.planDate } : {}),
      scrollY: sameDay && Number.isFinite(saved.scrollY) ? saved.scrollY : 0,
    };
  } catch {
    return fresh;
  }
}

function saveUi() {
  try {
    storage?.setItem(UI_KEY, JSON.stringify({
      tab: ui.tab, statsMode: ui.statsMode, date: ui.date, planDate: ui.planDate,
      scrollY: Math.round(window.scrollY), savedOn: todayKey(),
    }));
  } catch { /* storage full or blocked: not important */ }
}

let ui = loadUi();
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
      lang, t: makeT(lang), goal, macros: macroTargets(goal, state.profile.macroSplit),
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
    saveUi();
  },

  setUi(patch) {
    ui = { ...ui, ...patch };
    render();
    saveUi();
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
  if (document.visibilityState !== 'visible') { saveUi(); return; }
  const now = todayKey();
  if (now === ui.today) return;
  ui = { ...ui, today: now, date: ui.date === ui.today ? now : ui.date };
  render();
});

window.addEventListener('pagehide', saveUi);

// Photos live in IndexedDB; wait for them briefly so the first screen shows them.
const photosLoading = loadPhotos();
const photosInTime = await Promise.race([photosLoading.then(() => true), new Promise((resolve) => { setTimeout(() => resolve(false), 1500); })]);
if (!photosInTime) photosLoading.then(render);
render();
if (ui.scrollY) requestAnimationFrame(() => window.scrollTo({ top: ui.scrollY }));
if (loaded.error === 'corrupt') toast(derive().t('dataCorrupt'));
if (loaded.error === 'storage') toast(derive().t('storageBlocked'));

navigator.storage?.persist?.().catch(() => {});
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
