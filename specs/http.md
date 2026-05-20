# `@box/http` Plugin Spec

Status: **Draft v0.2** — working document.

This spec defines the `http` kind contributed by the `@box/http` plugin.
It is layered on top of the [core Box language](../SPEC.md), which uses
Kotlin Compose / Flutter-style block syntax: `kind("name") { ... }`.
Only the plugin's additions are documented here; the core rules
(multi-line bodies, no expressions, no inheritance) all apply.

---

## 1. Plugin

- Package: `@box/http`
- Kinds claimed: `http`
- Child kinds claimed (inside `http` body): `route`, `auth`
- Loaded via `use "@box/http"` in the file that uses the kind.

---

## 2. The `http` kind

### Shape

```box
use "@box/http"

http("<name>") {
  basePath = "<string>"        // optional, default "/"

  route("<path>") {
    <method> = <operation-signature>
    ...
  }

  // ...more routes

  auth {                       // optional, zero or one
    ...
  }
}
```

### Name

Required positional string. Identifies this HTTP surface within the
file. Multiple `http` blocks per file are allowed if they have distinct
names.

### Body schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `basePath` | string | no | URL prefix applied to all routes; default `/` |

### Child blocks

| Child | Cardinality | Name | Purpose |
|---|---|---|---|
| `route` | 0..n | required (path) | A path + method-to-handler map |
| `auth` | 0..1 | forbidden | Auth scheme for this `http` block |

Unknown fields or child kinds → parse-time error (per core §6).

---

## 3. The `route` child block

### Shape

```box
route("<path>") {
  <method> = <operation-signature>
  ...
}
```

- **Name (positional)**: the URL path. May contain `{<name>}`
  placeholders for path parameters.
- **Body**: one or more `<method> = <operation-signature>` field
  assignments.

### Method field names

`get`, `post`, `put`, `patch`, `delete`, `head`, `options`.

Each method may appear at most once per `route` block.

### Operation signature value

```
<operation_name>(<params>): <return-type>
```

A function-like value form. The right-hand side of every method
assignment in a `route` body. (See core §7 — operation signatures are a
value kind that some plugin schemas accept.)

- **Operation name:** identifier, unique across the entire `http` block.
- **Params:** comma-separated `<name>: <type>` pairs. Types are model
  names from file-scope declarations (`User`, `schema.User`) or
  primitives (`string`, `int32`, `bool`, etc., from TypeSpec).
- **Return type:** any type expression (model, array, primitive, `void`).

### Parameter binding (convention-based)

1. **Path parameters.** A path `{<name>}` placeholder binds to a
   parameter named `<name>` of a primitive type.
2. **Body parameter.** A single parameter of non-primitive type (a
   model) binds to the request body. At most one body parameter per
   operation.
3. **Query parameters.** Primitive parameters not matched by a path
   placeholder bind to query parameters by name.
4. **Headers.** Not bound by convention. Explicit binding TBD — see §6.

If conventions can't place a parameter unambiguously, the parser emits
an error.

### Example

```box
use "@box/http"
import "./schema.box"

http("user-api") {
  basePath = "/v1"

  route("/users") {
    get  = list(): schema.User[]
    post = create(req: schema.CreateUserRequest): schema.User
  }

  route("/users/{id}") {
    get    = get(id: string): schema.User
    put    = update(id: string, req: schema.UpdateUserRequest): schema.User
    delete = delete(id: string): void
  }

  route("/search") {
    get = search(q: string, limit: int32): schema.User[]
    //               ^path-miss  ^query
  }
}
```

In the `/search` route, `q` and `limit` are primitives unmatched by the
path, so they become query parameters: `GET /search?q=foo&limit=10`.

---

## 4. The `auth` child block

### Shape

```box
auth {
  type = <identifier>
  ...type-specific fields
}
```

### Body schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | identifier | yes | One of `bearer`, `basic`, `apikey`, `oauth2` |

### Per-type fields

#### `type = bearer`

| Field | Type | Required |
|---|---|---|
| `audience` | string | no |
| `issuer` | string | no |

#### `type = basic`

No additional fields.

#### `type = apikey`

| Field | Type | Required |
|---|---|---|
| `header` | string | yes |

#### `type = oauth2`

_Open — needs flow-specific subfields. See §6._

### Example

```box
http("admin-api") {
  basePath = "/admin"

  route("/users") {
    get = list(): User[]
  }

  auth {
    type     = bearer
    audience = "admin-tools"
  }
}
```

---

## 5. Uniqueness and identity

- **Operation names** must be unique across the entire `http` block.
- **`(method, path)` pairs** must be unique within the block.
- **`route` paths** may repeat across different `http` blocks (e.g.
  `http("public")` and `http("admin")` can both have `/users`).

---

## 6. Open questions

1. **Header binding.** Convention-only can't express headers. Form:
   a `headers { ... }` child block inside `route`? An explicit binding
   syntax in the operation signature?
2. **Explicit binding override.** When conventions are ambiguous, what's
   the syntax for forcing a parameter into a specific HTTP location?
3. **Multiple response shapes.** Error responses with distinct shapes
   (4xx, 5xx). A `responses { ... }` child block in `route`? Return-type
   union?
4. **Streaming.** SSE, chunked, WebSocket upgrades.
5. **OAuth2 flow subfields.** `flow`, `scopes`, `token_url`, etc.
6. **Path parameter constraints.** Regex, type narrowing
   (`{id:int}` style).
7. **CORS, rate limiting, middleware.** First-class or out of scope?
8. **Content negotiation.** Default `application/json` vs. explicit
   `consumes`/`produces`.
9. **Versioning.** Multiple `http` blocks with distinct `basePath`
   prefixes is the suggested pattern. Confirm.

---

## 7. Cross-reference

- Core grammar: [`../SPEC.md`](../SPEC.md)
- Other plugin specs: [`i18n.md`](i18n.md), `mcp.md` (TBD), `codegen.md` (TBD)
