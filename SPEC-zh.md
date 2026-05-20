# Box 语言 —— 语法规范

> English version (authoritative): [SPEC.md](./SPEC.md)

状态：**草案 v0.13** —— 工作文档。标注 _未定_ 的章节尚未敲定。

Box 是一个派生自 TypeSpec 的模式与项目定义语言。`.box` 文件是
**带类型的声明式代码块**（kinded declarative blocks）与模式声明的平铺序列。
代码块的写法类似 Kotlin Jetpack Compose / Flutter 的 Widget：

```box
kind("name") {
  field = value
  child("name") { ... }
}
```

类型（kind）是由插件认领的裸关键字。解析器只学习「kind +
可选 (name) + 代码块体」这一结构，并查阅插件提供的 schema 来校验字段名、
值的种类以及允许的子代码块。

Box 刻意回避了声明式 DSL 在规模化时常见的痛点：

1. **插件为它认领的类型声明 schema。** 字段校验在解析期完成，
   不会推迟到插件解析阶段。
2. **没有通用的表达式语言。** 值只能是字面量、标识符、跨代码块字段引用、
   数组，以及插件白名单内的具名函数调用（例如 `@box/i18n` 中的 `t(...)`）。
   没有 `if`、没有 `for`、没有算术、没有字符串插值。
3. **没有继承、覆盖（overlay）或合并（merge）。**
   任一值都只距离一次声明。

---

## 1. 文件结构

- 文件扩展名：`.box`
- 目录包的惯用入口文件：`index.box`
- 编码：UTF-8
- 注释：`// 行注释` 与 `/* 块注释 */`

`.box` 文件依次包含：

1. 零或多条 `use` 语句（加载插件）
2. 零或多条 `import` 语句（组合 —— 本地使用）
3. 零或多条 `export` 语句（组合 —— 再导出）
4. 零或多个**类型代码块**（配置单元）
5. 零或多条**文件作用域的模式声明**（`model`、`enum`、类型别名）

没有任何代码块是必需的。一个文件可以只包含模式、只包含配置、或两者兼有。
文件层面不存在「根」。

---

## 2. 类型代码块

### 形态

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

- **Kind**：裸标识符（`cli`、`http`、`route`、`package` …），
  通过 `use` 由某个插件认领；核心仅提供 `package`。不加引号。
- **Name**：括号内的可选位置参数字符串。某些类型必须提供
  （`route("/users")`），某些类型不需要消歧时可以省略（`auth { ... }`）。
- **Body**：花括号包裹，**永远多行**。
  内部可按任意顺序包含字段赋值和/或子代码块。

### 字段赋值

```
field_name = value
```

