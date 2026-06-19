import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parse, parseObjects, stringify, stringifyObjects } from '../src/index.js';

// ─── Parse: basics ───
test('simple CSV', () => {
  assert.deepEqual(parse('a,b,c\n1,2,3'), [['a','b','c'],['1','2','3']]);
});

test('single row no newline', () => {
  assert.deepEqual(parse('a,b,c'), [['a','b','c']]);
});

test('empty string', () => {
  assert.deepEqual(parse(''), []);
});

test('single field', () => {
  assert.deepEqual(parse('hello'), [['hello']]);
});

// ─── Parse: quoted fields ───
test('quoted field with delimiter inside', () => {
  assert.deepEqual(parse('"a,b",c'), [['a,b','c']]);
});

test('quoted field with newline inside', () => {
  assert.deepEqual(parse('"line1\nline2",b'), [['line1\nline2','b']]);
});

test('quoted field with CR inside', () => {
  assert.deepEqual(parse('"line1\rline2",b'), [['line1\rline2','b']]);
});

test('escaped quote inside quoted field', () => {
  assert.deepEqual(parse('"say ""hi""",b'), [['say "hi"','b']]);
});

test('empty quoted field', () => {
  assert.deepEqual(parse('"",b'), [['','b']]);
});

test('quoted field at start of row', () => {
  assert.deepEqual(parse('"hello",world'), [['hello','world']]);
});

test('quoted field at end of row', () => {
  assert.deepEqual(parse('hello,"world"'), [['hello','world']]);
});

test('all fields quoted', () => {
  assert.deepEqual(parse('"a","b","c"'), [['a','b','c']]);
});

// ─── Parse: line endings ───
test('CRLF line endings', () => {
  assert.deepEqual(parse('a,b\r\nc,d'), [['a','b'],['c','d']]);
});

test('CR line endings', () => {
  assert.deepEqual(parse('a,b\rc,d'), [['a','b'],['c','d']]);
});

test('LF line endings', () => {
  assert.deepEqual(parse('a,b\nc,d'), [['a','b'],['c','d']]);
});

test('mixed line endings', () => {
  assert.deepEqual(parse('a,b\r\nc,d\ne,f'), [['a','b'],['c','d'],['e','f']]);
});

// ─── Parse: edge cases ───
test('trailing newline', () => {
  assert.deepEqual(parse('a,b\n'), [['a','b']]);
});

test('trailing CRLF', () => {
  assert.deepEqual(parse('a,b\r\n'), [['a','b']]);
});

test('multiple trailing newlines with skipEmptyLines', () => {
  assert.deepEqual(parse('a,b\n\nc,d\n\n', { skipEmptyLines: true }), [['a','b'],['c','d']]);
});

test('empty lines preserved by default', () => {
  assert.deepEqual(parse('a,b\n\nc,d'), [['a','b'],[''],['c','d']]);
});

test('empty fields', () => {
  assert.deepEqual(parse('a,,c'), [['a','','c']]);
});

test('leading/trailing whitespace preserved', () => {
  assert.deepEqual(parse(' a , b '), [[' a ',' b ']]);
});

test('whitespace-only fields', () => {
  assert.deepEqual(parse(' , '), [[' ',' ']]);
});

// ─── Parse: custom delimiters ───
test('semicolon delimiter', () => {
  assert.deepEqual(parse('a;b;c', { delimiter: ';' }), [['a','b','c']]);
});

test('tab delimiter (TSV)', () => {
  assert.deepEqual(parse('a\tb\tc', { delimiter: '\t' }), [['a','b','c']]);
});

test('pipe delimiter', () => {
  assert.deepEqual(parse('a|b|c', { delimiter: '|' }), [['a','b','c']]);
});

// ─── Parse: error cases ───
test('multi-char delimiter throws', () => {
  assert.throws(() => parse('a,b', { delimiter: ';;' }), /single character/);
});

test('same delimiter and quote throws', () => {
  assert.throws(() => parse('a,b', { delimiter: '|', quote: '|' }), /must differ/);
});

test('non-string input throws TypeError', () => {
  assert.throws(() => parse(null), /must be a string/);
  assert.throws(() => parse(123), /must be a string/);
  assert.throws(() => parse(undefined), /must be a string/);
});

// ─── BOM stripping ───
test('UTF-8 BOM stripped from input', () => {
  const bom = '\uFEFF';
  assert.deepEqual(parse(bom + 'a,b\nc,d'), [['a','b'],['c','d']]);
});

test('BOM with quoted fields', () => {
  const bom = '\uFEFF';
  assert.deepEqual(parse(bom + '"hello",world'), [['hello','world']]);
});

test('BOM with parseObjects', () => {
  const bom = '\uFEFF';
  assert.deepEqual(parseObjects(bom + 'name,age\nAlice,30'), [{ name: 'Alice', age: '30' }]);
});

test('no BOM in middle of data is preserved', () => {
  // BOM char in the middle of content is a regular character
  assert.deepEqual(parse('a,\uFEFFb'), [['a','\uFEFFb']]);
});

