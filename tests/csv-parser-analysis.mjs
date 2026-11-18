import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEbmudCsv } from '../src/ebmud-csv.js';
import { analyzeWaterUse } from '../src/water-analysis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sample = await fs.readFile(path.join(root, 'examples', 'sample-ebmud-usage.csv'), 'utf8');
const parsed = parseEbmudCsv(sample);
const analysis = analyzeWaterUse(parsed.rows, parsed.invalidRows, parsed.warnings);
assert(parsed.rows.length > 20, 'sample should parse many valid rows');
assert(parsed.invalidRows.length === 1, 'sample should exclude one invalid row');
assert(analysis.totalCcf > 0 && analysis.totalGallons === Math.round(analysis.totalCcf * 748), 'summary totals should be internally consistent');
assert(analysis.baselineGpd > 0 && analysis.avgGpd > 0, 'analysis should include GPD metrics');

const bom = '\uFEFF' + sample;
assert(parseEbmudCsv(bom).rows.length === parsed.rows.length, 'BOM CSV should parse');

const quoted = `Account Number,Reading Date,Days in Read Period,Meter Reading,CCF,Customer GPD,Average Households GPD,Top 20% GPD,WaterScore,Meter Class,Meter
"PUBLIC-SAMPLE","2026-01-01","30","","6.5","162","150","90","average","SFR","MTR,QUOTED"
"PUBLIC-SAMPLE","2026-02-01","30","","7.0","175","152","91","average","SFR","MTR,QUOTED"
"PUBLIC-SAMPLE","2026-03-01","30","","N/A","N/A","152","91","average","SFR","MTR,QUOTED"
`;
const quotedParsed = parseEbmudCsv(quoted);
assert(quotedParsed.rows.length === 2, 'quoted CSV should parse valid rows');
assert(quotedParsed.invalidRows.length === 1, 'quoted CSV should track invalid N/A row');

const malformedNumbers = `Account Number,Reading Date,Days in Read Period,Meter Reading,CCF,Customer GPD,Average Households GPD,Top 20% GPD,WaterScore,Meter Class,Meter
PUBLIC-SAMPLE,2026-01-01,30,,0,0,150,90,average,SFR,MTR
PUBLIC-SAMPLE,2026-02-01,30,,6,150,150,90,average,SFR,MTR
PUBLIC-SAMPLE,2026-03-01,0,,6,150,150,90,average,SFR,MTR
PUBLIC-SAMPLE,2026-04-01,-30,,6,150,150,90,average,SFR,MTR
PUBLIC-SAMPLE,2026-05-01,30,,-6,150,150,90,average,SFR,MTR
PUBLIC-SAMPLE,2026-06-01,30,,6,-150,150,90,average,SFR,MTR
PUBLIC-SAMPLE,2026-07-01,30,,0x10,150,150,90,average,SFR,MTR
PUBLIC-SAMPLE,2026-08-01,30,,6,1e3,150,90,average,SFR,MTR
`;
const malformedParsed = parseEbmudCsv(malformedNumbers);
assert(malformedParsed.rows.length === 2, 'zero-use and positive rows should remain valid');
assert(malformedParsed.invalidRows.length === 6, 'malformed, negative, and zero-day rows should be invalid');

let allZeroError = '';
try {
  parseEbmudCsv(`Reading Date,Days in Read Period,CCF,Customer GPD
2026-01-01,30,0,0
2026-02-01,30,0,0
`);
} catch (error) {
  allZeroError = error.message;
}
assert(allZeroError.includes('No positive water usage values'), 'all-zero exports should produce a clear error');

let maxRowsError = '';
try {
  parseEbmudCsv(`Reading Date,Days in Read Period,CCF,Customer GPD
2026-01-01,30,6,150
2026-02-01,30,6,150
`, { maxRows: 2 });
} catch (error) {
  maxRowsError = error.message;
}
assert(maxRowsError.includes('too many rows'), 'parser should enforce maxRows during parsing');

const quotedNewline = `Account Number,Reading Date,Days in Read Period,Meter Reading,CCF,Customer GPD,Average Households GPD,Top 20% GPD,WaterScore,Meter Class,Meter
"PUBLIC-SAMPLE","2026-01-01","30","","6.5","162","150","90","average","SFR","MTR
LINE"
"PUBLIC-SAMPLE","2026-02-01","30","","7.0","175","152","91","average","SFR","MTR"
`;
assert(parseEbmudCsv(quotedNewline).rows.length === 2, 'quoted newline CSV field should parse');

