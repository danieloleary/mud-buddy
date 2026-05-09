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