// ─── parseObjects ───
test('parseObjects basic', () => {
  const csv = 'name,age\nAlice,30\nBob,25';
  assert.deepEqual(parseObjects(csv), [
    { name: 'Alice', age: '30' },
    { name: 'Bob', age: '25' },
  ]);
});

test('parseObjects missing field', () => {
  const csv = 'a,b,c\n1,2';
  assert.deepEqual(parseObjects(csv), [{ a: '1', b: '2', c: '' }]);
});

test('parseObjects extra field', () => {
  const csv = 'a,b\n1,2,3';
  assert.deepEqual(parseObjects(csv), [{ a: '1', b: '2' }]);
});

test('parseObjects empty input', () => {
  assert.deepEqual(parseObjects(''), []);
});

test('parseObjects with quoted headers', () => {
  const csv = '"first name","last name"\n"John","Doe"';
  assert.deepEqual(parseObjects(csv), [{ 'first name': 'John', 'last name': 'Doe' }]);
});

test('parseObjects duplicate headers collected into array', () => {
  const csv = 'name,phone,name\nAlice,555,Alice2';
  const result = parseObjects(csv);
  assert.equal(result[0].name[0], 'Alice');
  assert.equal(result[0].name[1], 'Alice2');
  assert.equal(result[0].phone, '555');
});

test('parseObjects only header row', () => {
  assert.deepEqual(parseObjects('a,b,c'), []);
});

test('parseObjects skipEmptyLines', () => {
  const csv = 'a,b\n\n1,2';
  assert.deepEqual(parseObjects(csv, { skipEmptyLines: true }), [{ a: '1', b: '2' }]);
});

// ─── Stringify ───
test('stringify simple', () => {
  assert.equal(stringify([['a','b'],['1','2']]), 'a,b\n1,2\n');
});

test('stringify empty rows', () => {
  assert.equal(stringify([]), '');
});

test('stringify field with delimiter', () => {
  assert.equal(stringify([['a,b','c']]), '"a,b",c\n');
});

test('stringify field with quote', () => {
  assert.equal(stringify([['say "hi"','b']]), '"say ""hi""",b\n');
});

test('stringify field with newline', () => {
  assert.equal(stringify([['line1\nline2','b']]), '"line1\nline2",b\n');
});

test('stringify field with CR', () => {
  assert.equal(stringify([['line1\rline2','b']]), '"line1\rline2",b\n');
});

test('stringify numbers converted to strings', () => {
  assert.equal(stringify([[1, 2.5]]), '1,2.5\n');
});

test('stringify null becomes empty', () => {
  assert.equal(stringify([[null, 'b']]), ',b\n');
});

test('stringify undefined becomes empty', () => {
  assert.equal(stringify([[undefined, 'b']]), ',b\n');
});

test('stringify custom delimiter', () => {
  assert.equal(stringify([['a','b']], { delimiter: ';' }), 'a;b\n');
});

test('stringify custom EOL', () => {
  assert.equal(stringify([['a','b']], { eol: '\r\n' }), 'a,b\r\n');
});

test('stringify single row', () => {
  assert.equal(stringify([['a','b','c']]), 'a,b,c\n');
});

test('stringify no escaping needed', () => {
  assert.equal(stringify([['hello','world']]), 'hello,world\n');
});

test('stringify empty array in row', () => {
  assert.equal(stringify([[]]), '\n');
});

test('stringify boolean values', () => {
  assert.equal(stringify([[true, false]]), 'true,false\n');
});

test('stringify zero and empty string', () => {
  assert.equal(stringify([[0, '']]), '0,\n');
});

test('stringify custom quote char', () => {
  assert.equal(stringify([['a,b','c']], { quote: "'" }), "'a,b',c\n");
});

// ─── stringifyObjects ───
test('stringifyObjects basic', () => {
  const csv = stringifyObjects([{ a: '1', b: '2' }]);
  assert.equal(csv, 'a,b\n1,2\n');
});

test('stringifyObjects column order', () => {
  const csv = stringifyObjects(
    [{ a: '1', b: '2' }],
    { columns: ['b', 'a'] }
  );
  assert.equal(csv, 'b,a\n2,1\n');
});

test('stringifyObjects missing key', () => {
  const csv = stringifyObjects([{ a: '1' }], { columns: ['a', 'b'] });
  assert.equal(csv, 'a,b\n1,\n');
});

test('stringifyObjects empty', () => {
  assert.equal(stringifyObjects([]), '');
});

test('stringifyObjects with special chars', () => {
  const csv = stringifyObjects([{ name: 'John "JD" Doe' }]);
  assert.equal(csv, 'name\n"John ""JD"" Doe"\n');
});

test('stringifyObjects with column selection', () => {
  const csv = stringifyObjects(
    [{ a: '1', b: '2', c: '3' }],
    { columns: ['a', 'c'] }
  );
  assert.equal(csv, 'a,c\n1,3\n');
});

test('stringifyObjects numeric values', () => {
  const csv = stringifyObjects([{ x: 10, y: 20.5 }]);
  assert.equal(csv, 'x,y\n10,20.5\n');
});

