# tree-sitter-box

Tree-sitter grammar for the [Box language](../../SPEC.md).

Used by editor integrations under `../../integrations/` (currently:
Zed).

## Layout

```
tree-sitter-box/
├── grammar.js          # grammar definition (source of truth)
├── package.json        # tree-sitter & npm metadata
├── queries/
│   ├── highlights.scm  # syntax highlighting
│   ├── brackets.scm    # bracket pairs
│   └── indents.scm     # indentation rules
└── src/                # generated (parser.c) — produced by `tree-sitter generate`
```

## Generate the parser

```bash
npm install
npx tree-sitter generate
npx tree-sitter parse ../../box/box/index.box
```

## Test against the dogfood files

```bash
for f in ../../box/box/*.box; do
  echo "$f:"
  npx tree-sitter parse "$f"
done
```

## Status

Draft v0.1 — covers core grammar (kind blocks, fields, function calls,
operation signatures, declarations) for syntax highlighting. Not yet
exhaustive against `SPEC.md` v0.13 — see grammar.js comments.
