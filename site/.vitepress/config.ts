import { defineConfig } from "vitepress";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// GitHub Pages serves project sites at /<repo-name>/.
const base = "/box/";
const hostname = "https://github.withadi.dev";
const siteUrl = `${hostname}${base}`;
const description =
  "Box is a declarative DSL for schemas and project surfaces. Define HTTP APIs, MCP tools, CLIs, and codegen targets once — plugins generate clients, servers, and specs from a single source.";

// Load the Box TextMate grammar so Shiki can highlight `box` code fences.
const boxGrammar = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL("../../grammars/textmate/box.tmLanguage.json", import.meta.url),
    ),
    "utf-8",
  ),
);

export default defineConfig({
  base,
  title: "Box",
  titleTemplate: ":title · Box",
  description,

  cleanUrls: true,
  lastUpdated: true,

  sitemap: { hostname: siteUrl },

  markdown: {
    languages: [{ ...boxGrammar, name: "box" }],
    // Code block always renders on a dark panel (see Pipeline.vue's
    // #050505 background). Use a warm-toned dark theme in both modes
    // so the syntax palette ties to the brand orange.
    theme: { light: "vesper", dark: "vesper" },
  },

  head: [
    ["link", { rel: "icon", href: `${base}favicon.svg`, type: "image/svg+xml" }],
    ["meta", { property: "og:site_name", content: "Box" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
  ],

  // Canonicalize on the new host and pair EN ↔ ZH so Google treats
  // adi-family.github.io/box and github.withadi.dev/box as one site
  // with two locales, not four separate properties.
  transformPageData(pageData) {
    const rel = pageData.relativePath
      .replace(/\.md$/, "")
      .replace(/(^|\/)index$/, "$1");
    const isZh = rel.startsWith("zh/") || rel === "zh/";
    const enPath = isZh ? rel.replace(/^zh\//, "") : rel;
    const zhPath = isZh ? rel : rel === "" ? "zh/" : `zh/${rel}`;

    const canonical = `${siteUrl}${rel}`;
    const enUrl = `${siteUrl}${enPath}`;
    const zhUrl = `${siteUrl}${zhPath}`;

    const title = pageData.frontmatter.title ?? pageData.title ?? "Box";
    const desc = pageData.frontmatter.description ?? description;

    (pageData.frontmatter.head ??= []).push(
      ["link", { rel: "canonical", href: canonical }],
      ["link", { rel: "alternate", hreflang: "en", href: enUrl }],
      ["link", { rel: "alternate", hreflang: "zh-CN", href: zhUrl }],
      ["link", { rel: "alternate", hreflang: "x-default", href: enUrl }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: desc }],
      ["meta", { property: "og:url", content: canonical }],
      ["meta", { property: "og:locale", content: isZh ? "zh_CN" : "en_US" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: desc }],
      ["meta", { name: "description", content: desc }],
    );
  },

  locales: {
    root: {
      label: "English",
      lang: "en",
      themeConfig: {
        nav: [
          { text: "Spec", link: "https://github.com/adi-family/box/blob/main/SPEC.md" },
        ],
        sidebar: {
          "/guide/": [
            {
              text: "Guide",
              items: [
                { text: "Getting started", link: "/guide/getting-started" },
                { text: "Language at a glance", link: "/guide/language" },
              ],
            },
          ],
        },
        editLink: {
          pattern:
            "https://github.com/adi-family/box/edit/main/site/:path",
          text: "Edit this page on GitHub",
        },
      },
    },
    zh: {
      label: "中文",
      lang: "zh-CN",
      themeConfig: {
        nav: [
          { text: "规范", link: "https://github.com/adi-family/box/blob/main/SPEC-zh.md" },
        ],
        sidebar: {
          "/zh/guide/": [
            {
              text: "指南",
              items: [
                { text: "快速开始", link: "/zh/guide/getting-started" },
                { text: "语言速览", link: "/zh/guide/language" },
              ],
            },
          ],
        },
        editLink: {
          pattern:
            "https://github.com/adi-family/box/edit/main/site/zh/:path",
          text: "在 GitHub 上编辑此页",
        },
      },
    },
  },

  themeConfig: {
    socialLinks: [
      { icon: "github", link: "https://github.com/adi-family/box" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 ADI Family",
    },
  },
});
