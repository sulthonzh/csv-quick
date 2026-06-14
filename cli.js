#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parse, parseObjects, stringify, stringifyObjects } from './src/index.js';

const args = process.argv.slice(2);

function usage() {
  console.log(`csv-quick — Zero-dep CSV parser/serializer

Usage:
  csv-quick parse [file]           Parse CSV → JSON arrays
  csv-quick parse-objects [file]   Parse CSV with header → JSON objects
  csv-quick stringify [file]       Read JSON arrays → CSV
  csv-quick stringify-objects [file] Read JSON objects → CSV
  echo "csv,data" | csv-quick parse  Read from stdin

Options:
  --delimiter <char>   Field delimiter (default: ,)
  --quote <char>       Quote character (default: ")
  --eol <str>          End of line for stringify (default: \\n)
  --columns <a,b,c>    Specify columns for stringify-objects
  -h, --help           Show this help
`);
}

function readInput(fileArg) {
  return readFileSync(fileArg && fileArg !== '-' ? fileArg : 0, 'utf-8');
}

function getOpt(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const cmd = args.find((a) => !a.startsWith('-') && a !== '-');

if (!cmd || cmd === '--help' || cmd === '-h') { usage(); process.exit(0); }

const fileArg = args.filter((a) => !a.startsWith('-') && a !== cmd)[0];
const opts = {};
const delim = getOpt('--delimiter');
const quote = getOpt('--quote');
const eol = getOpt('--eol');
if (delim) opts.delimiter = delim;
if (quote) opts.quote = quote;
if (eol) opts.eol = eol;

try {
  const input = readInput(fileArg);
  switch (cmd) {
    case 'parse':
      console.log(JSON.stringify(parse(input, opts), null, 2));
      break;
    case 'parse-objects':
      console.log(JSON.stringify(parseObjects(input, opts), null, 2));
      break;
    case 'stringify':
      console.log(stringify(JSON.parse(input), opts));
      break;
    case 'stringify-objects': {
      const cols = getOpt('--columns');
      if (cols) opts.columns = cols.split(',');
      console.log(stringifyObjects(JSON.parse(input), opts));
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`); usage(); process.exit(1);
  }
} catch (err) {
  console.error(err.message); process.exit(1);
}