const impossibleDate = `Account Number,Reading Date,Days in Read Period,Meter Reading,CCF,Customer GPD,Average Households GPD,Top 20% GPD,WaterScore,Meter Class,Meter
"PUBLIC-SAMPLE","2026-02-31","30","","6.5","162","150","90","average","SFR","MTR"
"PUBLIC-SAMPLE","2026-02-28","30","","6.5","162","150","90","average","SFR","MTR"
`;
const impossibleParsed = parseEbmudCsv(impossibleDate);
assert(impossibleParsed.rows.length === 1, 'impossible calendar date should be excluded');
assert(impossibleParsed.invalidRows.length === 1, 'impossible calendar date should be tracked as invalid');

let missingError = '';
try {
  parseEbmudCsv('Reading Date,CCF\n2026-01-01,6\n');
} catch (error) {
  missingError = error.message;
}
assert(missingError.includes('Missing required EBMUD column'), 'missing columns should produce a clear error');

console.log('csv-parser-analysis: OK browser parser handles sample, BOM, quoted values/newlines, N/A, malformed values, row caps, strict dates, and missing columns');

// Friend-beta exports: harmless formatting variations must not change the totals.
const header = 'Reading Date,Days in Read Period,CCF,Customer GPD';
const variants = parseEbmudCsv('\uFEFF customer  gpd ,CCF, days in read period , reading date ,Note\r150,6,30,6/1/2026,"synthetic, only"\r175,7,30,2026-07-01,extra\r');
assert(variants.rows.length === 2 && variants.rows[0].month === 6, 'US dates, reordered headers, case/spacing, extra columns and CR endings should parse');
const summerOnly = analyzeWaterUse(variants.rows);
assert(summerOnly.seasonalLift === 0, 'missing cooler-season data must not count as zero-use evidence');
assert(!summerOnly.insights.some((item) => item.title === 'Outdoor watering is the first thing to check.'), 'summer-only data must not imply an irrigation signal');
assert(summerOnly.evidencePoints.some((item) => item.value.includes('comparison unavailable')), 'missing seasonal evidence must be explained');
assert(summerOnly.recommendedChecks[0] === summerOnly.actionBrief.detail, 'first checklist action must agree with the leading action');
assert(analysis.actionBrief.proof.includes('gallons/day'), 'first check must explain units beside its evidence');

for (const [label, csv, message] of [
  ['empty', '', 'enough rows'],
  ['header only', header, 'enough rows'],
  ['unclosed quote', `${header}\n2026-01-01,30,6,"150`, 'Malformed CSV'],
  ['quote in plain field', `${header}\n2026-01-01,30,6,15"0"`, 'Malformed CSV'],
  ['text after closing quote', `${header}\n2026-01-01,30,6,"150"junk`, 'Malformed CSV'],
  ['missing cell', `${header}\n2026-01-01,30,6`, 'fields'],
  ['extra cell', `${header}\n2026-01-01,30,6,150,999`, 'fields'],
  ['duplicate heading', `${header}, ccf\n2026-01-01,30,6,150,7`, 'Duplicate column'],
  ['duplicate date', `${header}\n2026-01-01,30,6,150\n1/1/2026,30,6,150`, 'Repeated reading dates'],
  ['impossible US date', `${header}\n2/30/2026,30,6,150`, 'No valid'],
  ['ambiguous short year', `${header}\n1/2/26,30,6,150`, 'No valid'],
  ['fractional days', `${header}\n2026-01-01,30.5,6,150`, 'No valid']
]) {
  let failure;
  try { parseEbmudCsv(csv); } catch (error) { failure = error.message; }
  assert(failure?.includes(message), `${label} should fail helpfully: ${failure}`);
}
const partial = parseEbmudCsv(`${header}\n2/30/2026,30,6,150\n2/28/2026,30,6,150`);
assert(partial.warnings.some((warning) => warning.includes('Row 2 skipped') && warning.includes('YYYY-MM-DD')), 'skipped dates must have an actionable report note');
console.log('friend-beta parser/evidence: OK unfamiliar formats, malformed structures, duplicate dates, missing seasons, and first-check agreement');
