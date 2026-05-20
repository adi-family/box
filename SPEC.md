# Box Language — Syntax Spec

> 中文版本：[SPEC-zh.md](./SPEC-zh.md)

Status: **Draft v0.13** — working document. Sections marked _Open_ are unresolved.

Box is a TypeSpec-derived schema and project-definition language. A `.box`
file is a flat sequence of **kinded declarative blocks** and schema
declarations. Blocks read like Kotlin Jetpack Compose / Flutter widgets:

```box
kind("name") {
  field = value
  child("name") { ... }
}
```

Kinds are bare keywords claimed by plugins. The parser learns `kind +
optional (name) + body` and consults plugin-supplied schemas to validate
field names, value kinds, and allowed child blocks.

Box deliberately avoids the parts of declarative DSLs that hurt at scale:

1. **Plugins declare schemas for their kinds.** Field validation happens
   at parse time, not deferred to plugin resolution.
2. **No general expression language.** Values are literals, identifiers,
   cross-block field refs, arrays, and plugin-whitelisted named function
   calls (such as `t(...)` from `@box/i18n`). No `if`, no `for`, no
   arithmetic, no string interpolation.
3. **No inheritance, overlay, or merge.** Every value is one declaration
   away.

---

## 1. File structure

- File extension: `.box`
- Conventional entry of a directory-package: `index.box`
- Encoding: UTF-8
- Comments: `// line` and `/* block */`

A `.box` file contains, in order:

1. Zero or more `use` statements (plugin loading)
2. Zero or more `import` statements (composition — local use)
3. Zero or more `export` statements (composition — re-export)
4. Zero or more **kind blocks** (configuration units)
5. Zero or more **schema declarations** at file scope (`model`, `enum`,
   type aliases)

No block is required. A file may be schema-only, config-only, or both.
There is no file-level "root."

---

## 2. Kind block

### Shape

```box
kind("name") {
  field = value
  field = value
  child("name") {
    ...
  }
  child {
    ...
  }
}
```

- **Kind**: bare identifier (`cli`, `http`, `route`, `package`, …)
  claimed by a plugin via `use`. The core provides `package`. No quotes.
- **Name**: optional positional string in parens. Required by some kinds
  (`route("/users")`), absent for kinds that don't need disambiguation
  (`auth { ... }`).
- **Body**: brace-delimited, always multi-line. Contains field
  assignments and/or child blocks in any order.

### Field assignment

```
field_name = value
```

- One field per line.
- `=` is required.
- Right side is a [value](#7-values).
- Unknown field names → parse-time error (per plugin schema).

### Child block

```
child_kind("name") {
  ...
}

child_kind {
  ...
}
```

A child block is just another kind block, nested inside its parent. The
plugin defines which child kinds are allowed inside each parent kind, and
whether each child kind requires/forbids a name.

### Constraints

- Block bodies are always multi-line: `{` ends a line, `}` starts a line,
  each field or child is on its own line. Single-line bodies
  (`http("x") { basePath = "/v1" }`) are not allowed.
- Within a file's root scope, `(kind, name)` pairs must be unique.
- Within a single parent body, `(child_kind, child_name)` pairs must be
  unique.
- A kind that doesn't accept a name must not be invoked with one
  (`auth("x") { ... }` → parse error if the plugin schema says `auth`
  takes no name).

### Default (nameless) instances

Any kind may be invoked **with** or **without** a name. The nameless
form is the kind's **default instance**:

```box
i18n { ... }            // default instance of i18n
http("public") { ... }  // a named instance of http
http { ... }            // default instance of http (also allowed)
```

Parser rules — automatic, no schema attribute required:

- **At most one nameless instance per kind per project.** Two `i18n { }`
  blocks anywhere in the importable graph is a parse-time error.
- **Importers must wire up via `import`.** If a file uses any plugin
  feature that depends on a default instance (e.g. `t(...)` which uses
  the `i18n` default), the file must directly `import` the file
  containing that default. Transitive imports do not count.

Whether named instances are *useful* for a given kind is a plugin
concern. For some kinds (`http`, `route`) names are essential. For
others (`i18n`) the nameless default is the only form anyone uses, and
the plugin's `validate()` may reject named instances.

### Example

```box
use "@box/http"
use "@box/codegen"

package("box") {
  version = "0.1.0"
}

http("user-api") {
  basePath = "/v1"

  route("/users") {
    get  = list(): User[]
    post = create(req: CreateUserRequest): User
  }

  route("/users/{id}") {
    get    = get(id: string): User
    put    = update(id: string, req: UpdateUserRequest): User
    delete = delete(id: string): void
  }

  auth {
    type     = bearer
    audience = "admin-tools"
  }
}

target("python") {
  language = python
  side     = both
  out      = "./gen/py"
}

model User {
  id:    string
  email: string
}
```

---

## 3. Plugins — `use`

```box
use "@box/http"
use "@box/codegen"
use "@acme/http" as acme
```

- `use "<package>"` loads a plugin and registers its **kind keywords** in
  this file's scope under their default names.
- `use "<package>" as <alias>` prefixes all kinds the plugin claims with
  `<alias>.` (e.g. `acme.http("...") { ... }`). Used when two plugins
  claim the same default keyword.
- Package identifiers: `@scope/name`, `name`, or local path
  (`./plugins/foo`).
- `use` is **file-local**. Each file declares the plugins it directly
  uses; it does not inherit from imports.

`use` loads the plugin's **grammar** (so that kind keywords and
plugin-whitelisted functions like `t(...)` are recognized in this file).
It does **not** wire up instances. For plugin functions whose schema
declares a dependency on a default instance of some kind (§2), the file
must additionally `import` the file containing that default. The parser
rejects use of a plugin's features without both: the `use` (grammar)
and the `import` (instance).

