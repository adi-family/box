import { defineConfig } from "vitepress";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// GitHub Pages serves project sites at /<repo-name>/.
const base = "/box/";

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
  description:
    "Declarative schema and project-definition language with plugin-extensible kinds.",

  cleanUrls: true,
  lastUpdated: true,

  markdown: {
    languages: [{ ...boxGrammar, name: "box" }],
  },

  head: [
    ["link", { rel: "icon", href: `${base}favicon.svg`, type: "image/svg+xml" }],
  ],

  locales: {
    root: {
      label: "English",
      lang: "en",
      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/getting-started" },
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
          { text: "指南", link: "/zh/guide/getting-started" },
          { text: "规范", link: "https://github.com/adi-family/box/blob/main/SPEC.md" },
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
