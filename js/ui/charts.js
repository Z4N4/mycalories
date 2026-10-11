// Small SVG charts: calorie ring, weekly bars, weight line.

const NS = 'http://www.w3.org/2000/svg';

function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, String(v));
  children.forEach((c) => el.append(c));
  return el;
}

/** Ring showing eaten / goal. Turns orange when over. */
export function ring(eaten, goal, size = 168) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ratio = goal > 0 ? eaten / goal : 0;
  const shown = Math.min(ratio, 1);
  const over = ratio > 1;
  return s('svg', { viewBox: `0 0 ${size} ${size}`, class: 'ring', width: size, height: size, 'aria-hidden': 'true' },
    s('circle', { cx: size / 2, cy: size / 2, r, class: 'ring-track', 'stroke-width': stroke, fill: 'none' }),
    s('circle', {
      cx: size / 2, cy: size / 2, r,
      class: over ? 'ring-value over' : 'ring-value',
      opacity: shown > 0 ? 1 : 0,
      'stroke-width': stroke, fill: 'none', 'stroke-linecap': 'round',
      'stroke-dasharray': `${circ * shown} ${circ}`,
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
    }));
}

/**
 * Seven bars with a dashed goal line.
 * @param {{label: string, value: number, key: string, today?: boolean}[]} days
 */
export function weekBars(days, goal, onPick) {
  const W = 340; const H = 190; const top = 22; const bottom = 26; const gap = 12;
  const max = Math.max(goal * 1.15, ...days.map((d) => d.value), 1);
  const barW = (W - gap * (days.length + 1)) / days.length;
  const y = (v) => top + (H - top - bottom) * (1 - v / max);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bars', role: 'img' });
  const goalY = y(goal);
  svg.append(s('line', { x1: 4, x2: W - 4, y1: goalY, y2: goalY, class: 'goal-line' }));
  days.forEach((d, i) => {
    const x = gap + i * (barW + gap);
    const by = y(d.value);
    const cls = d.value === 0 ? 'bar empty' : d.value > goal ? 'bar over' : 'bar';
    const g = s('g', { class: 'bar-group', tabindex: 0, role: 'button' });
    g.append(s('rect', { x: x - gap / 2, y: 0, width: barW + gap, height: H, class: 'bar-hit' }));
    g.append(s('rect', { x, y: d.value ? by : H - bottom - 3, width: barW, height: d.value ? H - bottom - by : 3, rx: 6, class: cls }));
    if (d.value) {
      const label = s('text', { x: x + barW / 2, y: by - 6, class: 'bar-value', 'text-anchor': 'middle' });
      label.textContent = new Intl.NumberFormat('en-US').format(d.value);
      g.append(label);
    }
    const day = s('text', { x: x + barW / 2, y: H - 8, class: d.today ? 'bar-day today' : 'bar-day', 'text-anchor': 'middle' });
    day.textContent = d.label;
    g.append(day);
    g.addEventListener('click', () => onPick(d.key));
    svg.append(g);
  });
  return svg;
}

/** Weight over time. points: [{key, kg}] sorted by date. rtl: time runs right → left. */
export function weightLine(points, rtl = false) {
  const W = 340; const H = 170; const pad = 26;
  const values = points.map((p) => p.kg);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const ltrX = (i) => (points.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (points.length - 1));
  const x = (i) => (rtl ? W - ltrX(i) : ltrX(i));
  const y = (v) => pad / 2 + (H - pad * 1.5) * (1 - (v - min) / (max - min));
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'line-chart', role: 'img' });
  [min + 1, (min + max) / 2, max - 1].forEach((v) => {
    svg.append(s('line', { x1: rtl ? 4 : pad, x2: rtl ? W - pad : W - 4, y1: y(v), y2: y(v), class: 'grid' }));
    const t = s('text', { x: rtl ? W - 2 : 2, y: y(v) + 4, class: 'axis', 'text-anchor': rtl ? 'end' : 'start' });
    t.textContent = v.toFixed(0);
    svg.append(t);
  });
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.kg).toFixed(1)}`).join(' ');
  svg.append(s('path', { d, class: 'line' }));
  points.forEach((p, i) => svg.append(s('circle', { cx: x(i), cy: y(p.kg), r: 3.5, class: 'dot' })));
  return svg;
}
