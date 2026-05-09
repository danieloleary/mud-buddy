function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function stat(label, value, testid, primary = false) {
  return el('article', { class: primary ? 'browser-stat primary-stat' : 'browser-stat', 'data-testid': testid || '' }, [
    el('strong', { text: value }),
    el('span', { text: label })
  ]);
}

function renderTimeline(analysis) {
  const width = 900;
  const height = 300;
  const pad = 44;
  const rows = analysis.rows;
  const max = Math.max(240, ...rows.map((row) => row.gpd), ...rows.map((row) => row.avg || 0));
  const sx = (index) => pad + (index / Math.max(1, rows.length - 1)) * (width - pad * 2);
  const sy = (value) => height - pad - (value / max) * (height - pad * 2);
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Water usage timeline chart' });
  svg.append(svgEl('rect', { width, height, rx: 30, fill: 'var(--chart-bg, #f7fbfb)' }));
  for (let i = 0; i <= 4; i += 1) {
    const y = pad + (i / 4) * (height - pad * 2);
    svg.append(svgEl('line', { x1: pad, y1: y, x2: width - pad, y2: y, stroke: 'var(--chart-grid, #dbe8e9)', 'stroke-width': 1 }));
  }
  const baselineY = sy(analysis.baselineGpd);
  svg.append(svgEl('line', { x1: pad, y1: baselineY, x2: width - pad, y2: baselineY, stroke: 'var(--chart-baseline, #f2b31b)', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.88 }));
  const line = rows.map((row, index) => `${index === 0 ? 'M' : 'L'} ${sx(index).toFixed(1)} ${sy(row.gpd).toFixed(1)}`).join(' ');
  svg.append(svgEl('path', { d: line, fill: 'none', stroke: 'var(--chart-primary, #006879)', 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  rows.forEach((row, index) => {
    svg.append(svgEl('circle', { cx: sx(index), cy: sy(row.gpd), r: 5, fill: 'var(--chart-dot, #39b9c6)', stroke: '#ffffff', 'stroke-width': 2 }));
  });
  const label = svgEl('text', { x: pad, y: height - 15, fill: 'var(--chart-label, #516366)', 'font-size': 13, 'font-weight': 700 });
  label.textContent = 'GPD = gallons per day. Gold line = estimated household baseline.';
  svg.append(label);
  return svg;
}

function renderSeasonBars(analysis) {
  const wrapper = el('div', { class: 'season-bars', 'aria-label': 'Season average gallons per day' });
  const max = Math.max(1, ...Object.values(analysis.seasonAverages));
  for (const [season, value] of Object.entries(analysis.seasonAverages)) {
    const row = el('div', { class: 'season-row' });
    row.append(el('span', { text: season }));
    const bar = el('i');
    bar.style.width = `${Math.max(6, (value / max) * 100)}%`;
    row.append(el('b', {}, [bar]));
    row.append(el('strong', { text: `${value} GPD` }));
    wrapper.append(row);
  }
  return wrapper;
}

function chip(label, icon = '') {
  const chipNode = el('md-assist-chip', { label });
  if (icon) chipNode.setAttribute('aria-label', `${icon} ${label}`);
  return chipNode;
}

export function renderBrowserReport(container, analysis, options = {}) {
  container.replaceChildren();
  const sourceLabel = options.sample ? 'Synthetic sample CSV analyzed locally' : 'Uploaded CSV analyzed locally';
  const topInsight = analysis.insights[0];
  const root = el('section', { class: 'browser-report material-card', tabindex: '-1', 'data-testid': 'browser-report' });

  const header = el('div', { class: 'browser-report-head' }, [
    el('div', {}, [
      el('p', { class: 'overline', text: sourceLabel }),
      el('h2', { text: 'Your private browser report is ready.' }),
      el('p', { text: 'Mud Buddy read the CSV in this page and rendered this summary without uploading the file to a server.' })
    ]),
    el('div', { class: 'report-action-panel' }, [
      el('div', { class: 'report-chip-row' }, [chip('Local only'), chip('CSV not uploaded'), chip('Private report')]),
      el('div', { class: 'report-actions' }, [
        el('md-filled-tonal-button', { id: 'analyzeAnother', 'data-testid': 'analyze-another', text: 'Analyze another CSV' }),
        el('md-outlined-button', { id: 'printReport', text: 'Print / save' }),
        el('md-text-button', { href: 'sample-report/index.html', target: '_blank', text: 'Open sample report' })
      ])
    ])
  ]);
  root.append(header);
  root.append(el('md-divider'));

  root.append(el('article', { class: 'browser-summary-card', 'data-testid': 'browser-summary' }, [
    el('md-icon', { text: topInsight.icon }),
    el('div', {}, [
      el('span', { text: 'Start here' }),
      el('h3', { text: topInsight.title }),
      el('p', { text: topInsight.text })
    ])
  ]));

  root.append(el('div', { class: 'primary-kpis', 'data-testid': 'primary-kpis' }, [
    stat('Baseline estimate', `${analysis.baselineGpd} GPD`, 'kpi-baseline', true),
    stat('Seasonal lift clue', `${analysis.seasonalLift} GPD`, 'kpi-seasonal-lift', true),
    stat('Peak period', `${analysis.peakPeriod.label} (${analysis.peakPeriod.gpd} GPD)`, 'kpi-peak', true)
  ]));

  root.append(el('div', { class: 'data-quality-card', 'data-testid': 'data-quality' }, [
    stat('Total valid history', `${analysis.totalCcf.toLocaleString()} CCF`, 'stat-total-ccf'),
    stat('Approximate gallons', `${Math.round(analysis.totalGallons / 1000).toLocaleString()}k`, 'stat-total-gallons'),
    stat('Valid periods', String(analysis.validRows), 'stat-valid-rows'),
    stat('Invalid rows excluded', String(analysis.invalidRows), 'stat-invalid-rows')
  ]));

  root.append(el('md-divider'));
  const chartGrid = el('div', { class: 'browser-chart-grid' });
  chartGrid.append(el('div', { class: 'browser-chart-card' }, [
    el('div', { class: 'chart-card-head' }, [
      el('h3', { text: 'Usage timeline' }),
      el('div', { class: 'report-chip-row chart-legend' }, [chip('Usage'), chip('Baseline'), chip('GPD')])
    ]),
    renderTimeline(analysis)
  ]));
  chartGrid.append(el('div', { class: 'browser-chart-card' }, [
    el('h3', { text: 'Season averages' }),
    renderSeasonBars(analysis),
    el('p', { text: `Peer context: ${analysis.peerComparison}.` })
  ]));
  root.append(chartGrid);

  root.append(el('md-divider'));
  const insights = el('div', { class: 'browser-insights' });
  for (const insight of analysis.insights) {
    insights.append(el('article', {}, [
      el('md-icon', { text: insight.icon }),
      el('div', {}, [
        el('h3', { text: insight.title }),
        el('p', { text: insight.text })
      ])
    ]));
  }
  root.append(insights);

  if (analysis.warnings.length) {
    const warningList = el('ul', { class: 'browser-warnings' });
    for (const warning of analysis.warnings.slice(0, 4)) warningList.append(el('li', { text: warning }));
    root.append(el('div', { class: 'browser-warning-card' }, [
      el('h3', { text: 'Read-period notes' }),
      warningList
    ]));
  }

  root.append(el('p', {
    class: 'browser-disclaimer',
    text: 'This is explanatory pattern-finding, not a certified audit, leak diagnosis, billing decision, plumbing inspection, or official EBMUD analysis. Not affiliated with EBMUD.'
  }));
  container.append(root);
  root.focus({ preventScroll: true });
}