Each plugin contributes one or more kinds. For each kind it claims, the
plugin provides a **kind schema** (see §6) used at parse time.

---

## 4. Module composition — `import` and `export`

### Local use — `import`

```box
import "./schema.box"                  // → schema.X
import "../auth/index.box"             // → auth.X    (parent dir, since file is index.box)
import "../user-service/index.box" as users
```

- `import "<path>"` pulls all file-scope schema declarations of another
  `.box` file under an **automatic namespace alias**:
  - If the file is `index.box`, the alias is the parent directory name.
  - Otherwise, the alias is the filename without extension.
- `import "<path>" as <alias>` overrides the automatic alias.
- Imports are always namespaced; there is no form that pulls names into
  the root scope.
- Alias collisions across imports are a parse-time error.

### Re-export — `export`

```box
export "./schema.box"               // flat re-export
export "./schema.box" as types      // re-export under sub-namespace
```

- `export "<path>"` makes the file-scope schema declarations of another
  `.box` file visible to importers of **this** file, **flattened** into
  this file's namespace as if declared here.
- `export "<path>" as <alias>` re-exports under a sub-namespace.
- Independent of `import`. Use either, both, or neither per file.
- Flat-export name collisions are a parse-time error.
- Circular re-export is a parse-time error.

`import` is for **schema composition**. `use` is for **plugin loading**.
Not interchangeable.

---

## 5. Declarations (at file scope)

Declaration syntax is inherited from TypeSpec:

```box
model User {
  id:     string
  name:   string
  email?: string
}

enum Status {
  active,
  inactive,
}
```

Supported: `model`, `enum`, type aliases, and decorators inherited from
TypeSpec (transport-agnostic only — `@doc`, `@deprecated`, etc.). HTTP /
MCP / transport-specific decorators are not allowed on file-scope
declarations.

`interface` declarations are not used. Operations are defined inline
within the kind block that exposes them (e.g. inside a `route(...)`
body as field-assigned operation signatures — see §7).

Declaration bodies are always multi-line. The visibility unit is the
file: everything declared in a `.box` file is visible to any file that
`import`s it. There is no per-declaration `export` modifier.

---

## 6. Kinds and kind schemas

### Kind registration

A plugin claims one or more **kind keywords** at load time. For each
kind, the plugin provides a **kind schema** describing:

- The set of allowed field names, each with its accepted value kind(s)
  and requiredness
- The set of allowed child block kinds, with cardinality and (optional)
  naming rules per child
- The set of plugin-whitelisted **named functions** valid in this kind's
  field values (e.g. `t(...)` accepted by `description` fields when
  `@box/i18n` is loaded). Each function may declare a dependency on the
  default instance of some kind — the parser then requires the using
  file to `import` the file containing that default (§2).

