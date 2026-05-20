---
layout: page
title: Box
sidebar: false
aside: false
---

<HeroBox
  title="BOX"
  tagline="唯一真相来源。就这样。"
  :features='["无限可扩展", "无限组合", "无限可移植"]'
  :eyebrow='{ text: "草案 v0.13 · 早期开发", href: "https://github.com/adi-family/box/blob/main/SPEC-zh.md" }'
  :primary='{ text: "快速开始", href: "/box/zh/guide/getting-started" }'
  :secondary='{ text: "在 GitHub 查看", href: "https://github.com/adi-family/box" }'
/>

<Pipeline
  eyebrow="源 → 输出"
  title="一处声明,每个消费者。"
  lead="插件认领你要暴露的表层类型;目标插件生成客户端、服务端与规范。改一处源,所有消费者随之而动。"
  outputs-label="生成"
  :chip-labels='{ client: "客户端", server: "服务端", spec: "规范", tools: "工具", adi_plugin: "adi 插件" }'
>

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

<Install
  eyebrow="安装"
  title="两条命令。"
  lead="Box 以 adi cli 插件的形式发布。安装一次,然后通过 adi 命令行驱动。"
  bar-label="终端"
/>
