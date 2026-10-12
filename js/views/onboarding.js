// First-run welcome: language → about you → your daily goal.

import { h, fmt } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { LANG_LABELS } from '../i18n/strings.js';
import { setSettings, setProfile, setWeight } from '../core/store.js';
import { dailyGoal, macroTargets } from '../core/calc.js';
import { todayKey } from '../core/dates.js';
import { profileForm } from './profileForm.js';
import { openRestoreSheet } from './backup.js';

function languageStep(app) {
  const { t, lang } = app.d;
  return h('section', { class: 'onboard' },
    h('div', { class: 'onboard-hero' },
      h('img', { class: 'onboard-logo', src: './icons/icon-192.png', alt: '' }),
      h('h1', null, t('welcome')),
      h('p', { class: 'muted' }, t('welcomeText'))),
    h('h2', { class: 'section-title' }, icon('globe'), t('chooseLanguage')),
    h('div', { class: 'lang-list' },
      Object.entries(LANG_LABELS).map(([code, label]) => h('button', {
        class: `lang-btn${code === lang ? ' active' : ''}`,
        lang: code === 'ku' ? 'ku-Arab' : code,
        onClick: () => {
          app.commit(setSettings(app.state, { lang: code }));
          app.setUi({ onboardStep: 1 });
        },
      }, label, h('span', { class: 'choice-check' }, icon('check'))))),
    // Data entered in Safari doesn't reach the Home Screen app by itself.
    h('button', {
      class: 'btn restore-btn',
      onClick: () => openRestoreSheet(app, () => app.go('today', { date: todayKey() })),
    }, icon('upload'), t('alreadyUser')));
}

function profileStep(app) {
  const { t } = app.d;
  const form = profileForm(t, app.state.profile);
  return h('section', { class: 'onboard' },
    h('h1', null, t('aboutYou')),
    h('p', { class: 'muted' }, t('aboutYouHint')),
    form.el,
    h('div', { class: 'onboard-actions' },
      h('button', { class: 'btn ghost', onClick: () => app.setUi({ onboardStep: 0 }) }, t('back')),
      h('button', {
        class: 'btn primary',
        onClick: () => {
          const profile = form.read();
          if (!profile) return;
          app.commit(setProfile(app.state, profile));
          app.setUi({ onboardStep: 2 });
          window.scrollTo({ top: 0 });
        },
      }, t('next'))));
}

function resultStep(app) {
  const { t } = app.d;
  const goal = dailyGoal(app.state.profile);
  const m = macroTargets(goal);
  return h('section', { class: 'onboard' },
    h('h1', null, t('yourResult')),
    h('div', { class: 'card result-card' },
      h('div', { class: 'result-number' }, fmt(goal)),
      h('div', { class: 'result-unit' }, t('kcal')),
      h('div', { class: 'macro-chips' },
        h('span', { class: 'chip protein' }, `${t('protein')} ${m.p}${t('gramShort')}`),
        h('span', { class: 'chip carbs' }, `${t('carbs')} ${m.c}${t('gramShort')}`),
        h('span', { class: 'chip fat' }, `${t('fat')} ${m.f}${t('gramShort')}`))),
    h('p', { class: 'muted center' }, t('resultHint')),
    h('p', { class: 'note' }, icon('info'), t('disclaimer')),
    h('div', { class: 'onboard-actions' },
      h('button', { class: 'btn ghost', onClick: () => app.setUi({ onboardStep: 1 }) }, t('back')),
      h('button', {
        class: 'btn primary',
        onClick: () => {
          const withWeight = setWeight(app.state, todayKey(), app.state.profile.weightKg);
          app.commit(setSettings(withWeight, { onboarded: true }));
          app.go('today', { date: todayKey() });
        },
      }, t('start'))));
}

export function renderOnboarding(app) {
  const step = app.ui.onboardStep ?? 0;
  const steps = [languageStep, profileStep, resultStep];
  return h('div', { class: 'onboard-wrap' },
    h('div', { class: 'dots' }, steps.map((_, i) => h('span', { class: `dot${i === step ? ' active' : ''}` }))),
    steps[step](app));
}
