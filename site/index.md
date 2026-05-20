---
layout: home

hero:
  name: Box
  text: Schemas and surfaces, declared.
  tagline: Compose/Flutter-style DSL with plugin-extensible kinds.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/adi-family/box

features:
  - title: Schemas are first-class
    details: |
      Inherited from TypeSpec. Models, enums, and type aliases live at file
      scope. Plugins validate them at parse time — no deferred surprises.
  - title: Plugin-extensible kinds
    details: |
      The core grammar is fixed. Plugins claim kinds — `http`, `mcp`, `i18n`,
      `target` — each with its own schema. New plugins ship as standalone
      binaries via JSON-RPC.
  - title: One block shape, everywhere
    details: |
      `kind("name") { field = value; child { ... } }`. Reads like Compose
      or Flutter. No hidden expression language; no inheritance.
  - title: Multi-surface
    details: |
      Declare HTTP routes, MCP tools, code generation targets, and i18n
      configuration in the same project — each as a separate kinded block.
---

## Quick taste

```box
use "@box/http"
use "@box/i18n"
import "./i18n.box"

http("user-api") {
  basePath = "/v1"

  route("/users") {
    get  = list(): User[]
    post = create(req: CreateUserRequest): User
  }
}

cli("main") {
  command("init") {
    description = t("cli.init.description")
  }
}

model User {
  id:    string
  email: string
}
```
