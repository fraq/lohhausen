/**
 * Small, dependency-free SVG primitives used by the Lohhausen interface.
 * The returned strings are intentionally self-contained so the app can run
 * from a local file or the tiny development server without an asset build.
 */

const ICON_PATHS = {
  guide: '<path d="M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1v15"/>',
  overview: '<path d="M4 5.5h16M4 12h16M4 18.5h16"/><circle cx="7" cy="5.5" r="1"/><circle cx="13" cy="12" r="1"/><circle cx="9" cy="18.5" r="1"/>',
  reports: '<path d="M5 3.5h10l4 4v13H5z"/><path d="M15 3.5v4h4M8 12h8M8 16h6"/>',
  decisions: '<path d="M4 19.5h16M6.5 17V9l5.5-4 5.5 4v8"/><path d="M9 17v-4h6v4M4 9l8-5 8 5"/>',
  journal: '<path d="M6 3.5h12v17H6zM9 3.5v17M12 8h3M12 12h3M12 16h3"/>',
  debrief: '<path d="M5 19.5V10M12 19.5V4M19 19.5v-7"/><path d="m4 7 5-3 5 4 6-5"/>',
  model: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2"/><path d="M12 4.5V2.5M12 21.5v-2M4.5 12h-2M21.5 12h-2M6.7 6.7 5.3 5.3M18.7 18.7l-1.4-1.4M17.3 6.7l1.4-1.4M6.7 17.3l-1.4 1.4"/>',
  save: '<path d="M4 4h13l3 3v13H4zM8 4v6h8V4M8 20v-6h8v6"/>',
  reset: '<path d="M5 8a7.5 7.5 0 1 1-1 7"/><path d="M5 4v4h4"/>',
  next: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  coins: '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="15" r="5"/><path d="M9 6.5v5M7.5 8h3M15 12.5v5M13.5 14h3"/>',
  people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 19c.6-3 2.5-4.5 5.5-4.5s4.9 1.5 5.5 4.5M14 15c2.8-.2 4.7 1.1 5.5 4"/>',
  factory: '<path d="M3.5 20V9l6 3V9l6 3V6l5 2.5V20zM3.5 20h17"/><path d="M6.5 16h2M12 16h2M17.5 16h2M7 9V5h3v5"/>',
  home: '<path d="m3.5 11.5 8.5-7 8.5 7V20h-17z"/><path d="M9 20v-5h6v5M4 11.5h16"/>',
  leaf: '<path d="M19.5 4.5C10 4.5 4.5 8.2 4.5 14c0 3 2.2 5.5 5.5 5.5 5.8 0 9.5-5.5 9.5-15z"/><path d="M4.7 19.3c2.5-4.2 5.5-6.9 10-9.4"/>',
  alert: '<path d="m10.3 3.6-8 14A2 2 0 0 0 4 20.5h16a2 2 0 0 0 1.7-2.9l-8-14a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
  shield: '<path d="M12 2.5 4.5 5.8v6.7c0 4.6 3.2 8.9 7.5 9.8 4.3-.9 7.5-5.2 7.5-9.8V5.8L12 2.5z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z"/>',
  loop: '<path d="M21.5 12A9.5 9.5 0 0 1 5 17.5M2.5 12A9.5 9.5 0 0 1 19 6.5"/><path d="m20 2 2 4.5-4.5.5M4 22l-2-4.5 4.5-.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8v.01M12 11v5"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M10 13h4"/>'
};

const xmlEscape = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const finiteValues = (values) => (Array.isArray(values) ? values : [values])
  .map(Number)
  .filter(Number.isFinite);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Return a line icon with a stable, accessible viewBox. */
