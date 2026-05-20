---
layout: page
title: Box
sidebar: false
aside: false
---

<HeroBox />

<Pipeline>

<template #http>

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
    delete = delete(id: string): void
  }

  auth {
    type     = bearer
    audience = "admin-tools"
  }
}
```

</template>

<template #mcp>

```box
use "@box/mcp"
import "./schema.box"

mcp("user-tools") {
  tool("get_user") {
    description = "Fetch a user by ID"
    input  = GetUserInput
    output = schema.User
  }

  tool("create_user") {
    description = "Create a new user"
    input  = schema.CreateUserRequest
    output = schema.User
  }

  tool("list_users") {
    description = "List all users"
    input  = EmptyInput
    output = schema.User[]
  }
}
```

</template>

<template #cli>

```box
use "@box/cli"
use "@box/i18n"
import "./i18n.box"

cli("main") {
  description = t("cli.main.description")

  command("init") {
    description = t("cli.init.description")
    arg("name") {
      description = t("cli.init.arg.name")
      required    = true
    }
  }

  command("build") {
    description = t("cli.build.description")
    flag("watch") {
      description = t("cli.build.flag.watch")
    }
  }
}
```

</template>

</Pipeline>

<Install />
