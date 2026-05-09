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

function iconGlyph(name) {
  return el('span', { class: 'icon-glyph', 'aria-hidden': 'true', dataset: { icon: name } });
}

const officialLinks = [
  ['Billing questions', 'https://www.ebmud.com/customers/billing-questions'],
  ['Leaks and high bills', 'https://www.ebmud.com/customers/billing-questions/leaks-and-high-bills'],
  ['Alerts and outages', 'https://www.ebmud.com/customers/alerts'],
  ['Water quality', 'https://www.ebmud.com/water/about-your-water/water-quality'],
  ['Conservation and rebates', 'https://www.ebmud.com/water/conservation-and-rebates'],
  ['Customer assistance', 'https://www.ebmud.com/customers/customer-assistance-program'],
  ['Contact / emergency', 'https://www.ebmud.com/contact-us']
];

function renderOfficialNextSteps() {
  const links = el('div', { class: 'browser-official-links' });
  for (const [label, href] of officialLinks) {
    links.append(el('a', { href, target: '_blank', rel: 'noreferrer', text: label }));
  }
  return el('article', { class: 'browser-official-card' }, [
    el('h3', { text: 'When to use EBMUD directly' }),
    el('p', { text: 'Use official EBMUD resources for billing disputes, urgent service issues, outages or pressure concerns, water quality, rebates, assistance programs, or account actions. Mud Buddy only explains patterns in your exported CSV.' }),
    links
  ]);
}

function confidenceFor(analysis, type) {
  const warningLoad = analysis.warnings.length + analysis.invalidRows;
  if (analysis.validRows < 6 || warningLoad >= 3) return ['Needs manual review', 'This export has limited clean history, so treat the clue as a prompt to look closer.'];
  if (type === 'outdoor' && analysis.seasonalLift < 20) return ['Limited data', 'Outdoor watering does not stand out strongly in this export.'];
  if (type === 'baseline' && Math.abs(analysis.baselineChange) < 18) return ['Good signal', 'The normal-use estimate is relatively steady across the export.'];
  if (analysis.validRows >= 10 && warningLoad === 0) return ['Good signal', 'There is enough clean billing history for a useful pattern clue.'];
  return ['Limited data', 'The export is usable, but the finding should be checked against household context.'];
}

function nextChecksFor(analysis) {
  const checks = [];
  if (analysis.seasonalLift >= 45) {
    checks.push('Walk irrigation zones while they run: look for overspray, stuck valves, runoff, broken heads, and thirsty planting areas.');
  } else {
    checks.push('Compare the highest-use period with weather, guests, laundry, showers, and any yard or controller changes.');
  }
  if (analysis.baselineChange >= 30) {
    checks.push('Run a toilet dye test and a meter-stillness check before assuming the increase is only lifestyle or irrigation.');
  } else if (analysis.baselineChange <= -25) {
    checks.push('Write down what changed: fixture repairs, controller settings, travel, landscaping, or conservation habits.');
  } else {
    checks.push('Use the normal daily use estimate as a practical reference point when the next bill arrives.');
  }
  if (analysis.invalidRows || analysis.warnings.length) {
    checks.push('Review CSV notes and billing-period length before comparing one period too literally.');
  }
  checks.push('Use EBMUD directly for billing, rebates, outages, water quality, assistance, or emergency service questions.');
  return checks.slice(0, 4);
}

function renderConfidencePanel(analysis) {
  const items = [
    ['Normal daily use', ...confidenceFor(analysis, 'baseline')],
    ['Outdoor watering clue', ...confidenceFor(analysis, 'outdoor')],
    ['Peak period', analysis.validRows >= 3 ? 'Good signal' : 'Needs manual review', 'The highest-use period is selected from the clean rows in this export.']
  ];
  const grid = el('div', { class: 'confidence-grid' });
  for (const [label, confidence, note] of items) {
    grid.append(el('article', {}, [
      el('span', { text: confidence }),
      el('strong', { text: label }),
      el('p', { text: note })
    ]));
  }
  return el('section', { class: 'confidence-panel' }, [
    el('h3', { text: 'Confidence' }),
    grid
  ]);
}

function renderNextChecks(analysis) {
  const list = el('ol', { class: 'next-check-list' });
  for (const check of nextChecksFor(analysis)) list.append(el('li', { text: check }));
  return el('section', { class: 'next-checks-card' }, [
    el('h3', { text: 'Recommended next steps' }),
    el('p', { text: 'Start with low-drama checks that can explain the pattern before assuming there is one single cause.' }),
    list
  ]);
}