export function icon(name, size = 20) {
  const content = ICON_PATHS[name] ?? '<circle cx="12" cy="12" r="7.5"/><path d="M12 8v5M12 16v.1"/>';
  const safeSize = Number.isFinite(Number(size)) && Number(size) > 0 ? Number(size) : 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${safeSize}" height="${safeSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;
}

/** A tiny accessible sparkline for metric cards. */
export function sparkline(values, color = '#345944') {
  const nums = finiteValues(values);
  const points = nums.length === 0 ? [0, 0] : nums;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const width = 132;
  const height = 34;
  const pad = 2;
  const path = points.map((value, index) => {
    const x = points.length === 1 ? width / 2 : pad + index * (width - pad * 2) / (points.length - 1);
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
  const safeColor = xmlEscape(color);
  return `<svg class="sparkline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Динамика показателя"><path d="${path}" fill="none" stroke="${safeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle cx="${points.length === 1 ? width / 2 : width - pad}" cy="${points.length === 1 ? height / 2 : (height - pad - ((points.at(-1) - min) / span) * (height - pad * 2)).toFixed(2)}" r="2.5" fill="${safeColor}"/></svg>`;
}

/**
 * Draw a compact, readable chart from history snapshots. Missing and invalid
 * values are ignored; one point and a constant series remain meaningful.
 */
export function trendChart(history, key, options = {}) {
  const { color = '#345944', label = key, unit = '' } = options || {};
  const rows = Array.isArray(history) ? history : [];
  const values = rows.map((row, index) => ({
    month: Number.isFinite(Number(row?.month)) ? Number(row.month) : index,
    value: Number(row?.[key])
  })).filter((row) => Number.isFinite(row.value));
  const width = 640;
  const height = 220;
  const left = 48;
  const right = 18;
  const top = 22;
  const bottom = 34;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const safeValues = values.length ? values : [{ month: 0, value: 0 }];
  const min = Math.min(...safeValues.map((point) => point.value));
  const max = Math.max(...safeValues.map((point) => point.value));
  const span = max - min || Math.max(Math.abs(max) * 0.08, 1);
  const low = min - (max === min ? span / 2 : span * 0.08);
  const high = max + (max === min ? span / 2 : span * 0.08);
  const ySpan = high - low || 1;
  const firstMonth = safeValues[0].month;
  const lastMonth = safeValues.at(-1).month;
  const monthSpan = lastMonth - firstMonth || 1;
  const x = (month) => left + ((month - firstMonth) / monthSpan) * plotW;
  const y = (value) => top + (1 - (value - low) / ySpan) * plotH;
  const line = safeValues.map((point, index) => `${index ? 'L' : 'M'}${x(point.month).toFixed(2)} ${y(point.value).toFixed(2)}`).join(' ');
  const area = `${line} L ${x(lastMonth).toFixed(2)} ${(top + plotH).toFixed(2)} L ${x(firstMonth).toFixed(2)} ${(top + plotH).toFixed(2)} Z`;
  const ticks = [0, 0.5, 1].map((ratio) => {
    const tickValue = high - ratio * ySpan;
    const yy = top + ratio * plotH;
    return `<line x1="${left}" y1="${yy.toFixed(2)}" x2="${width - right}" y2="${yy.toFixed(2)}" stroke="#d9d6cb" stroke-dasharray="3 5"/><text x="${left - 8}" y="${(yy + 4).toFixed(2)}" text-anchor="end">${xmlEscape(Math.round(tickValue))}</text>`;
  }).join('');
  const xLabels = safeValues.length === 1
    ? `<text x="${left}" y="${height - 10}">${firstMonth === 0 ? 'начало управления' : `месяц ${xmlEscape(firstMonth)}`}</text><text x="${width - right}" y="${height - 10}" text-anchor="end">текущий</text>`
    : `<text x="${left}" y="${height - 10}">${firstMonth === 0 ? 'начало управления' : `месяц ${xmlEscape(firstMonth)}`}</text><text x="${width - right}" y="${height - 10}" text-anchor="end">месяц ${xmlEscape(lastMonth)} · текущий</text>`;
  const safeColor = xmlEscape(color);
  const safeLabel = xmlEscape(label);
  const safeUnit = xmlEscape(unit);
  return `<svg class="trend-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${safeLabel}${safeUnit ? `, ${safeUnit}` : ''}"><g class="chart-grid">${ticks}</g><path d="${area}" fill="${safeColor}" fill-opacity=".12"/><path d="${line}" fill="none" stroke="${safeColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(lastMonth).toFixed(2)}" cy="${y(safeValues.at(-1).value).toFixed(2)}" r="4" fill="${safeColor}"/>${xLabels}<text x="${left}" y="14" class="chart-label">${safeLabel}${safeUnit ? ` · ${safeUnit}` : ''}</text></svg>`;
}

/** An original, code-native town illustration for the dashboard hero. */
export function cityIllustration() {
  return `<svg class="city-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 360" role="group" aria-label="Схема Лоххаузена: фабрика, ратуша, жилой квартал и школа" preserveAspectRatio="xMidYMid meet">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe8df"/><stop offset="1" stop-color="#f7f0df"/></linearGradient><linearGradient id="river" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a6c9c2"/><stop offset="1" stop-color="#75a8a2"/></linearGradient><pattern id="roadDots" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 6h12" stroke="#d0ad78" stroke-width="1" stroke-dasharray="2 4"/></pattern></defs>
  <rect width="780" height="360" rx="18" fill="url(#sky)"/><path d="M0 126Q96 78 195 121t193 0 198-5 194 26v81H0z" fill="#a9bda4"/><path d="M0 164q100-38 190 0t190 0 200-2 200 14v90H0z" fill="#8daa88" opacity=".75"/><path d="M0 278q95-28 188-3t197-8 205-1 190 11v83H0z" fill="url(#river)" opacity=".92"/><path d="M0 288q94-28 188-4t197-8 205-1 190 11" fill="none" stroke="#e7f0dd" stroke-width="3" opacity=".72"/>
  <path d="M30 245C160 208 246 252 355 224s219-26 395 5" fill="none" stroke="#dbc39b" stroke-width="26" stroke-linecap="round"/><path d="M30 245C160 208 246 252 355 224s219-26 395 5" fill="none" stroke="url(#roadDots)" stroke-width="22" stroke-linecap="round"/>
  <g data-district="tourism" role="button" tabindex="0" aria-label="Туристическая набережная, открыть отчет"><path d="M613 271h100M623 271v-19M644 271v-19M665 271v-19M686 271v-19" stroke="#fffdf7" stroke-width="5"/><path d="M605 278q58-16 116 0" fill="none" stroke="#bc9150" stroke-width="3"/><text x="662" y="299" text-anchor="middle" fill="#f5f2e9" font-size="10" font-family="system-ui, sans-serif" font-weight="700" letter-spacing="1">ТУРИЗМ</text></g>
  <g fill="#537956" opacity=".95"><path d="M68 182q-14-25 0-45 14 20 0 45Z"/><path d="M76 181q17-34 34-34-3 29-34 34Z"/><path d="M690 181q-14-25 0-45 14 20 0 45Z"/><path d="M698 181q17-34 34-34-3 29-34 34Z"/><path d="M123 220q-13-24 0-39 13 18 0 39Z"/><path d="M132 218q14-28 29-28-4 25-29 28Z"/></g>
  <g data-district="factory" role="button" tabindex="0" aria-label="Фабрика, открыть отчет"><path d="M54 205v-54l38 19v-19l38 19v-32l45 23v44z" fill="#b65e47"/><path d="M62 205h113" stroke="#273a31" stroke-width="3"/><path d="M84 171h16v34H84zM119 179h16v26h-16zM150 184h12v21h-12z" fill="#f5f2e9"/><path d="M143 142V91h20l7 14v37" fill="#7e5946"/><path d="M150 88q10-11 21 0" fill="none" stroke="#b65e47" stroke-width="6" stroke-linecap="round"/><text x="109" y="231" text-anchor="middle" fill="#273a31" font-size="11" font-family="system-ui, sans-serif" font-weight="700" letter-spacing="1">ФАБРИКА</text></g>
  <g data-district="social" role="button" tabindex="0" aria-label="Ратуша, открыть отчет"><path d="m291 136 51-42 51 42v70h-102z" fill="#fdf9ed" stroke="#273a31" stroke-width="3"/><path d="M282 137h120l-9-15H291z" fill="#b65e47" stroke="#273a31" stroke-width="2"/><path d="M304 137v69M322 137v69M340 137v69M358 137v69M376 137v69" stroke="#bc9150" stroke-width="4"/><path d="M302 206h80" stroke="#273a31" stroke-width="4"/><path d="M325 122V58h34v64" fill="#fdf9ed" stroke="#273a31" stroke-width="3"/><path d="M321 60h42l-5-8h-32z" fill="#b65e47"/><circle cx="342" cy="87" r="10" fill="#fffdf7" stroke="#bc9150" stroke-width="3"/><path d="M342 87v-6M342 87l5 3" stroke="#273a31" stroke-width="2"/><text x="342" y="231" text-anchor="middle" fill="#273a31" font-size="11" font-family="system-ui, sans-serif" font-weight="700" letter-spacing="1">РАТУША</text></g>
  <g data-district="housing" role="button" tabindex="0" aria-label="Жилой квартал, открыть отчет"><g fill="#fffdf7" stroke="#273a31" stroke-width="2"><path d="m491 173 25-21 25 21v32h-50z"/><path d="m539 161 30-25 30 25v44h-60z"/><path d="m591 177 24-19 24 19v28h-48z"/></g><g fill="#b65e47"><path d="m486 174 30-27 30 27h-11l-19-17-19 17z"/><path d="m533 162 36-31 36 31h-12l-24-20-24 20z"/><path d="m586 178 29-25 29 25h-11l-18-16-18 16z"/></g><g fill="#bc9150"><path d="M502 184h9v10h-9zM535 178h9v10h-9zM557 178h9v10h-9zM601 184h9v10h-9z"/></g><text x="555" y="231" text-anchor="middle" fill="#273a31" font-size="11" font-family="system-ui, sans-serif" font-weight="700" letter-spacing="1">ЖИЛОЙ КВАРТАЛ</text></g>
  <g data-district="social" role="button" tabindex="0" aria-label="Школа, открыть отчет"><path d="m213 185 31-24 31 24v21h-62z" fill="#fdf9ed" stroke="#273a31" stroke-width="3"/><path d="m207 185 37-29 37 29h-11l-26-20-26 20z" fill="#b65e47"/><path d="M224 190h40M244 174v32" stroke="#bc9150" stroke-width="3"/><text x="244" y="231" text-anchor="middle" fill="#273a31" font-size="11" font-family="system-ui, sans-serif" font-weight="700" letter-spacing="1">ШКОЛА</text></g>
  <g fill="#537956"><circle cx="198" cy="145" r="13"/><circle cx="184" cy="151" r="11"/><path d="M191 153v39M204 153v39" stroke="#6b533d" stroke-width="5"/><circle cx="441" cy="137" r="15"/><circle cx="457" cy="145" r="11"/><path d="M447 148v42" stroke="#6b533d" stroke-width="5"/><circle cx="649" cy="131" r="14"/><path d="M649 144v47" stroke="#6b533d" stroke-width="5"/></g>
  <g fill="#f5f2e9" stroke="#273a31" stroke-width="2"><path d="M380 248h76v28h-76z"/><path d="M385 248v-10h66v10"/><path d="M394 238v-10h10v10M414 238v-10h10v10M434 238v-10h10v10"/></g><path d="M362 275h111" stroke="#273a31" stroke-width="4"/><text x="417" y="302" text-anchor="middle" fill="#f5f2e9" font-size="10" font-family="system-ui, sans-serif" letter-spacing="1">ЛОХХАУЗЕН</text></svg>`;
}

/**
 * Render an interactive or static SVG diagram of a systemic causal loop.
 */
export function renderCausalLoopDiagram(loop) {
  const width = 720;
  const height = 280;

  if (!loop || !Array.isArray(loop.nodes) || loop.nodes.length === 0) {
    return `<svg class="causal-loop-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Пустой контур"><rect width="${width}" height="${height}" rx="12" fill="#faf8f2" stroke="#ebe5d6" stroke-width="1"/><text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#888" font-size="14">Контур не выбран</text></svg>`;
  }

  const isReinforcing = loop.loopType === 'reinforcing' || loop.type === 'reinforcing' || loop.id === 'debt_spiral' || (loop.typeLabel && loop.typeLabel.includes('Усиливающий'));
  const hasDelay = Boolean(loop.delayNodeIndex >= 0 || loop.hasDelay || loop.id === 'housing_lag_loop' || (loop.nodes && loop.nodes.some(n => /жиль|лаг|delay/i.test(n))));
  const typeBadgeText = isReinforcing ? '🔄 Усиливающий контур (R)' : '⚖️ Балансирующий контур (B)';
  const centerSymbol = isReinforcing ? 'R' : 'B';
  const strokeColor = isReinforcing ? '#8d4130' : '#345944';

  const cx = 360;
  const cy = 140;
  const rx = 245;
  const ry = 80;
  const nodes = loop.nodes;
  const count = nodes.length;

  const nodeCoords = nodes.map((node, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const x = Math.round(cx + rx * Math.cos(angle));
    const y = Math.round(cy + ry * Math.sin(angle));
    return { node, x, y };
  });

  const arrowPaths = nodeCoords.map((pt, i) => {
    const next = nodeCoords[(i + 1) % count];
    const midX = (pt.x + next.x) / 2;
    const midY = (pt.y + next.y) / 2;
    const pull = 0.22;
    const ctrlX = midX + (cx - midX) * pull;
    const ctrlY = midY + (cy - midY) * pull;

    const isDelayEdge = (loop.delayNodeIndex === i) || (pt.node && /жиль|лаг|строит/i.test(pt.node));
    const delayBadge = isDelayEdge ? `<g transform="translate(${ctrlX.toFixed(1)}, ${ctrlY.toFixed(1)})"><rect x="-28" y="-11" width="56" height="22" rx="11" fill="#fff8ea" stroke="#d4a340" stroke-width="1.5"/><text x="0" y="4" text-anchor="middle" font-size="11" fill="#8a6110">⏳ лаг</text></g>` : '';

    return `
      <path d="M ${pt.x} ${pt.y} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${next.x} ${next.y}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="${isDelayEdge ? '4 3' : 'none'}" marker-end="url(#causal-arrow)" opacity="0.85"/>
      ${delayBadge}
    `;
  }).join('');

  const nodeElements = nodeCoords.map((pt, i) => {
    const safeNode = xmlEscape(pt.node);
    const boxW = Math.min(180, Math.max(100, safeNode.length * 7.5 + 24));
    const boxH = 34;
    const isDelayNode = (loop.delayNodeIndex === i) || (hasDelay && /жиль/i.test(pt.node));
    const delayLabel = isDelayNode ? `<text x="${pt.x}" y="${pt.y + 27}" text-anchor="middle" font-size="11" fill="#b65e47" font-weight="600">⏳ лаг 12 мес.</text>` : '';

    return `
      <g class="causal-node">
        <rect x="${(pt.x - boxW / 2).toFixed(1)}" y="${(pt.y - boxH / 2).toFixed(1)}" width="${boxW}" height="${boxH}" rx="6" fill="#ffffff" stroke="#273a31" stroke-width="1.8" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"/>
        <text x="${pt.x}" y="${pt.y + 5}" text-anchor="middle" font-size="12" font-family="system-ui, sans-serif" font-weight="600" fill="#273a31">${safeNode}</text>
        ${delayLabel}
      </g>
    `;
  }).join('');

  return `<svg class="causal-loop-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xmlEscape(loop.title || 'Контур системной динамики')}">
    <defs>
      <marker id="causal-arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="${strokeColor}"/>
      </marker>
    </defs>
    <rect width="${width}" height="${height}" rx="12" fill="#faf8f2" stroke="#e3dfd3" stroke-width="1.5"/>
    <g class="causal-edges">${arrowPaths}</g>
    <g class="causal-center-badge">
      <circle cx="${cx}" cy="${cy}" r="34" fill="#ffffff" stroke="${strokeColor}" stroke-width="2.5" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.08))"/>
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="18">${isReinforcing ? '🔄' : '⚖️'}</text>
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="${strokeColor}">${centerSymbol}</text>
      <text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="${strokeColor}">${isReinforcing ? 'Усиливающий' : 'Балансирующий'}</text>
    </g>
    <text x="24" y="30" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#273a31">${xmlEscape(loop.title || '')}</text>
    <text x="24" y="48" font-family="system-ui, sans-serif" font-size="11" fill="#666">${typeBadgeText} ${hasDelay ? '· ⏳ Временной лаг (delay)' : ''}</text>
    <g class="causal-nodes">
      ${nodeElements}
    </g>
  </svg>`;
}



/**
 * Render a comparative SVG chart showing the player's trajectory alongside
 * Conrad (systemic master benchmark) and Marcus (crisis/reactive benchmark).
 */
export function renderBenchmarkComparisonChart({
  playerHistory = [],
  conradTrajectory = [],
  marcusTrajectory = [],
  previousTrajectory = [],
  metricLabel = 'Показатель',
  unit = '',
  horizon = 120,
} = {}) {
  const width = 720;
  const height = 260;
  const left = 55;
  const right = 25;
  const top = 62;
  const bottom = 35;
  const plotW = width - left - right;
  const plotH = height - top - bottom;

  const playerPoints = Array.isArray(playerHistory) ? playerHistory.map((pt, i) => ({
    month: Number.isFinite(Number(pt?.month)) ? Number(pt.month) : i,
    value: Number(pt?.value ?? pt),
  })).filter(pt => Number.isFinite(pt.value)) : [];

  const conradPoints = Array.isArray(conradTrajectory) ? conradTrajectory.map((val, i) => ({
    month: Math.round((i / Math.max(1, conradTrajectory.length - 1)) * horizon),
    value: Number(val),
  })).filter(pt => Number.isFinite(pt.value)) : [];

  const marcusPoints = Array.isArray(marcusTrajectory) ? marcusTrajectory.map((val, i) => ({
    month: Math.round((i / Math.max(1, marcusTrajectory.length - 1)) * horizon),
    value: Number(val),
  })).filter(pt => Number.isFinite(pt.value)) : [];

  const previousPoints = Array.isArray(previousTrajectory) ? previousTrajectory.map((pt, i) => ({
    month: Number.isFinite(Number(pt?.month)) ? Number(pt.month) : Math.round((i / Math.max(1, previousTrajectory.length - 1)) * horizon),
    value: Number(pt?.value ?? pt),
  })).filter(pt => Number.isFinite(pt.value)) : [];

  const allValues = [
    ...playerPoints.map(p => p.value),
    ...conradPoints.map(p => p.value),
    ...marcusPoints.map(p => p.value),
    ...previousPoints.map(p => p.value),
  ];

  const minVal = allValues.length ? Math.min(...allValues) : 0;
  const maxVal = allValues.length ? Math.max(...allValues) : 100;
  const span = maxVal - minVal || 10;
  const low = Math.max(0, minVal - span * 0.1);
  const high = maxVal + span * 0.1;
  const ySpan = high - low || 1;

  const x = (m) => left + (Math.max(0, Math.min(horizon, m)) / horizon) * plotW;
  const y = (v) => top + (1 - (v - low) / ySpan) * plotH;

  const toLinePath = (pts) => pts.length === 0 ? '' : pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${x(pt.month).toFixed(1)} ${y(pt.value).toFixed(1)}`).join(' ');

  const playerPath = toLinePath(playerPoints);
  const conradPath = toLinePath(conradPoints);
  const marcusPath = toLinePath(marcusPoints);
  const previousPath = toLinePath(previousPoints);

  const gridTicks = [0, 0.5, 1].map(r => {
    const val = high - r * ySpan;
    const yy = top + r * plotH;
    return `<line x1="${left}" y1="${yy.toFixed(1)}" x2="${width - right}" y2="${yy.toFixed(1)}" stroke="#e6e1d5" stroke-dasharray="3 4"/><text x="${left - 8}" y="${(yy + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#7d786d">${Math.round(val)}</text>`;
  }).join('');

  return `<svg class="benchmark-comparison-chart" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Сравнение с эталонами Дёрнера: ${xmlEscape(metricLabel)}">
    <rect width="${width}" height="${height}" rx="12" fill="#faf8f2" stroke="#e8e3d5" stroke-width="1"/>
    <g class="chart-grid">${gridTicks}</g>
    
    <!-- Conrad (Master) Trajectory -->
    ${conradPath ? `<path d="${conradPath}" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-dasharray="5 3" opacity="0.85"/>` : ''}
    
    <!-- Marcus (Reactive) Trajectory -->
    ${marcusPath ? `<path d="${marcusPath}" fill="none" stroke="#c62828" stroke-width="2.5" stroke-dasharray="3 3" opacity="0.85"/>` : ''}

    <!-- Previous Attempt Trajectory -->
    ${previousPath ? `<path d="${previousPath}" fill="none" stroke="#6b5b95" stroke-width="2.2" stroke-dasharray="3 3" opacity="0.85"/>` : ''}
    
    <!-- Player Trajectory -->
    ${playerPath ? `<path d="${playerPath}" fill="none" stroke="#1f4e38" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    ${playerPoints.length ? `<circle cx="${x(playerPoints.at(-1).month).toFixed(1)}" cy="${y(playerPoints.at(-1).value).toFixed(1)}" r="4.5" fill="#1f4e38"/>` : ''}

    <!-- Axis Labels -->
    <text x="${left}" y="${height - 12}" font-size="11" fill="#7d786d">Начало управления</text>
    <text x="${width - right}" y="${height - 12}" text-anchor="end" font-size="11" fill="#7d786d">Месяц ${horizon}</text>

    <!-- Legend -->
    <g class="chart-legend" transform="translate(${left}, 44)">
      <text x="0" y="-22" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#273a31">${xmlEscape(metricLabel)}${unit ? ` (${xmlEscape(unit)})` : ''}</text>
      ${previousPath ? `
        <g transform="translate(0, -4)">
          <line x1="0" y1="0" x2="16" y2="0" stroke="#1f4e38" stroke-width="3"/>
          <text x="20" y="4" font-size="10.5" font-weight="600" fill="#1f4e38">Игрок (Вы)</text>
        </g>
        <g transform="translate(160, -4)">
          <line x1="0" y1="0" x2="16" y2="0" stroke="#6b5b95" stroke-width="2.2" stroke-dasharray="3 3"/>
          <text x="20" y="4" font-size="10.5" font-weight="600" fill="#6b5b95">↩ Прошлая</text>
        </g>
        <g transform="translate(320, -4)">
          <line x1="0" y1="0" x2="16" y2="0" stroke="#2e7d32" stroke-width="2" stroke-dasharray="4 2"/>
          <text x="20" y="4" font-size="10.5" font-weight="600" fill="#2e7d32">🌟 Конрад</text>
        </g>
        <g transform="translate(480, -4)">
          <line x1="0" y1="0" x2="16" y2="0" stroke="#c62828" stroke-width="2" stroke-dasharray="3 3"/>
          <text x="20" y="4" font-size="10.5" font-weight="600" fill="#c62828">⚠️ Маркус</text>
        </g>
      ` : `
        <g transform="translate(0, -4)">
          <line x1="0" y1="0" x2="20" y2="0" stroke="#1f4e38" stroke-width="3"/>
          <text x="26" y="4" font-size="11" font-weight="600" fill="#1f4e38">Игрок (Вы)</text>
        </g>
        <g transform="translate(215, -4)">
          <line x1="0" y1="0" x2="20" y2="0" stroke="#2e7d32" stroke-width="2.5" stroke-dasharray="4 2"/>
          <text x="26" y="4" font-size="11" font-weight="600" fill="#2e7d32">🌟 Конрад (Эталон)</text>
        </g>
        <g transform="translate(430, -4)">
          <line x1="0" y1="0" x2="20" y2="0" stroke="#c62828" stroke-width="2.5" stroke-dasharray="3 3"/>
          <text x="26" y="4" font-size="11" font-weight="600" fill="#c62828">⚠️ Маркус (Ловушка)</text>
        </g>
      `}
    </g>
  </svg>`;
}
/**
 * Render a five‑axis systemic health radar (spider) chart.
 * Axes: Production, Fiscal Health, Housing, Services/Health, Satisfaction.
 * Scales and the red 40/100 reference ring are illustrative, not crisis thresholds.
 */
export function hasRadarBaseline(game) {
  const start = game.history?.[0];
  return game.history?.length > 1 && start?.month === 0 &&
    ['production', 'treasury', 'debt', 'housingShortage', 'serviceQuality', 'satisfaction'].every(key => Number.isFinite(start[key]));
}

export function renderSystemicRadarChart(game, options = {}) {
  const width = options.width || 280;
  const height = options.height || 280;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 38; // margin for labels

  const labels = options.labels || {};
  const axes = [
    { key: 'production', label: labels.production || 'Производство' },
    { key: 'fiscal', label: labels.fiscal || 'Финансы' },
    { key: 'housing', label: labels.housing || 'Жильё' },
    { key: 'services', label: labels.services || 'Службы' },
    { key: 'satisfaction', label: labels.satisfaction || 'Удовлетворённость' },
  ];

  const values = {
    production: clamp(Math.round((game.production / 1000) * 100), 0, 100),
    fiscal: clamp(Math.round(50 + ((game.treasury - game.debt) / 2400) * 50), 0, 100),
    housing: clamp(Math.round(100 - (game.housingShortage / 250) * 60), 0, 100),
    services: clamp(Math.round(game.serviceQuality), 0, 100),
    satisfaction: clamp(Math.round(game.satisfaction), 0, 100),
  };

  const angleStep = (2 * Math.PI) / axes.length;
  const points = axes.map((axis, i) => {
    const r = (values[axis.key] / 100) * radius;
    const x = cx + r * Math.sin(i * angleStep);
    const y = cy - r * Math.cos(i * angleStep);
    return { x, y, value: values[axis.key], label: axis.label };
  });

  const baselineState = options.showBaseline !== false && hasRadarBaseline(game) ? game.history[0] : null;
  let baselineMarkup = '';
  if (baselineState) {
    const baseValues = {
      production: clamp(Math.round((baselineState.production / 1000) * 100), 0, 100),
      fiscal: clamp(Math.round(50 + ((baselineState.treasury - baselineState.debt) / 2400) * 50), 0, 100),
      housing: clamp(Math.round(100 - (baselineState.housingShortage / 250) * 60), 0, 100),
      services: clamp(Math.round(baselineState.serviceQuality), 0, 100),
      satisfaction: clamp(Math.round(baselineState.satisfaction), 0, 100),
    };
    const basePoints = axes.map((axis, i) => {
      const r = (baseValues[axis.key] / 100) * radius;
      const x = cx + r * Math.sin(i * angleStep);
      const y = cy - r * Math.cos(i * angleStep);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    baselineMarkup = `<polygon points="${basePoints}" fill="none" stroke="#7d786d" stroke-width="1.8" stroke-dasharray="3 3" opacity="0.75"/>`;
  }

  const grid = [20, 40, 60, 80, 100]
    .map(p => {
      const r = (p / 100) * radius;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e6e1d5" stroke-dasharray="2 4"/>`;
    })
    .join('\n');

  const criticalRing = `<circle cx="${cx}" cy="${cy}" r="${(40 / 100) * radius}" fill="none" stroke="#c62828" stroke-width="2" stroke-dasharray="4 2"/>`;

  const axesMarkup = axes.map((axis, i) => {
    const x = cx + radius * Math.sin(i * angleStep);
    const y = cy - radius * Math.cos(i * angleStep);
    const labelDist = radius + 18;
    const side = Math.sin(i * angleStep);
    const anchor = side < -0.8 ? 'start' : side > 0.8 ? 'end' : 'middle';
    const labelX = side < -0.8 ? 10 : side > 0.8 ? width - 10 : cx + labelDist * side;
    const labelY = cy - labelDist * Math.cos(i * angleStep) + 4;
    return `
      <line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#cfc9be" stroke-width="1"/>
      <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="${anchor}" font-size="11" font-weight="600" fill="#273a31">${xmlEscape(axis.label)}</text>`;
  }).join('\n');

  const polygonPoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const polygon = `<polygon points="${polygonPoints}" fill="rgba(46,125,50,0.25)" stroke="#2e7d32" stroke-width="2.5" stroke-linejoin="round"/>`;
  const dots = points.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#1f4e38"/>`).join('');

  return `
    <svg class="systemic-radar" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Системный радар здоровья города">
      <rect width="${width}" height="${height}" rx="12" fill="#faf8f2" stroke="#e3dfd3" stroke-width="1.5"/>
      <g class="radar-grid">${grid}</g>
      ${criticalRing}
      ${baselineMarkup}
      <g class="radar-axes">${axesMarkup}</g>
      ${polygon}
      <g class="radar-dots">${dots}</g>
    </svg>`;
}
