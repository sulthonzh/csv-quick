/**
 * CSV Parser — RFC 4180 compliant state machine.
 * Handles quoted fields, escaped quotes (""), custom delimiters,
 * CR/LF/CRLF line endings, BOM stripping, and optional headers.
 */

/**
 * Strip UTF-8 BOM (\uFEFF) from the start of input.
 * Excel and other tools prepend BOM to CSV files.
 * @param {string} input
 * @returns {string}
 */
function stripBOM(input) {
  return input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
}

/**
 * Parse CSV text into an array of arrays (rows of string fields).
 * @param {string} input — CSV text
 * @param {{ delimiter?: string, quote?: string, skipEmptyLines?: boolean }} [opts]
 * @returns {string[][]}
 */
export function parse(input, opts = {}) {
  const delim = opts.delimiter ?? ',';
  const quote = opts.quote ?? '"';
  const skipEmpty = opts.skipEmptyLines ?? false;

  if (typeof input !== 'string') throw new TypeError('input must be a string');
  if (delim.length !== 1) throw new Error('delimiter must be a single character');
  if (quote.length !== 1) throw new Error('quote must be a single character');
  if (delim === quote) throw new Error('delimiter and quote must differ');

  // Strip UTF-8 BOM if present
  const text = stripBOM(input);

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === quote) {
        // Check for escaped quote (double quote char)
        if (text[i + 1] === quote) {
          field += quote;
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    // Not in quotes
    // Recognize quote only at start of field (field === '')
    // A quote appearing mid-field is treated as a literal character
    if (ch === quote && field === '') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === delim) {
      row.push(field);
      field = '';
      i++;
      continue;
    }

    if (ch === '\r') {
      // Handle CRLF
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      if (text[i + 1] === '\n') i += 2;
      else i++;
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Last field/row if text doesn't end with newline
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Remove empty rows if requested
  const result = skipEmpty
    ? rows.filter((r) => !(r.length === 1 && r[0] === ''))
    : rows;

  return result;
}

/**
 * Parse CSV with a header row into an array of objects.
 * @param {string} input — CSV text
 * @param {{ delimiter?: string, quote?: string, skipEmptyLines?: boolean }} [opts]
 * @returns {Record<string, string>[]}
 */
export function parseObjects(input, opts = {}) {
  const rows = parse(input, opts);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const h = headers[j];
      if (h in obj) {
        // Duplicate header: convert to array if not already
        if (!Array.isArray(obj[h])) obj[h] = [obj[h]];
        obj[h].push(row[j] ?? '');
      } else {
        obj[h] = row[j] ?? '';
      }
    }
    return obj;
  });
}