function renderDecisionPanel(analysis) {
  return el('section', { class: 'decision-panel' }, [
    el('h3', { text: 'How Mud Buddy decides this' }),
    el('p', { text: `Mud Buddy estimates normal daily use from winter and spring periods, compares warmer-season use against that estimate, highlights the highest-use billing period, and reports ${analysis.invalidRows} skipped row${analysis.invalidRows === 1 ? '' : 's'} from this export.` }),
    el('p', { text: 'These are heuristic pattern clues. They are not official EBMUD classifications, normalized customer comparisons, leak diagnoses, billing findings, plumbing inspections, or certified conservation measurements.' })
  ]);
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
      el('p', { text: 'Mud Buddy read the CSV in this page and created this report without uploading the file to a server.' })
    ]),
    el('div', { class: 'report-action-panel' }, [
      el('div', { class: 'report-chip-row' }, [chip('Local only'), chip('CSV not uploaded'), chip('Private report')]),
        el('div', { class: 'report-actions' }, [
          el('md-filled-tonal-button', { id: 'analyzeAnother', 'data-testid': 'analyze-another', text: 'Analyze another CSV' }),
        el('md-outlined-button', { id: 'printReport', text: 'Print or save PDF' })
      ])
    ])
  ]);
  root.append(header);
  root.append(el('md-divider'));

  root.append(el('article', { class: 'browser-summary-card', 'data-testid': 'browser-summary' }, [
    iconGlyph(topInsight.icon),
    el('div', {}, [
      el('span', { text: 'What should I check first?' }),
      el('h3', { text: topInsight.title }),
      el('p', { text: topInsight.text })
    ])
  ]));

  root.append(el('div', { class: 'primary-kpis', 'data-testid': 'primary-kpis' }, [
    stat('Normal daily use estimate', `${analysis.baselineGpd} GPD`, 'kpi-baseline', true),
    stat('Likely outdoor watering', `${analysis.seasonalLift} GPD`, 'kpi-seasonal-lift', true),
    stat('Highest-use period', `${analysis.peakPeriod.label} (${analysis.peakPeriod.gpd} GPD)`, 'kpi-peak', true)
  ]));
  root.append(el('p', { class: 'browser-kpi-note', text: 'GPD means gallons per day.' }));
  root.append(renderConfidencePanel(analysis));
  root.append(renderNextChecks(analysis));

  root.append(el('div', { class: 'data-quality-card', 'data-testid': 'data-quality' }, [
    stat('Water use in this CSV', `${analysis.totalCcf.toLocaleString()} CCF`, 'stat-total-ccf'),
    stat('Approx. gallons used', `${Math.round(analysis.totalGallons / 1000).toLocaleString()}k`, 'stat-total-gallons'),
    stat('Billing periods analyzed', String(analysis.validRows), 'stat-valid-rows'),
    stat('Rows skipped', String(analysis.invalidRows), 'stat-invalid-rows')
  ]));

  root.append(el('md-divider'));
  const chartGrid = el('div', { class: 'browser-chart-grid' });
  chartGrid.append(el('div', { class: 'browser-chart-card' }, [
    el('div', { class: 'chart-card-head' }, [
      el('h3', { text: 'Water use over time' }),
      el('div', { class: 'report-chip-row chart-legend' }, [chip('Usage'), chip('Baseline'), chip('GPD')])
    ]),
    renderTimeline(analysis)
  ]));
  chartGrid.append(el('div', { class: 'browser-chart-card' }, [
    el('h3', { text: 'Average use by season' }),
    renderSeasonBars(analysis),
    el('p', { text: `Compared with the average-household benchmark in your export: ${analysis.peerComparison}.` })
  ]));
  root.append(chartGrid);

  root.append(el('md-divider'));
  const insights = el('div', { class: 'browser-insights' });
  for (const insight of analysis.insights) {
    insights.append(el('article', {}, [
      iconGlyph(insight.icon),
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
      el('h3', { text: 'CSV notes' }),
      warningList
    ]));
  }

  root.append(renderDecisionPanel(analysis));
  root.append(el('md-divider'));
  root.append(renderOfficialNextSteps());

  root.append(el('p', {
    class: 'browser-disclaimer',
    text: 'This is explanatory pattern-finding, not a certified audit, leak diagnosis, billing decision, plumbing inspection, or official EBMUD analysis. Not affiliated with EBMUD.'
  }));
  container.append(root);
  root.focus({ preventScroll: true });
}
