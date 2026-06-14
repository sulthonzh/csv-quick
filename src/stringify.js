/**
 * CSV Serializer — RFC 4180 compliant.
 * Auto-quotes fields that need escaping.
 */

/**
 * Convert a single field to its CSV representation.
 * @param {string} field
 * @param {string} delim
 * @param {string} quote
 * @returns {string}
 */
function escapeField(field, delim, quote) {
  const str = String(field);
  const needsQuote =
    str.includes(delim) ||
    str.includes(quote) ||
    str.includes('\n') ||
    str.includes('\r');

  if (!needsQuote) return str;
  return quote + str.split(quote).join(quote + quote) + quote;
}

/**
 * Serialize an array of arrays into CSV text.
 * @param {string[][]} rows
 * @param {{ delimiter?: string, quote?: string, eol?: string }} [opts]
 * @returns {string}
 */
export function stringify(rows, opts = {}) {
  const delim = opts.delimiter ?? ',';
  const quote = opts.quote ?? '"';
  const eol = opts.eol ?? '\n';

  if (delim.length !== 1) throw new Error('delimiter must be a single character');
  if (quote.length !== 1) throw new Error('quote must be a single character');

  return rows
    .map((row) => row.map((field) => escapeField(field ?? '', delim, quote)).join(delim))
    .join(eol) + (rows.length > 0 ? eol : '');
}

/**
 * Serialize an array of objects into CSV text with a header row.
 * @param {Record<string, string>[]} objects
 * @param {{ delimiter?: string, quote?: string, eol?: string, columns?: string[] }} [opts]
 * @returns {string}
 */
export function stringifyObjects(objects, opts = {}) {
  if (objects.length === 0) return '';
  const columns = opts.columns ?? Object.keys(objects[0]);
  const header = [columns];
  const rows = objects.map((obj) => columns.map((col) => obj[col] ?? ''));
  return stringify([...header, ...rows], opts);
}
