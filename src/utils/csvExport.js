// ---------------------------------------------------------------------------
// CSV export helpers. Escapes quotes/commas/newlines correctly and triggers a
// browser download. No invented values — the caller passes real fields.
// ---------------------------------------------------------------------------

/** Escape one cell per RFC 4180. */
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Quote when the value contains a comma, double quote, CR or LF.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build a CSV string.
 * @param columns [{ key, label, value?: (row) => any }]
 * @param rows    data rows
 */
export function toCSV(columns, rows) {
  const header = columns.map((c) => escapeCell(c.label ?? c.key)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const v = typeof c.value === 'function' ? c.value(row) : row[c.key];
        return escapeCell(v);
      })
      .join(','),
  );
  return [header, ...lines].join('\r\n');
}

/** Trigger a client-side download of a CSV string (UTF-8 BOM for Excel). */
export function downloadCSV(filename, csv) {
  if (typeof document === 'undefined' || typeof Blob === 'undefined') return;
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
