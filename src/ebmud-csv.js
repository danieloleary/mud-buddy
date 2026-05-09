export const GAL_PER_CCF = 748;

export const REQUIRED_COLUMNS = [
  'Reading Date',
  'Days in Read Period',
  'CCF',
  'Customer GPD'
];

export function num(value) {
  const text = String(value ?? '').trim();
  if (!text || ['N/A', 'NA'].includes(text.toUpperCase())) return null;
  const parsed = Number(text.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function seasonFor(month) {
  if ([12, 1, 2].includes(month)) return 'Winter';
  if ([3, 4, 5].includes(month)) return 'Spring';
  if ([6, 7, 8, 9].includes(month)) return 'Summer';
  return 'Fall';
}

export function parseCsv(text) {
  const input = String(text ?? '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => String(value).trim()));
}

export function parseEbmudCsv(csvText) {
  const table = parseCsv(csvText);
  if (table.length < 2) {
    throw new Error('This CSV does not include enough rows to analyze.');
  }

  const headers = table[0].map((header) => String(header ?? '').trim());
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length) {
    throw new Error(`Missing required EBMUD column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
  }

  const rows = [];
  const invalidRows = [];
  const warnings = [];

  for (let index = 1; index < table.length; index += 1) {
    const values = table[index];
    const record = Object.fromEntries(headers.map((header, i) => [header, values[i] ?? '']));
    const dateText = String(record['Reading Date'] ?? '').trim();
    const date = new Date(`${dateText}T00:00:00`);
    const ccf = num(record.CCF);
    const gpd = num(record['Customer GPD']);
    const days = num(record['Days in Read Period']);
    const avg = num(record['Average Households GPD']);
    const top = num(record['Top 20% GPD']);

    if (!dateText || Number.isNaN(date.getTime()) || ccf === null || gpd === null || days === null) {
      invalidRows.push({
        rowNumber: index + 1,
        reason: !dateText || Number.isNaN(date.getTime()) ? 'Missing or invalid reading date' : 'Missing required usage value'
      });
      continue;
    }

    if (days < 25 || days > 75) {
      warnings.push(`Row ${index + 1} has an unusual ${days}-day read period.`);
    }

    rows.push({
      date,
      dateLabel: dateText,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      season: seasonFor(date.getMonth() + 1),
      days,
      ccf,
      gallons: ccf * GAL_PER_CCF,
      gpd,
      avg,
      top,
      score: String(record.WaterScore ?? '').trim()
    });
  }

  rows.sort((a, b) => a.date - b.date);
  if (!rows.length) {
    throw new Error('No valid EBMUD usage rows were found. Check that this is the billing usage CSV export.');
  }

  return { rows, invalidRows, warnings };
}
