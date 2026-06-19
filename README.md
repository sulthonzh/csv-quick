# csv-quick

**RFC 4180 CSV that doesn't break on real-world data.** Zero dependencies. Excel-safe (BOM stripping). 88 tests.

`String#split(',')` breaks on quoted fields, embedded newlines, and escaped quotes. This doesn't.

## Install

```bash
npm install csv-quick
```

## Quick Start

```js
import { parse, parseObjects, stringify, stringifyObjects } from 'csv-quick';

// Parse to arrays
const rows = parse('name,age\nAlice,30\nBob,25');
// [['name','age'], ['Alice','30'], ['Bob','25']]

// Parse to objects (first row = headers)
const users = parseObjects('name,age\nAlice,30\nBob,25');
// [{ name: 'Alice', age: '30' }, { name: 'Bob', age: '25' }]

// Serialize back to CSV
const csv = stringifyObjects([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]);
// 'name,age\nAlice,30\nBob,25\n'
```

## Why csv-quick?

| Feature | csv-quick | csv-parse | papaparse | neat-csv |
|---------|-----------|-----------|-----------|----------|
| Zero dependencies | ✅ | ❌ | ❌ | ❌ |
| RFC 4180 compliant | ✅ | ✅ | ✅ | ✅ |
| BOM stripping | ✅ | ❌ | ✅ | ❌ |
| Sync + async API | sync | both | both | async |
| CLI included | ✅ | ❌ | ❌ | ❌ |
| Bundle size | ~3 KB | ~50 KB | ~90 KB | ~5 KB |
| ESM support | ✅ | ❌ | ❌ | ✅ |

## Real-World Examples

### 1. Excel Export Parser (BOM-safe)

Excel saves CSV files with a UTF-8 BOM and sometimes uses semicolons. Both handled:

```js
import { parseObjects } from 'csv-quick';
import { readFileSync } from 'node:fs';

// Excel-exported file with BOM + semicolons
const raw = readFileSync('export.csv', 'utf-8');  // starts with \uFEFF
const data = parseObjects(raw, { delimiter: ';' });
// BOM is automatically stripped — first header isn't '\uFEFFname'

console.log(data[0]);  // { name: 'Alice', department: 'Engineering', salary: '95000' }
```

### 2. CI Data Pipeline (JSON → CSV report)

Transform API responses into CSV reports for non-technical stakeholders:

```js
import { stringifyObjects } from 'csv-quick';
import { writeFileSync } from 'node:fs';

const metrics = await fetch('/api/metrics').then(r => r.json());

const csv = stringifyObjects(metrics.map(m => ({
  date: m.timestamp.split('T')[0],
  user: m.userName,
  requests: m.totalRequests,
  errorRate: m.errors / m.totalRequests,
})));

writeFileSync('weekly-report.csv', csv);
// Clean CSV with proper escaping — commas in names, quotes in values all handled
```

### 3. Log Aggregation (TSV streaming)

Parse tab-separated log lines in chunks — `parse` is a pure function, feed it buffers:

```js
import { parse } from 'csv-quick';

function processLogChunk(chunk, headerRow) {
  const rows = parse(chunk, { delimiter: '\t', skipEmptyLines: true });
  if (headerRow) {
    return rows.map(row => {
      const obj = {};
      headerRow.forEach((h, i) => obj[h] = row[i] ?? '');
      return obj;
    });
  }
  return rows;
}

// Works with TSV from nginx, syslog exports, etc.
const logData = parse('2024-01-01\tGET\t/health\t200\n2024-01-01\tPOST\t/login\t401', {
  delimiter: '\t'
});
```

## API

### `parse(input, opts?) → string[][]`

Parse CSV text into rows of string fields.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delimiter` | string | `','` | Single-char field separator |
| `quote` | string | `'"'` | Single-char quote character |
| `skipEmptyLines` | boolean | `false` | Skip blank lines |

- Throws on multi-char delimiter, same delimiter/quote, or non-string input
- Strips UTF-8 BOM automatically
- Handles CR, LF, CRLF line endings (mixed too)
- Escaped quotes (`""`) inside quoted fields

### `parseObjects(input, opts?) → object[]`

Same options as `parse`. Uses first row as headers. Duplicate headers are collected into arrays.

### `stringify(rows, opts?) → string`

Serialize arrays to CSV. Auto-quotes fields containing delimiters, quotes, or newlines.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delimiter` | string | `','` | Single-char field separator |
| `quote` | string | `'"'` | Single-char quote character |
| `eol` | string | `'\n'` | End-of-line sequence |

### `stringifyObjects(objects, opts?) → string`

Same options as `stringify`, plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `columns` | string[] | Object keys | Column order / selection |

## CLI

```bash
# Parse CSV file to JSON arrays
csv-quick parse data.csv

# Pipe from stdin
echo "a,b\n1,2" | csv-quick parse

# Parse with header row → objects
csv-quick parse-objects users.csv

# Custom delimiter (TSV)
csv-quick parse data.tsv --delimiter '\t'

# Serialize JSON to CSV
echo '[["a","b"],["1","2"]]' | csv-quick stringify

# Object serialization with column selection
echo '[{"x":1,"y":2}]' | csv-quick stringify-objects --columns x,y

# Show version
csv-quick --version
```

## License

MIT
