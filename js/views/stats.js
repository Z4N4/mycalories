// Stats tab: week and month views behind one switch.

import { h } from '../ui/dom.js';
import { segmented } from '../ui/controls.js';
import { renderWeek } from './week.js';
import { renderMonth } from './month.js';

export function renderStats(app) {
  const { t } = app.d;
  const mode = app.ui.statsMode ?? 'week';
  return h('div', { class: 'page' },
    segmented([
      { value: 'week', label: t('week') },
      { value: 'month', label: t('month') },
    ], mode, (value) => app.setUi({ statsMode: value }), 'stats-switch'),
    mode === 'week' ? renderWeek(app) : renderMonth(app));
}
