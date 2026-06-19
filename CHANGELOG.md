# Changelog

## v1.1.0 — 2026-06-19

### Fixed
- Strip UTF-8 BOM (`\uFEFF`) from input — Excel and other tools prepend BOM to CSV files, causing silent parse errors with first-column header mismatches
- `parseObjects` duplicate header handling — duplicate headers now collected into arrays instead of silently overwriting
- Non-string input now throws `TypeError` with clear message

### Added
- `--version` / `-V` CLI flag
- `exports` field in package.json (clean ESM imports)
- `files` field for minimal npm publish
- `prepublishOnly` script (tests must pass before publish)
- 30 new tests (58 → 88): BOM stripping, duplicate headers, CLI version flags, CLI stdin/stdout integration, large input (10K rows), deeply nested quotes, unicode/emoji/CJK, boolean/zero/empty stringify edges, custom quote char, column selection, parseObjects edges

## v1.0.0 — 2026-06-15

### Initial release
- RFC 4180 compliant CSV parser (state machine)
- Quoted fields, escaped quotes (`""`), custom delimiters
- CR/LF/CRLF line ending support
- `parse()` → arrays, `parseObjects()` → objects with header row
- `stringify()` / `stringifyObjects()` serializer with auto-escaping
- CLI tool with `parse`, `parse-objects`, `stringify`, `stringify-objects` commands
- 58 tests covering core functionality
