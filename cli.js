#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { parse, parseObjects, stringify, stringifyObjects } from './src/index.js';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
const args = process.argv.slice(2);

function usage() {
  console.log(`csv-quick v${pkg.version} — Zero-dep RFC 4180 CSV parser/serializer

Usage:
  csv-quick parse [file]           Parse CSV → JSON arrays
  csv-quick parse-objects [file]   Parse CSV with header → JSON objects
  csv-quick stringify [file]       Read JSON arrays → CSV
  csv-quick stringify-objects [file] Read JSON objects → CSV
  echo "csv,data" | csv-quick parse  Read from stdin

Options:
  --delimiter <char>   Field delimiter (default: ,)
  --quote <char>       Quote character (default: ")
  --eol <str>          End of line for stringify (default: \n)
  --columns <a,b,c>    Specify columns for stringify-objects
  -V, --version        Show version
  -h, --help           Show this help
`);
}

function readInput(fileArg) {
  return readFileSync(fileArg && fileArg !== '-' ? fileArg : 0, 'utf-8');
}

// Parse options that consume a following argument
const OPTS_WITH_VALUE = ['--delimiter', '--quote', '--eol', '--columns'];
const parsedArgs = [];
const opts = {};

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (OPTS_WITH_VALUE.includes(a)) {
    if (i + 1 < args.length) {
      const val = args[i + 1];
      const key = a.slice(2);
      if (key === 'columns') opts.columns = val.split(',');
      else opts[key] = val;
      i++; // skip the value
    }
  } else {
    parsedArgs.push(a);
  }
}

// Version flag
if (parsedArgs[0] === '-V' || parsedArgs[0] === '--version') {
  console.log(pkg.version);
  process.exit(0);
}

const cmd = parsedArgs.find((a) => !a.startsWith('-') && a !== '-');

if (!cmd || parsedArgs[0] === '--help' || parsedArgs[0] === '-h') { usage(); process.exit(0); }

const fileArg = parsedArgs.filter((a) => !a.startsWith('-') && a !== cmd)[0];

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
      console.log(stringifyObjects(JSON.parse(input), opts));
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`); usage(); process.exit(1);
  }
} catch (err) {
  console.error(err.message); process.exit(1);
}
