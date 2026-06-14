# csv-quick

Zero-dependency RFC 4180 CSV parser and serializer for Node.js.

No dependencies. No native modules. Just clean JavaScript.

## Why

`String#split(',')` breaks on real-world CSV. This doesn't.

- **RFC 4180 compliant** — quoted fields, escaped quotes, CRLF/CR/LF endings
- **Custom delimiters** — TSV, semicolon, pipe, whatever
- **Header support** — parse into objects or arrays
- **Serializer** — auto-quotes fields that need it
- **Streaming-friendly** — parse is a pure function, feed it chunks
- **Zero dependencies** — `npm install csv-quick` and you're done

## Install

```bash
npm install csv-quick
```

## Usage

### Parse to arrays

```js
import { parse } from 'csv-quick';

const csv = `name,age,city
Alice,30,"New York"
Bob,25,"Los Angeles, CA"
"Carol, M.",35,"Chicago"""`;

const rows = parse(csv);
// [
//   ['name', 'age', 'city'],
//   ['Alice', '30', 'New York'],
//   ['Bob', '25', 'Los Angeles, CA'],
//   ['Carol, M.', '35', 'Chicago"']
// ]
```

### Parse to objects (first row = header)

```js
import { parseObjects } from 'csv-quick';

const people = parseObjects(csv);
// [
//   { name: 'Alice', age: '30', city: 'New York' },
//   { name: 'Bob', age: '25', city: 'Los Angeles, CA' },
//   { name: 'Carol, M.', age: '35', city: 'Chicago"' }
// ]
```

### Serialize arrays

```js
import { stringify } from 'csv-quick';

const csv = stringify([
  ['name', 'age'],
  ['Alice', '30'],
  ['Bob', '25'],
]);
// "name,age\nAlice,30\nBob,25\n"
```

### Serialize objects

```js
import { stringifyObjects } from 'csv-quick';

const csv = stringifyObjects([
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
]);
```

### Custom delimiter (TSV)

```js
const tsv = parse(text, { delimiter: '\t' });
```

### CLI

```bash
# Parse CSV to JSON
csv-quick parse data.csv
echo "a,b\n1,2" | csv-quick parse

# Parse with header row
csv-quick parse-objects data.csv

# Serialize JSON to CSV
echo '[["a","b"],["1","2"]]' | csv-quick stringify

# Custom delimiter
csv-quick parse data.tsv --delimiter '\t'
```

## API

### `parse(input, opts?) → string[][]`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delimiter` | string | `','` | Single-char field separator |
| `quote` | string | `'"'` | Single-char quote character |
| `skipEmptyLines` | boolean | `false` | Skip blank lines |

### `parseObjects(input, opts?) → object[]`

Same options as `parse`. First row used as headers.

### `stringify(rows, opts?) → string`

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

## License

MIT
