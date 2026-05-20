# 语言速览

需要了解的五件事。

## 1. 所有声明都是带类型的代码块

```box
kind("name") {
  field = value
  child("name") {
    ...
  }
}
```

类型（`http`、`cli`、`package`、`route` 等）由插件注册（或核心提供，
如 `package`）。括号内的名称是本地标识符。代码块体永远多行。

## 2. 默认实例不带名字

省略 `(name)` 即将该代码块标记为该类型的项目默认实例：

```box
i18n {
  locales = ["en", "zh"]
  default = "en"
}
```

整个项目中，每种类型至多只能有一个不带名字的实例。`t(...)` 这类插件
函数会自动使用默认实例。

## 3. 导入始终命名空间化

```box
import "./schema.box"               // → schema.User、schema.User[]
import "../auth/index.box"          // → auth.X        （父目录名）
import "../user-service/index.box" as users
```

没有任何形式可以将名称导入到根作用域。使用 `export "./file.box"`
让外部使用者透过当前文件看到被导出的声明。

## 4. 翻译调用就是真正的函数调用

```box
description = t("cli.init.description", version = package.box.version)
```

`t(...)` 由 `@box/i18n` 插件白名单注册。其它插件也可以注册自己的函数，
但不存在通用表达式语言 —— 没有 `if`、`for`、字符串插值。

## 5. 文件就是可见性边界

`.box` 文件中声明的所有内容对导入它的文件可见。不存在按声明粒度的
`export` / `pub`。若需要隐藏某个声明，把它放进一个只有特定文件会
导入的独立文件中。

## 参见

- 完整规范 [SPEC.md](https://github.com/adi-family/box/blob/main/SPEC.md)
- 插件规范：[`@box/http`](https://github.com/adi-family/box/blob/main/specs/http.md)、[`@box/i18n`](https://github.com/adi-family/box/blob/main/specs/i18n.md)
- 自举示例：[box/box/](https://github.com/adi-family/box/tree/main/box/box) —— Box 用 Box 描述了自己的表层