The kind schema does **not** declare singleton-ness or whether a name is
required. Both `kind { ... }` and `kind("name") { ... }` are
syntactically valid for any kind; the at-most-one-default rule (§2) is
automatic. Plugins enforce semantic constraints (e.g. "named instances
are meaningless for `i18n`") in their `validate()` step.

The parser is plugin-aware: it loads `use`-declared plugins, then uses
their schemas to validate kind blocks **during parse**. Unknown fields,
unknown child kinds, wrong-typed values, or missing required fields are
parse-time errors.

This is a deliberate departure from HCL/Terraform, where schema validation
is deferred. Schema is a first-class language concern in Box.

### Illustrative kinds (not normative)

| Kind | Plugin | Spec | Purpose |
|---|---|---|---|
| `package` | core | _(this spec)_ | package metadata — name, version, description |
| `http` | `@box/http` | [`specs/http.md`](specs/http.md) | HTTP surface — basePath, routes, auth |
| `mcp` | `@box/mcp` | TBD | MCP server — tools, resources, prompts |
| `target` | `@box/codegen` | TBD | output configuration — language, side, output dir |
| `cli` | `@box/cli` | TBD | CLI command surface |
| `i18n` | `@box/i18n` | [`specs/i18n.md`](specs/i18n.md) | translation/localization service |

Per-plugin grammar lives in each plugin's spec file under `specs/`.

---

## 7. Values

Field values are limited to:

| Form | Example |
|---|---|
| String | `"hello"` |
| Number | `42`, `3.14` |
| Boolean | `true`, `false` |
| Null | `null` |
| Identifier | `python`, `User`, `bearer` |
| Cross-block field ref | `package.box.version` |
| Array | `[1, 2, 3]`, `[User, Admin]` |
| Plugin-whitelisted function call | `t("cli.init.description", version = "0.1.0")` |
| Operation signature | `list(): User[]`, `create(req: CreateUserRequest): User` |

### Identifiers

Identifiers refer to names in scope: imported schema declarations
(`User`), enum-like values defined by a plugin (`python` for a `language`
field, `bearer` for `type`), or local schema declarations from the same
file.

### Cross-block field references

`<kind>.<name>.<field>` — read the value of a field from another kind
block in the same file. Example: `package.box.version` reads the
`version` field of `package("box")`.

The referenced field must be a literal-valued field (string, number,
bool). Self-references (a block referencing its own field) are allowed.

### Named function calls (plugin-whitelisted)

```
function_name(<positional>, <named> = <value>, ...)
```

- Plugin-defined functions only. The plugin declares each function it
  exposes and which kind fields accept it as a value.
- Mix of positional and named args (Kotlin/Python order rules: all
  positionals first, then named).
- May span multiple lines:
  ```
  description = t(
    "cli.main.description",
    version = package.box.version,
    edition = "2026",
  )
  ```
- Trailing comma allowed.
- Function calls **cannot** appear in arbitrary positions; only where a
  plugin schema specifies the field accepts a function-call value.

**Not a general expression language.** Available functions are a small,
plugin-curated set. The first defined one is `t()` from `@box/i18n`.

### Operation signatures

```
<name>(<params>): <return-type>
```

A function-like declaration as a value. Used as the right-hand side of
method-keyword assignments inside HTTP routes (and similar shapes in
other surface kinds):

```box
route("/users") {
  get  = list(): User[]
  post = create(req: CreateUserRequest): User
}
```

Whether this value form is accepted is per kind-schema. Most fields do
**not** accept operation signatures.

### Not supported

- String interpolation (`"${x}"`)
- Conditionals (`if`, ternary)
- Loops (`for`, `for_each`)
- Arithmetic (`+`, `*`)
- Arbitrary function calls
- Map/object literals (_Open — may be added if needed_)

---

## 8. Composition restrictions

Box has no inheritance, overlay, or merge mechanism for kind blocks. No
`extends`, no `override`, no `with`, no deep-merge of bodies.

Rationale: from [CUE's design][cue-talk] — once values can be overridden
across layers, "where did this value come from" requires traversing the
entire override chain. Box keeps every value one declaration away.

Composition is via:

- `import` / `export` (pulls schema declarations across files; no merging)
- Cross-block field references (`<kind>.<name>.<field>`)

[cue-talk]: https://www.infoq.com/presentations/cue-configuration/

---

## 9. Lexical conventions

- **Identifiers:** `[A-Za-z_][A-Za-z0-9_-]*` (kebab and snake both
  allowed; convention: kebab for plugin-defined enum-like values, snake
  or camelCase for field names, PascalCase for models).
- **String literals:** double-quoted, with `\"` and `\\` escapes.
  _Open: triple-quoted, raw strings, multi-line._
- **Statement terminators:** none. Newlines and braces are the
  delimiters. `;` is not a separator.
- **Field assignment requires `=`.** No alternative form.
- **Function calls use parentheses**, comma-separated args, trailing
  comma allowed.
- **Reserved keywords:** `use`, `import`, `export`, `as`, `true`,
  `false`, `null`, plus TypeSpec declaration keywords (`model`, `enum`,
  etc.). Kind names (`http`, `cli`, `package`, …) are **not** reserved
  keywords — they are plugin-claimed identifiers, scoped per-file by
  `use`.

---

## 10. Open questions

Resolve before freezing v1.0.

1. **Operation signatures inside other surfaces.** HTTP uses `get =
   list(): User[]` shape. Does `mcp("tools") { tool("get_user") { ... } }`
   express tools the same way? Per-surface decision.
2. **Plugin-registered functions.** Confirm mechanism: plugin declares
   functions in kind schema, parser allows them in specified fields only.
   Specify discovery/registration in `box-abi-v1`.
3. **Trailing commas everywhere.** Allowed in function args; allow
   everywhere (arrays, etc.)?
4. **String extensions.** Triple-quoted, raw strings, multi-line.
5. **Map/object literals.** Are they needed for any plugin kind, or do
   named function args + child blocks cover all cases?
6. **Transitive imports.** If `a.box` imports `b.box`, and `c.box`
   imports `a.box`, does `c.box` see `b.box`'s declarations? Default:
   no. Same default for singleton wiring: the singleton's file must be
   directly imported, not reached transitively.
10. **Cross-block field references and project-scope visibility.**
    `package.box.version` references a field defined in another file
    without that file being imported. Is project-wide visibility right,
    or should cross-block refs also require an explicit import? Trade-off:
    explicit imports = one-jump provenance for refs too, but causes
    awkward shapes (cli.box would need to import the file holding
    `package("box")`).
7. **Registry/resolution for `use` and `import`.** Local paths,
   workspace, remote registry — naming and lookup order.
8. **Comment placement constraints.** Block comments inside function
   arg lists, between fields, etc.
9. **TypeSpec compatibility.** Strict superset vs. dialect.

---

## 11. Examples

### Single-file project

```box
use "@box/http"
use "@box/codegen"

package("hello") {
  version = "0.1.0"
}

http("api") {
  basePath = "/v1"

  route("/hello") {
    post = hello(body: Greeting): Greeting
  }
}

target("python") {
  language = python
  side     = server
  out      = "./gen/py"
}

model Greeting {
  message: string
}
```

### Multiple kinds of the same root keyword

```box
use "@box/http"

http("public") {
  basePath = "/v1"

  route("/users") {
    get = list(): User[]
  }
}

http("admin") {
  basePath = "/admin/v1"

  route("/users") {
    get = list(): User[]
  }
  route("/audit") {
    get = audit(): User[]
  }

  auth {
    type     = bearer
    audience = "admin-tools"
  }
}

model User {
  id: string
}
```

### Multi-file composition

```
boxes/user-service/
├── index.box       # package + targets + facade
├── schema.box      # shared models
├── http.box        # HTTP surface
└── mcp.box         # MCP surface
```

```box
// boxes/user-service/schema.box

model User {
  id:    string
  email: string
  name?: string
}

model CreateUserRequest {
  email: string
  name?: string
}
```

```box
// boxes/user-service/http.box
use "@box/http"
import "./schema.box"

http("user-api") {
  basePath = "/v1"

  route("/users") {
    get  = list(): schema.User[]
    post = create(req: schema.CreateUserRequest): schema.User
  }
  route("/users/{id}") {
    get = get(id: string): schema.User
  }
}
```

```box
// boxes/user-service/mcp.box
use "@box/mcp"
import "./schema.box"

mcp("user-tools") {
  tool("get_user") {
    description = "Fetch a user by ID"
    input       = GetUserInput
    output      = schema.User
  }
  tool("create_user") {
    description = "Create a new user"
    input       = schema.CreateUserRequest
    output      = schema.User
  }
}

model GetUserInput {
  id: string
}
```

```box
// boxes/user-service/index.box
use "@box/codegen"
import "./schema.box"
import "./http.box"
import "./mcp.box"

export "./schema.box"

package("user-service") {
  version     = "0.1.0"
  description = "User accounts API"
}

target("python") {
  language = python
  side     = both
  out      = "./generated/py"
  package  = "user_service"
}

target("typescript") {
  language = typescript
  side     = client
  out      = "./generated/ts"
}
```

### Cross-package import with aliasing

```box
// boxes/api-gateway/index.box
use "@box/http"
import "../user-service/schema.box" as users
import "../auth/schema.box"         as auth

http("gateway") {
  basePath = "/v1"

  route("/users") {
    get = list(): users.User[]
  }
  route("/auth/login") {
    post = login(req: auth.LoginRequest): auth.LoginResponse
  }
}
```

### Translation function call

```box
use "@box/cli"
use "@box/i18n"

package("box") {
  version = "0.1.0"
}

cli("main") {
  description = t("cli.main.description", version = package.box.version)

  command("init") {
    description = t("cli.init.description")
    arg("name") {
      description = t("cli.init.arg.name")
      required    = true
    }
  }
}
```
