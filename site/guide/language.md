# Language at a glance

The five things to know.

## 1. Every declaration is a kinded block

```box
kind("name") {
  field = value
  child("name") {
    ...
  }
}
```

The kind (`http`, `cli`, `package`, `route`, …) is registered by a
plugin (or the core, for `package`). The name in parens is the local
identifier. The body is multi-line.

## 2. Defaults are nameless

Drop the `(name)` to mark a block as the project default for that kind:

```box
i18n {
  locales = ["en", "zh"]
  default = "en"
}
```

At most one nameless block per kind in the entire project. Plugin
functions like `t(...)` use the default.

## 3. Imports are always namespaced

```box
import "./schema.box"               // → schema.User, schema.User[]
import "../auth/index.box"          // → auth.X        (parent dir)
import "../user-service/index.box" as users
```

No form pulls names into the root scope. Use `export "./file.box"` to
re-export through a facade.

## 4. Translation calls are real function calls

```box
description = t("cli.init.description", version = package.box.version)
```

`t(...)` is plugin-whitelisted (from `@box/i18n`). Other plugin
functions can be registered the same way, but there's no general
expression language — no `if`, no `for`, no string interpolation.

## 5. The file is the visibility boundary

Everything declared in a `.box` file is visible to importers. No
per-declaration `export`/`pub`. To hide something, put it in its own
file that only specific files import.

## See also

- The full [SPEC.md](https://github.com/adi-family/box/blob/main/SPEC.md)
- Plugin specs: [`@box/http`](https://github.com/adi-family/box/blob/main/specs/http.md), [`@box/i18n`](https://github.com/adi-family/box/blob/main/specs/i18n.md)
- The self-host: [box/box/](https://github.com/adi-family/box/tree/main/box/box) — Box describes its own surface in Box