- 每行一个字段。
- 必须有 `=`。
- 右侧是一个[值](#7-值)。
- 未知字段名 → 解析期错误（依据插件 schema）。

### 子代码块

```
child_kind("name") {
  ...
}

child_kind {
  ...
}
```

子代码块也是一个类型代码块，嵌套在其父代码块内部。
插件决定哪些子类型可以出现在哪种父类型里，
以及每种子类型是否要求/禁止带名字。

### 约束

- 代码块体永远多行：`{` 出现在行尾，`}` 出现在行首，
  每个字段或子代码块独占一行。
  单行体（`http("x") { basePath = "/v1" }`）**不允许**。
- 在文件根作用域内，`(kind, name)` 二元组必须唯一。
- 在某个父体内部，`(child_kind, child_name)` 二元组必须唯一。
- 不接受 name 的类型不能带名字调用
  （若插件 schema 声明 `auth` 不取名字，写 `auth("x") { ... }`
  即为解析错误）。

### 默认（无名）实例

任何类型都可以**带**或**不带**名字调用。无名形式即该类型的**默认实例**：

```box
i18n { ... }            // i18n 的默认实例
http("public") { ... }  // http 的具名实例
http { ... }            // http 的默认实例（同样允许）
```

解析器规则 —— 自动生效，不需要 schema 属性：

- **同一项目中，每种类型至多一个无名实例。**
  在可达的 import 图中出现两个 `i18n { }` 即为解析期错误。
- **使用者必须通过 `import` 串联。** 如果文件使用了任何依赖于某种类型默认实例的插件功能
  （例如 `t(...)` 依赖 `i18n` 的默认实例），
  该文件必须**直接** `import` 包含该默认实例的文件。
  传递性导入不算数。

具名实例对某种类型是否「有用」由插件决定。对部分类型（`http`、`route`）名字是必要的；
对另一些类型（`i18n`）无名默认是所有人唯一会用的形式，
插件的 `validate()` 可以直接拒绝具名实例。

### 示例

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

## 3. 插件 —— `use`

```box
use "@box/http"
use "@box/codegen"
use "@acme/http" as acme
```

- `use "<package>"` 加载一个插件，并把它的**类型关键字**
  以默认名称注册到当前文件的作用域。
- `use "<package>" as <alias>` 给插件认领的所有类型加上
  `<alias>.` 前缀（如 `acme.http("...") { ... }`）。
  当两个插件认领相同的默认关键字时使用。
- 包标识符：`@scope/name`、`name`，或本地路径（`./plugins/foo`）。
- `use` 是**文件本地的**。每个文件自行声明用到的插件，
  不会从被 import 的文件继承。

`use` 加载插件的**语法**（让类型关键字以及 `t(...)` 这类插件白名单函数
在当前文件被识别）。它**不**串联实例。
对那些 schema 中声明了依赖某种类型默认实例的插件函数（参见 §2），
文件还必须额外 `import` 包含该默认实例的文件。
解析器会拒绝任何只 `use`（语法）但没有 `import`（实例）的使用。

每个插件贡献一个或多个类型。对它认领的每个类型，
插件提供一份在解析期使用的**类型 schema**（参见 §6）。

---

## 4. 模块组合 —— `import` 与 `export`

### 本地使用 —— `import`

```box
import "./schema.box"                  // → schema.X
import "../auth/index.box"             // → auth.X    （父目录名，因为文件名是 index.box）
import "../user-service/index.box" as users
```

- `import "<path>"` 把另一份 `.box` 文件的全部文件作用域模式声明
  挂在一个**自动命名空间别名**之下：
  - 如果该文件是 `index.box`，别名取父目录名。
  - 否则，别名取去掉扩展名的文件名。
- `import "<path>" as <alias>` 覆盖自动别名。
- 导入永远是命名空间化的；没有任何形式可以把名称拉进根作用域。
- 多个导入之间的别名冲突是解析期错误。

### 再导出 —— `export`

```box
export "./schema.box"               // 平铺再导出
export "./schema.box" as types      // 在子命名空间下再导出
```

- `export "<path>"` 把另一份 `.box` 文件的全部文件作用域模式声明
  暴露给**当前文件**的使用者，**平铺**进当前文件的命名空间，
  仿佛就在当前文件中声明一样。
- `export "<path>" as <alias>` 在子命名空间下再导出。
- 与 `import` 互相独立。每个文件可单独使用其中之一、两者皆用或都不用。
- 平铺再导出的名称冲突是解析期错误。
- 循环再导出是解析期错误。

`import` 用于**模式组合**。`use` 用于**插件加载**。两者不可互换。

---

## 5. 声明（文件作用域）

声明语法继承自 TypeSpec：

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

支持：`model`、`enum`、类型别名，以及从 TypeSpec 继承的装饰器
（仅限**与传输层无关**的部分 —— `@doc`、`@deprecated` 等）。
HTTP / MCP 等**与传输层有关**的装饰器不允许出现在文件作用域声明上。

不使用 `interface` 声明。操作（operations）在暴露它们的类型代码块内**就地**定义
（例如在 `route(...)` 体内通过字段赋值的操作签名 —— 参见 §7）。

声明体永远多行。可见性的单元是文件：`.box` 文件中声明的所有内容
对任何 `import` 它的文件都是可见的。不存在按声明粒度的 `export` 修饰符。

---

## 6. 类型与类型 schema

### 类型注册

插件在加载时认领一个或多个**类型关键字**。
对每个类型，插件提供一份描述以下内容的**类型 schema**：

- 允许的字段名集合，每个字段对应接受的值种类与必需性
- 允许的子代码块类型集合，附带每种子类型的基数（cardinality）与
  （可选的）命名规则
- 该类型字段值中允许出现的**插件白名单具名函数**集合
  （例如加载 `@box/i18n` 后，`description` 字段可接受 `t(...)`）。
  每个函数可以声明对某种类型默认实例的依赖 ——
  解析器会要求使用该函数的文件直接 `import` 包含该默认实例的文件（§2）。

类型 schema **不**声明「是否单例」或「是否需要名字」。
对任何类型而言，`kind { ... }` 和 `kind("name") { ... }` 在语法上都合法；
「每种类型至多一个无名默认」的规则（§2）是自动的。
语义性约束（例如「`i18n` 的具名实例毫无意义」）由插件在其 `validate()` 阶段强制执行。

解析器是**插件感知**的：先加载通过 `use` 声明的插件，
再用插件提供的 schema 在**解析期**校验类型代码块。
未知字段、未知子类型、错类型的值或缺失的必需字段
都是解析期错误。

这是相对 HCL / Terraform 的一项刻意偏离 ——
那里 schema 校验被推迟到运行时。在 Box 中，schema 是一等语言关注点。

### 示例类型（非规范性）

| 类型 | 插件 | 规范 | 用途 |
|---|---|---|---|
| `package` | core | _（本规范）_ | 包元数据 —— 名称、版本、描述 |
| `http` | `@box/http` | [`specs/http.md`](specs/http.md) | HTTP 表层 —— basePath、route、auth |
| `mcp` | `@box/mcp` | 待定 | MCP 服务器 —— tool、resource、prompt |
| `target` | `@box/codegen` | 待定 | 输出配置 —— 语言、端（client/server）、输出目录 |
| `cli` | `@box/cli` | 待定 | CLI 命令表层 |
| `i18n` | `@box/i18n` | [`specs/i18n.md`](specs/i18n.md) | 翻译 / 本地化服务 |

各插件的语法存放在 `specs/` 目录下对应的规范文件中。

---

## 7. 值

字段值仅限以下形式：

| 形式 | 示例 |
|---|---|
| 字符串 | `"hello"` |
| 数字 | `42`、`3.14` |
| 布尔 | `true`、`false` |
| 空值 | `null` |
| 标识符 | `python`、`User`、`bearer` |
| 跨代码块字段引用 | `package.box.version` |
| 数组 | `[1, 2, 3]`、`[User, Admin]` |
| 插件白名单函数调用 | `t("cli.init.description", version = "0.1.0")` |
| 操作签名 | `list(): User[]`、`create(req: CreateUserRequest): User` |

### 标识符

标识符引用作用域内的名称：被导入的模式声明（`User`）、
插件定义的枚举式取值（如 `language` 字段的 `python`、`type` 字段的 `bearer`），
或当前文件的本地模式声明。

### 跨代码块字段引用

`<kind>.<name>.<field>` —— 读取**同一文件**中另一类型代码块的某个字段值。
例：`package.box.version` 读取 `package("box")` 的 `version` 字段。

被引用的字段必须是字面量值字段（字符串、数字、布尔）。
允许自引用（代码块引用自身的字段）。

### 具名函数调用（插件白名单）

```
function_name(<positional>, <named> = <value>, ...)
```

- 仅支持插件定义的函数。
  插件声明自己暴露的每个函数，以及哪些类型字段接受它作为值。
- 位置参数与具名参数可混用（遵循 Kotlin / Python 的顺序规则：
  所有位置参数在前，具名参数在后）。
- 可跨多行书写：
  ```
  description = t(
    "cli.main.description",
    version = package.box.version,
    edition = "2026",
  )
  ```
- 允许尾随逗号。
- 函数调用**不**能出现在任意位置；只能用于插件 schema 显式声明
  「该字段接受函数调用值」的字段。

**不是通用表达式语言。**
可用函数是一小撮由插件精选的集合。第一个被定义的函数是 `@box/i18n` 提供的 `t()`。

### 操作签名

```
<name>(<params>): <return-type>
```

形如函数声明的取值。用作 HTTP route 中方法关键字赋值的右侧
（其它表层类型中类似的位置）：

```box
route("/users") {
  get  = list(): User[]
  post = create(req: CreateUserRequest): User
}
```

是否接受这种值形态由各类型的 schema 决定。**大多数字段不接受**操作签名。

### 不支持

- 字符串插值（`"${x}"`）
- 条件式（`if`、三目）
- 循环（`for`、`for_each`）
- 算术（`+`、`*`）
- 任意函数调用
- 映射 / 对象字面量（_未定 —— 若需要再加_）

---

## 8. 组合限制

Box 对类型代码块**没有继承、覆盖或合并机制**。
没有 `extends`、没有 `override`、没有 `with`、没有体级 deep-merge。

理由：源自 [CUE 的设计][cue-talk] ——
一旦允许值跨层覆盖，「这个值是哪儿来的」就需要遍历整条覆盖链。
Box 让任一值都只距离一次声明。

组合方式：

- `import` / `export`（跨文件拉取模式声明；不做合并）
- 跨代码块字段引用（`<kind>.<name>.<field>`）

[cue-talk]: https://www.infoq.com/presentations/cue-configuration/

---

## 9. 词法约定

- **标识符：** `[A-Za-z_][A-Za-z0-9_-]*`
  （kebab 与 snake 都允许；惯例：插件定义的枚举式取值用 kebab，
  字段名用 snake 或 camelCase，model 用 PascalCase）。
- **字符串字面量：** 双引号，支持 `\"` 与 `\\` 转义。
  _未定：三引号、原始字符串、多行字符串。_
- **语句终止符：** 无。换行与花括号即定界符。`;` 不是分隔符。
- **字段赋值必须用 `=`**。没有其它形式。
- **函数调用使用圆括号**，参数逗号分隔，允许尾随逗号。
- **保留关键字：** `use`、`import`、`export`、`as`、`true`、
  `false`、`null`，以及 TypeSpec 的声明关键字（`model`、`enum` 等）。
  类型名（`http`、`cli`、`package` …）**不是**保留关键字 ——
  它们是插件认领的标识符，通过 `use` 在每个文件中各自生效。

---

## 10. 未决问题

冻结 v1.0 之前需要解决。

1. **其它表层中的操作签名。** HTTP 使用 `get = list(): User[]` 形态。
   `mcp("tools") { tool("get_user") { ... } }` 是否以同样方式表达工具？
   按表层逐一决定。
2. **插件注册的函数。** 确认机制：插件在类型 schema 中声明函数，
   解析器只允许它出现在指定字段中。在 `box-abi-v1` 中规范发现/注册方式。
3. **处处允许尾随逗号。** 函数参数已允许；其它位置（数组等）是否也允许？
4. **字符串扩展。** 三引号、原始字符串、多行字符串。
5. **映射 / 对象字面量。** 是否有插件类型需要它们，还是「具名函数参数 + 子代码块」
   已经覆盖了所有用例？
6. **传递性导入。** 若 `a.box` import 了 `b.box`，`c.box` import 了 `a.box`，
   `c.box` 是否能看到 `b.box` 的声明？默认：不能。
   单例串联的默认相同：单例所在文件必须被**直接**导入，不能靠传递关系到达。
10. **跨代码块字段引用与项目级可见性。**
    `package.box.version` 引用的字段定义在另一文件，而该文件并未被 import。
    项目级可见性是对的吗？还是说跨代码块引用也应当要求显式 import？
    取舍：显式 import = 引用同样保留「一跳可溯源」的性质，
    但会带来一些尴尬形态（cli.box 需要 import 包含 `package("box")` 的文件）。
7. **`use` 与 `import` 的注册表 / 解析。** 本地路径、工作区、远程注册表 ——
   命名与查找顺序。
8. **注释位置约束。** 函数参数列表内的块注释、字段之间的块注释等。
9. **TypeSpec 兼容性。** 严格超集还是方言。

---

## 11. 示例

### 单文件项目

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

### 同一根关键字的多个类型实例

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

### 多文件组合

```
boxes/user-service/
├── index.box       # 包元数据 + targets + 门面
├── schema.box      # 共享模型
├── http.box        # HTTP 表层
└── mcp.box         # MCP 表层
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

### 跨包导入与别名

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

### 翻译函数调用

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
