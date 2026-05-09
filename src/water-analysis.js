import { GAL_PER_CCF } from './ebmud-csv.js';

function avg(values) {
  const xs = values.filter((value) => Number.isFinite(value));
  return xs.length ? xs.reduce((sum, value) => sum + value, 0) / xs.length : 0;
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundHalfEven(value) {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (Math.abs(diff - 0.5) < 1e-9) return floor % 2 === 0 ? floor : floor + 1;
  return Math.round(value);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}

function seasonAverage(rows, season) {
  return avg(rows.filter((row) => row.season === season).map((row) => row.gpd));
}

export function estimateBaseline(rows) {
  const recentYear = Math.max(...rows.map((row) => row.year));
  let candidates = rows
    .filter((row) => row.year >= recentYear - 1 && ['Winter', 'Spring'].includes(row.season))
    .map((row) => row.gpd);
  if (candidates.length < 3) {
    candidates = rows.filter((row) => ['Winter', 'Spring'].includes(row.season)).map((row) => row.gpd);
  }
  return roundHalfEven(candidates.length ? avg(candidates) : avg(rows.map((row) => row.gpd)));
}

export function analyzeWaterUse(rows, invalidRows = [], warnings = []) {
  const baselineGpd = estimateBaseline(rows);
  const totalCcf = round(rows.reduce((sum, row) => sum + row.ccf, 0), 2);
  const totalGallons = Math.round(totalCcf * GAL_PER_CCF);
  const avgGpd = round(avg(rows.map((row) => row.gpd)), 1);
  const peak = rows.reduce((best, row) => (row.gpd > best.gpd ? row : best), rows[0]);
  const winterSpring = avg(rows.filter((row) => ['Winter', 'Spring'].includes(row.season)).map((row) => row.gpd));
  const summerFall = avg(rows.filter((row) => ['Summer', 'Fall'].includes(row.season)).map((row) => row.gpd));
  const seasonalLift = Math.max(0, Math.round(summerFall - winterSpring));
  const peerRows = rows.filter((row) => Number.isFinite(row.avg));
  const peerRatio = peerRows.length ? avg(peerRows.map((row) => row.gpd / row.avg)) : null;
  const firstThird = rows.slice(0, Math.max(1, Math.floor(rows.length / 3)));
  const lastThird = rows.slice(-Math.max(1, Math.floor(rows.length / 3)));
  const baselineChange = avg(lastThird.map((row) => row.gpd)) - avg(firstThird.map((row) => row.gpd));

  const insights = [];
  if (seasonalLift >= 45) {
    insights.push({
      icon: 'yard',
      title: 'Outdoor watering appears to explain most of the lift.',
      text: 'The summer/fall average sits well above the winter/spring baseline. First check irrigation schedules, controller zones, runoff, and stressed planting areas.'
    });
  } else {
    insights.push({
      icon: 'home',
      title: 'Seasonal outdoor lift looks modest.',
      text: 'The pattern does not scream irrigation by itself. Compare household routines, guests, laundry, showers, fixtures, and read-period length.'
    });
  }

  if (baselineChange >= 30) {
    insights.push({
      icon: 'plumbing',
      title: 'A rising baseline is worth a simple fixture check.',
      text: 'Later periods are materially higher than earlier periods. A toilet dye test, meter test, and fixture walk-through are good low-drama next checks.'
    });
  } else if (baselineChange <= -25) {
    insights.push({
      icon: 'task_alt',
      title: 'Usage appears lower than the earlier baseline.',
      text: 'The later average is lower than the earlier average. Note any behavior, fixture, controller, or landscaping changes that might explain the drop.'
    });
  } else {
    insights.push({
      icon: 'query_stats',
      title: 'Your baseline looks explainable.',
      text: 'The baseline does not show a dramatic step-change. Focus attention on the highest periods and any known household or yard changes.'
    });
  }

  if (peerRatio && peerRatio > 1.15) {
    insights.push({
      icon: 'groups',
      title: 'Your usage often runs above peer averages.',
      text: 'Peer comparisons are not destiny, but they are useful context. Household size, daytime occupancy, irrigation, and leaks can all make peers imperfect.'
    });
  }

  return {
    validRows: rows.length,
    invalidRows: invalidRows.length,
    totalCcf,
    totalGallons,
    avgGpd,
    baselineGpd,
    seasonalLift,
    peakPeriod: {
      label: formatMonth(peak.date),
      gpd: Math.round(peak.gpd),
      ccf: round(peak.ccf, 1)
    },
    peerComparison: peerRatio === null ? 'Not enough peer benchmark data' : `${Math.round(peerRatio * 100)}% of average-household benchmark`,
    baselineChange: Math.round(baselineChange),
    seasonAverages: {
      Winter: Math.round(seasonAverage(rows, 'Winter')),
      Spring: Math.round(seasonAverage(rows, 'Spring')),
      Summer: Math.round(seasonAverage(rows, 'Summer')),
      Fall: Math.round(seasonAverage(rows, 'Fall'))
    },
    rows: rows.map((row) => ({
      label: formatMonth(row.date),
      gpd: Math.round(row.gpd),
      avg: Number.isFinite(row.avg) ? Math.round(row.avg) : null,
      top: Number.isFinite(row.top) ? Math.round(row.top) : null,
      baseline: baselineGpd,
      season: row.season
    })),
    insights,
    warnings
  };
}
