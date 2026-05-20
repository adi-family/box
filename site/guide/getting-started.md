# Getting started

Box is in early development (v0.13 draft spec). This guide walks through
the project layout, parsing your first `.box` file, and the Zed
extension.

## Clone the repo

```bash
git clone https://github.com/adi-family/box
cd box
```

## Repository layout

```
box/
├── SPEC.md              # core language spec
├── specs/               # per-plugin specs (http, i18n, …)
├── core/                # box-core: parser + plugin host (Rust)
├── abi/                 # box-abi-v1: plugin trait + wire types
├── cli/                 # box-cli: `box` binary
├── plugins/             # plugin binaries (box-http, box-mcp, box-i18n)
├── grammars/            # tree-sitter-box grammar
├── integrations/zed/    # Zed editor extension
├── box/                 # Box's own surface, declared in Box (dogfood)
└── site/                # this site
```

## Syntax highlighting in Zed

1. Open Zed
2. Command Palette → **zed: install dev extension**
3. Pick `integrations/zed/` from your clone

Zed clones the tree-sitter grammar from GitHub on first install
(compiles in a few seconds), then highlights any `.box` file.

## Next

- [Language at a glance](./language.md) — the grammar in 5 minutes
- [SPEC.md](https://github.com/adi-family/box/blob/main/SPEC.md) — the
  full reference
