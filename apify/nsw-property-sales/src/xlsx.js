import * as XLSX from 'xlsx';

/**
 * Parse the first (or named) worksheet of an XLSX/XLS workbook into row objects.
 *
 * Government statistics spreadsheets often carry title/preamble rows above the
 * real table, which would otherwise be mistaken for the header. We pick the
 * header row heuristically: the first row (within the first 25) that has the
 * most non-empty cells and at least two of them, then read the table from there.
 */
export function parseXlsxBuffer(buffer, { sheet } = {}) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const name = sheet && wb.Sheets[sheet] ? sheet : wb.SheetNames[0];
    const ws = wb.Sheets[name];
    if (!ws) return [];

    const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
    const nonEmpty = (row) => (row ?? []).filter((c) => c != null && String(c).trim() !== '').length;

    let headerIdx = 0;
    let best = 0;
    for (let i = 0; i < Math.min(grid.length, 25); i++) {
        const count = nonEmpty(grid[i]);
        if (count > best) { best = count; headerIdx = i; }
    }
    if (best < 2) return XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });

    const header = grid[headerIdx].map((h, i) => (h == null || String(h).trim() === '' ? `col${i}` : String(h).trim()));
    const rows = [];
    for (let r = headerIdx + 1; r < grid.length; r++) {
        const raw = grid[r];
        if (nonEmpty(raw) === 0) continue;
        rows.push(Object.fromEntries(header.map((h, i) => [h, raw[i] ?? null])));
    }
    return rows;
}
