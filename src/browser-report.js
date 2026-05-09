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
  svg.append(svgEl('rect', { width, height, rx: 18, fill: 'var(--chart-bg, #f8f7f3)' }));
  for (let i = 0; i <= 4; i += 1) {
    const y = pad + (i / 4) * (height - pad * 2);
    svg.append(svgEl('line', { x1: pad, y1: y, x2: width - pad, y2: y, stroke: 'var(--chart-grid, #e7ebef)', 'stroke-width': 1 }));
  }
  const baselineY = sy(analysis.baselineGpd);
  svg.append(svgEl('line', { x1: pad, y1: baselineY, x2: width - pad, y2: baselineY, stroke: 'var(--chart-baseline, #b7791f)', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.88 }));
  const line = rows.map((row, index) => `${index === 0 ? 'M' : 'L'} ${sx(index).toFixed(1)} ${sy(row.gpd).toFixed(1)}`).join(' ');
  svg.append(svgEl('path', { d: line, fill: 'none', stroke: 'var(--chart-primary, #c96442)', 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  rows.forEach((row, index) => {
    svg.append(svgEl('circle', { cx: sx(index), cy: sy(row.gpd), r: 5, fill: 'var(--chart-dot, #7fced4)', stroke: '#ffffff', 'stroke-width': 2 }));
  });
  const label = svgEl('text', { x: pad, y: height - 15, fill: 'var(--chart-label, #5d6978)', 'font-size': 13, 'font-weight': 700 });
  label.textContent = 'GPD = gallons per day. Gold line = estimated normal daily use.';
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

function chip(label) {
  return el('md-assist-chip', { label });
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
  ['Contact / emergency', 'https://www.ebmud.com/contact-us']
];

function confidenceFor(analysis) {
  const warningLoad = analysis.warnings.length + analysis.invalidRows;
  if (analysis.validRows < 6 || warningLoad >= 3) return 'Limited data: treat the findings as prompts to review, not conclusions.';
  if (analysis.validRows >= 10 && warningLoad === 0) return 'Good signal: the export has enough clean billing history for useful pattern clues.';
  return 'Usable signal: compare the findings with household and yard context.';
}

function nextChecksFor(analysis) {
  const checks = [];
  if (analysis.seasonalLift >= 45) {
    checks.push('Check irrigation first: run zones, look for overspray, stuck valves, runoff, broken heads, and thirsty planting areas.');
  } else {
    checks.push('Compare the highest-use period with weather, guests, laundry, showers, and any yard or controller changes.');
  }
  if (analysis.baselineChange >= 30) {
    checks.push('Run a toilet dye test and a meter-stillness check before assuming the increase is only lifestyle or irrigation.');
  } else if (analysis.baselineChange <= -25) {
    checks.push('Write down what changed: fixture repairs, controller settings, travel, landscaping, or conservation habits.');
  } else {
    checks.push('Use the normal daily use estimate as a reference point when the next bill arrives.');
  }
  if (analysis.invalidRows || analysis.warnings.length) {
    checks.push('Review CSV notes and billing-period length before comparing one period too literally.');
  }
  checks.push('Use EBMUD directly for billing, rebates, outages, water quality, assistance, or emergency service questions.');
  return checks.slice(0, 4);
}

function renderNextChecks(analysis) {
  const list = el('ol', { class: 'next-check-list' });
  for (const check of nextChecksFor(analysis)) list.append(el('li', { text: check }));
  return el('section', { class: 'next-checks-card' }, [
    el('h3', { text: 'Recommended next checks' }),
    el('p', { text: 'Start with simple checks before assuming one single cause.' }),
    list
  ]);
}

function renderInsightList(analysis) {
  const list = el('div', { class: 'insight-list' });
  for (const insight of analysis.insights) {
    list.append(el('article', {}, [
      iconGlyph(insight.icon),
      el('div', {}, [
        el('strong', { text: insight.title }),
        el('p', { text: insight.text })
      ])
    ]));
  }
  return el('section', { class: 'insight-panel' }, [
    el('h3', { text: 'What likely changed' }),
    list
  ]);
}

function renderCsvNotes(analysis) {
  const notes = el('div', { class: 'csv-notes-body' });
  notes.append(el('p', { text: `${analysis.validRows} billing period${analysis.validRows === 1 ? '' : 's'} analyzed. ${analysis.invalidRows} row${analysis.invalidRows === 1 ? '' : 's'} skipped.` }));
  if (analysis.warnings.length) {
    const warningList = el('ul', { class: 'browser-warnings' });
    for (const warning of analysis.warnings.slice(0, 4)) warningList.append(el('li', { text: warning }));
    notes.append(warningList);
  }
  return el('section', { class: 'browser-warning-card', 'data-testid': 'data-quality' }, [
    el('h3', { text: 'CSV notes' }),
    notes
  ]);
}

function renderMethodDetails(analysis) {
  return el('details', { class: 'method-details' }, [
    el('summary', { text: 'Confidence and method' }),
    el('p', { text: confidenceFor(analysis) }),
    el('p', { text: `How Mud Buddy decides this: it estimates normal daily use from winter and spring periods, compares warmer-season use against that estimate, highlights the highest-use billing period, and reports ${analysis.invalidRows} skipped row${analysis.invalidRows === 1 ? '' : 's'} from this export.` }),
    el('p', { text: 'These are heuristic pattern clues. They are not official EBMUD classifications, normalized customer comparisons, leak diagnoses, billing findings, plumbing inspections, or certified conservation measurements.' })
  ]);
}

function renderGlossary() {
  return el('section', { class: 'glossary-card' }, [
    el('h3', { text: 'Quick glossary' }),
    el('dl', {}, [
      el('dt', { text: 'GPD' }), el('dd', { text: 'Gallons per day.' }),
      el('dt', { text: 'CCF' }), el('dd', { text: 'One billing unit. EBMUD rate materials define 1 CCF as 748 gallons.' }),
      el('dt', { text: 'Normal daily use' }), el('dd', { text: 'A rough baseline estimated from lower outdoor-watering periods.' }),
      el('dt', { text: 'Benchmark' }), el('dd', { text: 'The average-household benchmark included in your export, not an official normalized comparison.' })
    ])
  ]);
}

function renderOfficialNextSteps() {
  const links = el('div', { class: 'browser-official-links' });
  for (const [label, href] of officialLinks) {
    links.append(el('a', { href, target: '_blank', rel: 'noreferrer', text: label }));
  }
  return el('article', { class: 'browser-official-card' }, [
    el('h3', { text: 'When to use EBMUD directly' }),
    el('p', { text: 'Use official EBMUD resources for billing, outages, pressure, water quality, rebates, assistance, emergencies, or account actions. Mud Buddy only explains CSV patterns.' }),
    links
  ]);
}

export function renderBrowserReport(container, analysis, options = {}) {
  container.replaceChildren();
  const sourceLabel = options.sample ? 'Synthetic sample CSV analyzed locally' : 'Uploaded CSV analyzed locally';
  const topInsight = analysis.insights[0];
  const root = el('section', { class: 'browser-report material-card', tabindex: '-1', 'data-testid': 'browser-report' });

  root.append(el('div', { class: 'browser-report-head' }, [
    el('div', {}, [
      el('p', { class: 'overline', text: sourceLabel }),
      el('h2', { text: 'Report ready.' }),
      el('p', { text: 'Analyzed locally in this browser. Nothing was uploaded.' })
    ]),
    el('div', { class: 'report-action-panel' }, [
      el('p', { class: 'report-action-note', text: 'Local only. Private report.' }),
      el('div', { class: 'report-actions' }, [
        el('md-filled-tonal-button', { id: 'analyzeAnother', 'data-testid': 'analyze-another', text: 'Analyze another CSV' }),
        el('md-outlined-button', { id: 'printReport', text: 'Print or save PDF' })
      ])
    ])
  ]));
  root.append(el('md-divider'));

  root.append(el('article', { class: 'browser-summary-card', 'data-testid': 'browser-summary' }, [
    iconGlyph(topInsight.icon),
    el('div', {}, [
      el('span', { text: 'Start here' }),
      el('h3', { text: topInsight.title }),
      el('p', { text: topInsight.text })
    ])
  ]));

  root.append(renderInsightList(analysis));
  root.append(renderNextChecks(analysis));

  root.append(el('section', { class: 'key-numbers-card' }, [
    el('div', { class: 'section-title-row' }, [
      el('h3', { text: 'Key numbers' }),
      el('p', { text: 'GPD means gallons per day.' })
    ]),
    el('div', { class: 'primary-kpis', 'data-testid': 'primary-kpis' }, [
      stat('Normal daily use estimate', `${analysis.baselineGpd} GPD`, 'kpi-baseline', true),
      stat('Pattern suggests outdoor watering', `${analysis.seasonalLift} GPD`, 'kpi-seasonal-lift', true),
      stat('Highest-use period', `${analysis.peakPeriod.label} (${analysis.peakPeriod.gpd} GPD)`, 'kpi-peak', true)
    ]),
    el('div', { class: 'data-quality-card' }, [
      stat('Water use in this CSV', `${analysis.totalCcf.toLocaleString()} CCF`, 'stat-total-ccf'),
      stat('Approx. gallons used', `${Math.round(analysis.totalGallons / 1000).toLocaleString()}k`, 'stat-total-gallons')
    ])
  ]));

  root.append(el('div', { class: 'browser-chart-grid' }, [
    el('div', { class: 'browser-chart-card' }, [
      el('div', { class: 'chart-card-head' }, [
        el('h3', { text: 'Water use over time' }),
        el('div', { class: 'report-chip-row chart-legend' }, [chip('Usage'), chip('Baseline'), chip('GPD')])
      ]),
      renderTimeline(analysis)
    ]),
    el('div', { class: 'browser-chart-card' }, [
      el('h3', { text: 'Average use by season' }),
      renderSeasonBars(analysis),
      el('p', { text: `Compared with the average-household benchmark in your export: ${analysis.peerComparison}.` })
    ])
  ]));

  root.append(renderCsvNotes(analysis));
  root.append(renderMethodDetails(analysis));
  root.append(renderGlossary());
  root.append(renderOfficialNextSteps());

  root.append(el('p', {
    class: 'browser-disclaimer',
    text: 'Pattern clues only. Not a certified audit, leak diagnosis, billing decision, plumbing inspection, or official EBMUD analysis. Not affiliated with EBMUD.'
  }));
  container.append(root);
  root.focus({ preventScroll: true });
}
