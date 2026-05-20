---
layout: home

hero:
  name: Box
  text: 声明式定义模式与表层。
  tagline: Compose/Flutter 风格 DSL，支持可扩展的插件类型。
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/adi-family/box

features:
  - title: 模式即一等公民
    details: |
      继承自 TypeSpec。模型、枚举、类型别名置于文件顶层，由插件在解析时
      校验 —— 没有延迟报错的意外。
  - title: 插件可扩展类型
    details: |
      核心语法固定。插件声明类型 —— `http`、`mcp`、`i18n`、`target` ——
      每个类型有自己的 schema。插件以独立的二进制通过 JSON-RPC 协议运行。
  - title: 处处统一的代码块形态
    details: |
      `kind("name") { field = value; child { ... } }`。读起来像 Compose
      或 Flutter。没有隐藏的表达式语言；不支持继承。
  - title: 多表层
    details: |
      可在同一项目中声明 HTTP 路由、MCP 工具、代码生成目标和 i18n 配置 ——
      每个表层都是独立的类型块。
---

## 一瞥语法

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
