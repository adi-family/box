# 快速开始

Box 处于早期开发阶段（规范草案 v0.13）。本指南介绍项目目录结构、解析
第一个 `.box` 文件，以及 Zed 编辑器扩展。

## 克隆仓库

```bash
git clone https://github.com/adi-family/box
cd box
```

## 仓库结构

```
box/
├── SPEC.md              # 核心语言规范
├── specs/               # 各插件规范（http、i18n 等）
├── core/                # box-core：解析器 + 插件宿主（Rust）
├── abi/                 # box-abi-v1：插件 trait + 通讯类型
├── cli/                 # box-cli：`box` 二进制
├── plugins/             # 插件二进制（box-http、box-mcp、box-i18n）
├── grammars/            # tree-sitter-box 语法
├── integrations/zed/    # Zed 编辑器扩展
├── box/                 # Box 自身表层，用 Box 描述（自举示例）
└── site/                # 本站点
```

## 在 Zed 中启用语法高亮

1. 打开 Zed
2. 命令面板 → **zed: install dev extension**
3. 选择克隆目录下的 `integrations/zed/`

Zed 第一次安装时会从 GitHub 拉取 tree-sitter 语法（编译需几秒），
之后任何 `.box` 文件都会被高亮。

## 下一步

- [语言速览](./language.md) —— 五分钟看懂语法
- [SPEC.md](https://github.com/adi-family/box/blob/main/SPEC.md) ——
  完整参考
