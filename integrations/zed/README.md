# Box — Zed extension

Syntax highlighting and language config for `.box` files in Zed.

## How it works

Zed requires the grammar in `extension.toml` to reference a git repo
that contains `src/parser.c` already committed (Zed clones, compiles).
There is **no** TOML-only way to bundle a precompiled WASM in a Zed
extension — that's why the previous "drop `[grammars.box]` + ship a
WASM" attempt failed silently with no highlighting.

For local development we use a **file:// URL** pointing at the in-repo
grammar at `../../grammars/tree-sitter-box/`, which is itself a tiny
local git repo. Zed clones from `file://...` just like any other git
remote.

## Install (dev)

```bash
# 1. (once) Generate the parser and commit it inside the grammar repo.
make commit-grammar

# 2. Paste the printed SHA into extension.toml under [grammars.box].
#    Already pre-filled with the current SHA.

# 3. In Zed:
#    Command Palette → "zed: install dev extension" → pick this folder.
```

`make commit-grammar` calls `tree-sitter generate` then `git commit`s
the regenerated `src/` in the grammar repo. The new commit SHA is
printed at the end so you can paste it into `extension.toml`.

The first install does the full clone + C compile inside Zed; expect
a few seconds. After that, `.box` files should highlight.

## Modifying the grammar

When you change `grammars/tree-sitter-box/grammar.js`:

```bash
make commit-grammar      # regenerate + commit + print new SHA
make copy-queries        # if you also edited *.scm files
# Then update [grammars.box].commit in extension.toml with the new SHA.
# Reload the dev extension in Zed.
```

## Layout

```
integrations/zed/
├── extension.toml           # extension manifest (points at grammar via file://)
├── Makefile                 # `make commit-grammar`, `make copy-queries`
└── languages/
    └── box/
        ├── config.toml      # .box file association, brackets, comments
        ├── highlights.scm   # syntax highlighting queries
        ├── brackets.scm
        └── indents.scm
```

The tree-sitter grammar source lives at `../../grammars/tree-sitter-box/`.

## Switching to a published grammar later

Once the grammar is hosted on GitHub (or similar):

```toml
[grammars.box]
repository = "https://github.com/<org>/<repo>"
commit     = "<real-sha>"
```

Drop the file:// URL. Nothing else changes.

## Troubleshooting

**Files show grey, no highlighting** — extension loaded but grammar
failed silently. Causes:

- `[grammars.box]` is missing from `extension.toml`. Zed cannot load
  a bundled WASM in a TOML-only extension; the grammars block is
  required.
- The `commit` SHA in `extension.toml` doesn't exist in the referenced
  repo. Run `make print-sha` to see the current HEAD of the grammar
  repo, paste it in.
- `path_suffixes` in `languages/box/config.toml` doesn't include
  `"box"` (no leading dot).

**"Failed to compile grammar 'box'"** — Zed found the grammar but
couldn't compile its C. Causes:

- `src/parser.c` isn't in the commit you referenced. Run
  `make generate` then `make commit-grammar` to regenerate and commit.
- The grammar.js has a syntax error. Run `cd ../../grammars/tree-sitter-box
  && npx tree-sitter generate` directly and read the error.

**"Failed to clone repository"** — the `repository` URL in
`extension.toml` is wrong. For local dev the file:// URL must point at
a directory that's a git repo (has `.git/`). For a remote it must be
a clonable URL.