// ─── Round-trip ───
test('round-trip parse → stringify → parse', () => {
  const original = [['name','age','"note"'],['Alice','30','likes "cats"'],['Bob','25','naïve']];
  const csv = stringify(original);
  const reparsed = parse(csv);
  assert.deepEqual(reparsed, original);
});

test('round-trip objects', () => {
  const original = [
    { name: 'Alice', city: 'New York' },
    { name: 'Bob', city: 'Los Angeles, CA' },
  ];
  const csv = stringifyObjects(original);
  const reparsed = parseObjects(csv);
  assert.deepEqual(reparsed, original);
});

test('round-trip with semicolon delimiter', () => {
  const original = [['a;b','c'],['1;2','3']];
  const csv = stringify(original, { delimiter: ';' });
  const reparsed = parse(csv, { delimiter: ';' });
  assert.deepEqual(reparsed, original);
});

test('round-trip with tab delimiter', () => {
  const original = [['col1\tinner','col2'],['val1','val2\textra']];
  const csv = stringify(original, { delimiter: '\t' });
  const reparsed = parse(csv, { delimiter: '\t' });
  assert.deepEqual(reparsed, original);
});

test('round-trip objects with BOM', () => {
  const original = [
    { name: 'Alice', city: 'NYC' },
    { name: 'Bob', city: 'LA' },
  ];
  const csv = '\uFEFF' + stringifyObjects(original);
  const reparsed = parseObjects(csv);
  assert.deepEqual(reparsed, original);
});

// ─── Real-world RFC 4180 examples ───
test('RFC 4180 example with trailing spaces', () => {
  assert.deepEqual(parse('a, b ,c'), [['a',' b ','c']]);
});

test('RFC 4180 last field without newline', () => {
  assert.deepEqual(parse('a,b,c\n1,2,3'), [['a','b','c'],['1','2','3']]);
});

test('field that is only a quote char (unquoted)', () => {
  assert.deepEqual(parse('a,b'), [['a','b']]);
});

test('quoted field followed by non-delimiter', () => {
  assert.deepEqual(parse('"abc"def,b'), [['abcdef','b']]);
});

// ─── Large input ───
test('10K row CSV', () => {
  const rows = [];
  for (let i = 0; i < 10000; i++) rows.push([String(i), `name${i}`, String(i * 2)]);
  const csv = stringify(rows);
  const reparsed = parse(csv);
  assert.equal(reparsed.length, 10000);
  assert.deepEqual(reparsed[9999], ['9999', 'name9999', '19998']);
});

// ─── CLI version flag ───
test('CLI --version outputs version', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
  const output = execFileSync('node', ['cli.js', '--version'], { encoding: 'utf-8' }).trim();
  assert.equal(output, pkg.version);
});

test('CLI -V outputs version', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
  const output = execFileSync('node', ['cli.js', '-V'], { encoding: 'utf-8' }).trim();
  assert.equal(output, pkg.version);
});

test('CLI parse from stdin', () => {
  const output = execFileSync('node', ['cli.js', 'parse'], {
    input: 'a,b\n1,2',
    encoding: 'utf-8',
  });
  assert.deepEqual(JSON.parse(output), [['a','b'],['1','2']]);
});

test('CLI parse-objects from stdin', () => {
  const output = execFileSync('node', ['cli.js', 'parse-objects'], {
    input: 'name,age\nAlice,30',
    encoding: 'utf-8',
  });
  assert.deepEqual(JSON.parse(output), [{ name: 'Alice', age: '30' }]);
});

test('CLI stringify from stdin', () => {
  const output = execFileSync('node', ['cli.js', 'stringify'], {
    input: '[["a","b"],["1","2"]]',
    encoding: 'utf-8',
  });
  assert.equal(output.trim(), 'a,b\n1,2');
});

test('CLI --delimiter option', () => {
  const output = execFileSync('node', ['cli.js', 'parse', '-', '--delimiter', ';'], {
    input: 'a;b;c',
    encoding: 'utf-8',
  });
  assert.deepEqual(JSON.parse(output), [['a','b','c']]);
});;

// ─── Stress: deeply nested quotes ───
test('multiple escaped quotes in one field', () => {
  assert.deepEqual(parse('"""a""b""c"""'), [['"a"b"c"']]);
});

test('field with only escaped quotes', () => {
  assert.deepEqual(parse('""""""'), [['""']]);
});

test('quoted empty rows', () => {
  assert.deepEqual(parse('"","",""\n"a","b","c"'), [['','',''],['a','b','c']]);
});

// ─── Unicode ───
test('unicode characters in fields', () => {
  assert.deepEqual(parse('héllo,wörld'), [['héllo','wörld']]);
});

test('emoji in fields', () => {
  assert.deepEqual(parse('🎉,🎊'), [['🎉','🎊']]);
});

test('CJK characters', () => {
  assert.deepEqual(parse('你好,世界'), [['你好','世界']]);
});

test('quoted field with unicode', () => {
  assert.deepEqual(parse('"héllo,世界",b'), [['héllo,世界','b']]);
});
