import { GAL_PER_CCF } from './ebmud-csv.js';

function avg(values) {
  const xs = values.filter((value) => Number.isFinite(value));
  return xs.length ? xs.reduce((sum, value) => sum + value, 0) / xs.length : 0;
}

function stddev(values) {
  const xs = values.filter((value) => Number.isFinite(value));
  if (xs.length < 2) return 0;
  const mean = avg(xs);
  return Math.sqrt(avg(xs.map((value) => (value - mean) ** 2)));
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

function signedGpd(value) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded} GPD`;
}

function gallonsPerDayToYear(value) {
  return Math.max(0, Math.round(value * 365));
}

function gallonsForDays(value, days) {
  return Math.max(0, Math.round(value * days));
}

function formatGallons(value) {
  const rounded = Math.max(0, Math.round(value));
  if (rounded >= 1000000) return `${round(rounded / 1000000, 1)}M gallons`;
  if (rounded >= 1000) return `${Math.round(rounded / 1000).toLocaleString()}k gallons`;
  return `${rounded.toLocaleString()} gallons`;
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
  const gpdValues = rows.map((row) => row.gpd);
  const gpdStdDev = stddev(gpdValues);
  const gpdRange = Math.max(...gpdValues) - Math.min(...gpdValues);
  const peak = rows.reduce((best, row) => (row.gpd > best.gpd ? row : best), rows[0]);
  const winterSpring = avg(rows.filter((row) => ['Winter', 'Spring'].includes(row.season)).map((row) => row.gpd));
  const summerFall = avg(rows.filter((row) => ['Summer', 'Fall'].includes(row.season)).map((row) => row.gpd));
  const seasonalLift = Math.max(0, Math.round(summerFall - winterSpring));
  const seasonalLiftPct = winterSpring > 0 ? seasonalLift / winterSpring : 0;
  const peerRows = rows.filter((row) => Number.isFinite(row.avg));
  const peerRatio = peerRows.length ? avg(peerRows.map((row) => row.gpd / row.avg)) : null;
  const firstThird = rows.slice(0, Math.max(1, Math.floor(rows.length / 3)));
  const lastThird = rows.slice(-Math.max(1, Math.floor(rows.length / 3)));
  const baselineChange = avg(lastThird.map((row) => row.gpd)) - avg(firstThird.map((row) => row.gpd));
  const firstThirdAvg = avg(firstThird.map((row) => row.gpd));
  const baselineChangePct = firstThirdAvg > 0 ? baselineChange / firstThirdAvg : 0;
  const peakDelta = Math.round(peak.gpd - baselineGpd);
  const peakSeasonOutdoor = ['Summer', 'Fall'].includes(peak.season);
  const hasPartialData = rows.length < 8;
  const irrigationLikely = seasonalLift >= 45 || (peakSeasonOutdoor && peakDelta >= 75 && seasonalLiftPct >= 0.18);
  const baselineRising = baselineChange >= 30 || baselineChangePct >= 0.18;
  const baselineDropping = baselineChange <= -25 || baselineChangePct <= -0.15;
  const erraticPattern = rows.length >= 8 && gpdStdDev >= Math.max(55, avgGpd * 0.24) && gpdRange >= 120;
  const flatlinePattern = rows.length >= 8 && gpdStdDev <= Math.max(8, avgGpd * 0.045);
  const estimatedReadDays = Number.isFinite(peak.days) && peak.days > 0 ? peak.days : 30;
  const peakExcessGallons = gallonsForDays(Math.max(0, peakDelta), estimatedReadDays);
  const outdoorOpportunityGallons = gallonsForDays(seasonalLift * 0.25, 150);
  const baselineOpportunityGallons = gallonsPerDayToYear(Math.max(0, baselineChange) * 0.25);
  const totalOpportunityGallons = outdoorOpportunityGallons + baselineOpportunityGallons + Math.round(peakExcessGallons * 0.15);
  const ccfOpportunity = round(totalOpportunityGallons / GAL_PER_CCF, 1);

  const insights = [];
  const addInsight = (insight) => insights.push(insight);
  if (hasPartialData) {
    addInsight({
      icon: 'query_stats',
      priority: 55,
      title: 'This is a short snapshot.',
      text: 'There is enough data for a first read, but not enough history for a confident trend. Treat the result as a starting hypothesis.'
    });
  }

  if (irrigationLikely) {
    insights.push({
      icon: 'yard',
      priority: 100 + Math.min(25, seasonalLift / 8),
      title: 'Outdoor watering is the first thing to check.',
      text: `${peakSeasonOutdoor ? `The peak lands in ${peak.season.toLowerCase()}` : 'Warm-season use stands out'}, and warmer-season use averages about ${seasonalLift} GPD above winter/spring. Translation: the yard is the first suspect, not because it is guilty, but because it is standing next to the hose with wet shoes.`
    });
  } else {
    insights.push({
      icon: 'home',
      priority: 45,
      title: 'Outdoor watering is not the obvious driver.',
      text: 'Compare routines, guests, laundry, showers, fixtures, and read-period length before blaming the yard.'
    });
  }

  if (baselineRising) {
    insights.push({
      icon: 'plumbing',
      priority: 95 + Math.min(20, Math.abs(baselineChange) / 8),
      title: 'Normal daily use is rising.',
      text: `Later periods average about ${Math.round(Math.abs(baselineChange))} GPD higher than earlier periods. Slow creep is where tiny villains hide: a toilet flapper, an irrigation valve, a new routine, or one zone quietly doing overtime.`
    });
  } else if (baselineDropping) {
    insights.push({
      icon: 'task_alt',
      priority: 70 + Math.min(18, Math.abs(baselineChange) / 10),
      title: 'Usage is lower than earlier periods.',
      text: 'Something improved. Capture the recipe: fixture repairs, controller settings, travel, landscaping, or new habits. If it saved water once, it can probably save water again.'
    });
  } else {
    insights.push({
      icon: 'query_stats',
      priority: 42,
      title: 'Normal daily use looks steady.',
      text: 'No dramatic step-change stands out. That is good news: the money hunt should focus on the highest periods and known household or yard changes instead of chasing ghosts.'
    });
  }

  if (erraticPattern && !hasPartialData) {
    insights.push({
      icon: 'tune',
      priority: 68,
      title: 'The pattern jumps around.',
      text: 'Big swings between billing periods usually mean "something changed." Think controller edits, travel/guests, repairs, unusual weather, read-period length, or an intermittent fixture/irrigation issue.'
    });
  }

  if (flatlinePattern && !hasPartialData) {
    insights.push({
      icon: 'speed',
      priority: 62,
      title: 'Usage is unusually flat.',
      text: 'A very flat pattern can be normal, but if real life was chaotic and the line is suspiciously smooth, compare read periods and meter behavior.'
    });
  }

  if (peerRatio && peerRatio > 1.15) {
    insights.push({
      icon: 'groups',
      priority: 58 + Math.min(18, (peerRatio - 1) * 40),
      title: 'Usage runs above the file benchmark.',
      text: 'The benchmark in the usage file is context, not a grade. Household size, people home during the day, irrigation, and fixture issues can all move this number.'
    });
  }
  insights.sort((a, b) => b.priority - a.priority);

  const dataQualityNote = `${rows.length} usable billing period${rows.length === 1 ? '' : 's'}; ${invalidRows.length} skipped row${invalidRows.length === 1 ? '' : 's'}.`;
  const confidence = hasPartialData || invalidRows.length + warnings.length >= 3
    ? {
        label: 'Limited',
        reason: 'There is enough to form a first hypothesis, but not enough clean history to treat any pattern as settled.'
      }
    : rows.length >= 12 && !warnings.length && invalidRows.length === 0
      ? {
          label: 'Useful',
          reason: 'The usage file has enough clean billing periods for practical pattern clues and next checks.'
        }
      : {
          label: 'Usable',
          reason: 'The usage file is good enough for a homeowner read, but household context still matters.'
        };

  const evidencePoints = [
    {
      label: 'Peak vs normal',
      value: `${formatMonth(peak.date)} is ${Math.max(0, peakDelta)} GPD above normal daily use.`
    },
    {
      label: 'Outdoor signal',
      value: seasonalLift > 0
        ? `Summer/fall averages ${seasonalLift} GPD above winter/spring.`
        : 'Summer/fall does not sit above winter/spring in this usage file.'
    },
    {
      label: 'Normal-use drift',
      value: Math.abs(baselineChange) >= 10
        ? `Later periods are ${signedGpd(baselineChange)} versus earlier periods.`
        : 'Earlier and later periods are close enough to look steady.'
    },
    {
      label: 'Data quality',
      value: dataQualityNote
    }
  ];

  const dataStory = irrigationLikely
    ? `If this were a backyard science experiment, the hypothesis is simple: outdoor watering is adding roughly ${seasonalLift} gallons per day above the cooler-season baseline. The fastest test is not a spreadsheet. It is walking every irrigation zone and looking for the wet, weird, or wasteful stuff.`
    : baselineRising
      ? `The story is less "big summer spike" and more "small daily creep." That is useful, because small daily creep is often testable with a dye tab, a quiet meter check, and a look at fixtures or valves.`
      : `The story is not screaming one obvious culprit. That is still useful: compare the peak period with real-life events, then do the cheap checks before buying hardware or changing everything.`;

  const savingsOpportunities = [];
  if (outdoorOpportunityGallons > 0) {
    savingsOpportunities.push({
      title: 'Sprinkler safari jackpot',
      gallons: formatGallons(outdoorOpportunityGallons),
      detail: `A 25% trim on the warmer-season lift would be about ${formatGallons(outdoorOpportunityGallons)} over a long watering season.`,
      action: 'Go on a 3-minute zone-by-zone safari. Hunt broken heads, misting, sidewalk watering, runoff, and mystery swamp patches before cutting plant-friendly water.'
    });
  }
  if (baselineOpportunityGallons > 0) {
    savingsOpportunities.push({
      title: 'Tiny villain patrol',
      gallons: formatGallons(baselineOpportunityGallons),
      detail: `Trimming just 25% of the daily-use creep would be about ${formatGallons(baselineOpportunityGallons)} over a year.`,
      action: 'Do the cheap detective kit: toilet dye tests, a meter-stillness check, and a slow walk past fixtures, hose bibs, and valves.'
    });
  }
  if (peakExcessGallons > 0) {
    savingsOpportunities.push({
      title: 'Bill-spike time machine',
      gallons: formatGallons(peakExcessGallons),
      detail: `${formatMonth(peak.date)} sits about ${formatGallons(peakExcessGallons)} above normal for that billing period.`,
      action: 'Rewind the calendar: heat wave, guests, new plants, controller changes, repairs, vacation, pool/spa fill, or one heroic laundry weekend.'
    });
  }
  if (!savingsOpportunities.length) {
    savingsOpportunities.push({
      title: 'Keep the boring win',
      gallons: 'steady pattern',
      detail: 'No huge waste pocket jumps out. That is actually a win.',
      action: 'Use this report as a baseline and compare the next bill before making big changes.'
    });
  }

  const uncertaintyNotes = [
    'Confirm the timing against real life: guests, kids home, travel, landscaping, repairs, rain, heat, or controller changes.',
    'Use simple field checks before assuming a cause: irrigation walk-through, toilet dye test, and meter-stillness check.',
    'Use official EBMUD channels for billing, emergency, pressure, outage, rebate, assistance, or water-quality questions.'
  ];

  const expertNotes = [
    `Peak period: ${formatMonth(peak.date)} at ${Math.round(peak.gpd)} GPD, about ${Math.max(0, peakDelta)} GPD above normal daily use.`,
    `Outdoor-season lift: ${seasonalLift} GPD above winter/spring.`,
    totalOpportunityGallons > 0
      ? `Fast savings target: the first practical hunt is roughly ${formatGallons(totalOpportunityGallons)} (${ccfOpportunity} CCF) of potential water to investigate, not a certified savings claim.`
      : 'GPD is an average over a billing period, not a live daily meter trace.'
  ];

  const recommendedChecks = [];
  const officialCheck = 'Use EBMUD directly for billing, rebates, outages, pressure, water quality, assistance, emergency service, or official account questions.';
  if (irrigationLikely) {
    recommendedChecks.push('Do the Sprinkler Safari: run each zone for 3 minutes and look for wet spots, broken or leaning heads, misting, weak spray, clogged drip emitters, runoff, and overspray onto pavement.');
    recommendedChecks.push('Interrogate the controller like it stole your wallet: check watering days, rain-delay settings, start times, duplicate programs, runoff, and zones running longer than the plants need.');
  } else {
    recommendedChecks.push(`Open the ${formatMonth(peak.date)} case file: guests, laundry, showers, heat, landscaping, pools/spas, travel, repairs, or any controller changes.`);
  }
  if (baselineRising) {
    recommendedChecks.push('Run CSI: Bathroom Edition. Do a toilet dye test, then a meter-stillness check with all water off. If the meter moves, water is sneaking somewhere.');
  } else if (baselineDropping) {
    recommendedChecks.push('Bottle the magic. Write down what changed so you can repeat it: fixture repairs, controller settings, travel, landscaping, or conservation habits.');
  } else {
    recommendedChecks.push('Use the normal daily use estimate as your reference point when the next bill arrives.');
  }
  if (erraticPattern) recommendedChecks.push('If the line looks like a tiny water seismograph, check controller drift, stuck valves, skipped rain delays, and one-off household chaos before assuming a permanent trend.');
  if (flatlinePattern) recommendedChecks.push('If usage is suspiciously pancake-flat, compare read periods and consider a meter check if the pattern does not match real life.');
  if (invalidRows.length || warnings.length) recommendedChecks.push('Review usage file notes and billing-period length before comparing one period too literally.');
  recommendedChecks.push(officialCheck);

  const shareCard = {
    eyebrow: 'Mud Buddy water-saving hunt',
    title: irrigationLikely
      ? 'The yard is the prime suspect.'
      : baselineRising
        ? 'Tiny daily use is where the mystery starts.'
        : 'I found my first water-saving checks.',
    stat: totalOpportunityGallons > 0 ? formatGallons(totalOpportunityGallons) : `${baselineGpd} GPD`,
    statLabel: totalOpportunityGallons > 0 ? 'potential water to investigate' : 'normal daily use estimate',
    body: totalOpportunityGallons > 0
      ? 'Pattern clues point to a few practical checks that could save water and money before the next bill.'
      : 'No giant waste pocket jumps out, but the report gives a clean baseline and the first checks to keep bills boring.',
    shareText: `Mud Buddy helped me find my first water-saving hunt: ${irrigationLikely ? 'check irrigation first' : baselineRising ? 'check tiny daily-use creep' : 'compare the peak period with real life'}. ${totalOpportunityGallons > 0 ? `About ${formatGallons(totalOpportunityGallons)} of potential water to investigate.` : `Normal daily use estimate: ${baselineGpd} GPD.`} Runs locally in the browser. Not affiliated with EBMUD.`
  };
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
    peerComparison: peerRatio === null ? 'not enough benchmark data in this usage file' : `${Math.round(peerRatio * 100)}% of the average-household benchmark in this usage file`,
    baselineChange: Math.round(baselineChange),
    confidence,
    evidencePoints,
    dataStory,
    savingsOpportunities,
    totalOpportunityGallons,
    ccfOpportunity,
    expertNotes,
    uncertaintyNotes,
    recommendedChecks: [...recommendedChecks.filter((check) => check !== officialCheck).slice(0, 3), officialCheck],
    shareCard,
    variabilityGpd: Math.round(gpdStdDev),
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
