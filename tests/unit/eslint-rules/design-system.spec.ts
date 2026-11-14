import { RuleTester } from "eslint";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import vueParser from "vue-eslint-parser";

import rule from "../../../eslint-rules/design-system.js";
import allowlist from "../../../eslint-rules/design-system-allowlist.json";

const repoRoot = resolve(__dirname, "../../..");

const root = "/repo";
const ts = (name: string): string => `${root}/src/${name}.ts`;
const vue = (name: string): string => `${root}/src/${name}.vue`;

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

const removedComponents = [
  { name: "InfoCard", path: "src/base_components/ui/cards/InfoCard.vue" },
];

tester.run("design-system", rule, {
  valid: [
    {
      name: "semantic token classes",
      filename: vue("Clean"),
      code: `<template><div class="bg-card text-muted-foreground hover:bg-primary/90"></div></template>`,
      options: [{ root }],
    },
    {
      name: "third-party theme option that is not a colour",
      filename: vue("ThirdParty"),
      code: `<template><Editor class="theme-default" theme="default" /></template>`,
      options: [{ root }],
    },
    {
      name: "semantic token classes in a script string",
      filename: ts("clean"),
      code: `export const c = "border-border bg-background text-destructive";`,
      options: [{ root }],
    },
    {
      name: "icons from the logo sets",
      filename: vue("Logos"),
      code: `<template><Icon icon="simple-icons:github" /><Icon :icon="'devicon:rust'" /></template>`,
      options: [{ root }],
    },
    {
      name: "icon id passed through a variable",
      filename: vue("Logos"),
      code: `<template><Icon :icon="item.icon" /></template>`,
      options: [{ root }],
    },
    {
      name: "logo icon chosen between literal ids",
      filename: vue("Logos"),
      code: `<template><Icon :icon="dark ? 'simple-icons:github' : \`devicon:github\`" /></template>`,
      options: [{ root }],
    },
    {
      name: "icon data from a logo set",
      filename: ts("logos"),
      code: `import icons from "@iconify-json/simple-icons/icons.json";`,
      options: [{ root }],
    },
    {
      name: "hex colours in comments",
      filename: ts("comment"),
      code: `// was #1dce79 before the tokens\nexport const a = 1;`,
      options: [{ root }],
    },
    {
      name: "removed components list starts empty",
      filename: vue("Page"),
      code: `<script>import InfoCard from "@/base_components/ui/cards/InfoCard.vue";</script>`,
      options: [{ root }],
    },
    {
      name: "allowlisted file keeps its listed violations",
      filename: vue("Legacy"),
      code: `<template><div class="text-theme-primary" style="color: #fff"></div></template>`,
      options: [{ root, allowlist: { "src/Legacy.vue": ["hex", "theme"] } }],
    },
    {
      name: "allowlisted removed component import",
      filename: vue("Legacy"),
      code: `<script>import { InfoCard } from "@/base_components";</script>`,
      options: [
        {
          root,
          removedComponents,
          allowlist: { "src/Legacy.vue": ["removed"] },
        },
      ],
    },
    {
      name: "other names from a barrel",
      filename: vue("Page"),
      code: `<script>import { PageHeader } from "@/base_components";</script>`,
      options: [{ root, removedComponents }],
    },
  ],
  invalid: [
    {
      name: "hex literal in a script string",
      filename: ts("chart"),
      code: `export const fill = "#1dce79";`,
      options: [{ root }],
      errors: [{ messageId: "hex" }],
    },
    {
      name: "hex literal in a template string",
      filename: ts("chart"),
      code: "export const s = `fill: #FFF`;",
      options: [{ root }],
      errors: [{ messageId: "hex" }],
    },
    {
      name: "arbitrary hex class in a template",
      filename: vue("Hex"),
      code: `<template><div class="bg-[#111]"></div></template>`,
      options: [{ root }],
      errors: [{ messageId: "hex" }],
    },
    {
      name: "hex in a bound style",
      filename: vue("Hex"),
      code: `<template><div :style="{ color: '#00000080' }"></div></template>`,
      options: [{ root }],
      errors: [{ messageId: "hex" }],
    },
    {
      name: "hex in a style block",
      filename: vue("Hex"),
      code: `<template><div /></template>\n<style>.a { color: #dc3545; }</style>`,
      options: [{ root }],
      errors: [{ messageId: "hex", line: 2 }],
    },
    {
      name: "raw palette classes in a template",
      filename: vue("Palette"),
      code: `<template><div class="bg-gray-100 hover:text-red-500/50 bg-white"></div></template>`,
      options: [{ root }],
      errors: [
        { messageId: "palette" },
        { messageId: "palette" },
        { messageId: "palette" },
      ],
    },
    {
      name: "raw palette class in a bound class",
      filename: vue("Palette"),
      code: `<template><div :class="ok ? 'border-slate-200' : ''"></div></template>`,
      options: [{ root }],
      errors: [{ messageId: "palette" }],
    },
    {
      name: "raw palette class in a script string",
      filename: ts("variants"),
      code: `export const v = { danger: "text-white bg-rose-600" };`,
      options: [{ root }],
      errors: [{ messageId: "palette" }, { messageId: "palette" }],
    },
    {
      name: "raw palette class in a style block apply",
      filename: vue("Palette"),
      code: `<template><div /></template><style>.a { @apply bg-zinc-900; }</style>`,
      options: [{ root }],
      errors: [{ messageId: "palette" }],
    },
    {
      name: "theme class in a template",
      filename: vue("Theme"),
      code: `<template><span class="text-theme-gray font-bold"></span></template>`,
      options: [{ root }],
      errors: [{ messageId: "theme" }],
    },
    {
      name: "theme variable in a style block",
      filename: vue("Theme"),
      code: `<template><div /></template><style>.a { color: var(--color-theme-primary-dark); }</style>`,
      options: [{ root }],
      errors: [{ messageId: "theme" }],
    },
    {
      name: "bare theme colour class",
      filename: vue("Theme"),
      code: `<template><span class="theme-green"></span></template>`,
      options: [{ root }],
      errors: [{ messageId: "theme" }],
    },
    {
      name: "theme class with any colour and shade",
      filename: vue("Theme"),
      code: `<template><span class="text-theme-red bg-theme-primary-light"></span></template>`,
      options: [{ root }],
      errors: [{ messageId: "theme" }, { messageId: "theme" }],
    },
    {
      name: "any theme colour variable",
      filename: vue("Theme"),
      code: `<template><div /></template><style>.a { color: var(--color-theme-secondary); }</style>`,
      options: [{ root }],
      errors: [{ messageId: "theme" }],
    },
    {
      name: "theme class in a script string",
      filename: ts("theme"),
      code: `export const c = "bg-theme-black";`,
      options: [{ root }],
      errors: [{ messageId: "theme" }],
    },
    {
      name: "general icon set in a template",
      filename: vue("Icons"),
      code: `<template><Icon icon="solar:home-linear" /></template>`,
      options: [{ root }],
      errors: [{ messageId: "icon" }],
    },
    {
      name: "general icon set in a bound icon",
      filename: vue("Icons"),
      code: `<template><Icon :icon="open ? 'tabler:chevron-up' : 'tabler:chevron-down'" /></template>`,
      options: [{ root }],
      errors: [{ messageId: "icon" }, { messageId: "icon" }],
    },
    {
      name: "logo icon id concatenated in a template",
      filename: vue("Icons"),
      code: `<template><Icon :icon="'devicon:' + lang" /></template>`,
      options: [{ root }],
      errors: [{ messageId: "iconDynamic" }],
    },
    {
      name: "logo icon id built from a variable in a template",
      filename: vue("Icons"),
      code: '<template><Icon :icon="`devicon:${lang}`" /></template>',
      options: [{ root }],
      errors: [{ messageId: "iconDynamic" }],
    },
    {
      name: "logo icon id built from a variable in a script",
      filename: ts("logos"),
      code: "export const id = (lang) => `simple-icons:${lang}`;",
      options: [{ root }],
      errors: [{ messageId: "iconDynamic" }],
    },
    {
      name: "logo icon id concatenated in a script",
      filename: ts("logos"),
      code: `export const id = (name) => "simple-icons:" + name;`,
      options: [{ root }],
      errors: [{ messageId: "iconDynamic" }],
    },
    {
      name: "allowlisted icon category also covers runtime icon ids",
      filename: vue("Legacy"),
      code: '<template><Icon :icon="`devicon:${lang}`" /><Icon icon="solar:x" /></template>',
      options: [{ root, allowlist: { "src/Legacy.vue": ["icon", "palette"] } }],
      errors: [{ messageId: "stale", data: { category: "palette" } }],
    },
    {
      name: "general icon set in a script icon field",
      filename: ts("menu"),
      code: `export const items = [{ icon: "akar-icons:gear" }];`,
      options: [{ root }],
      errors: [{ messageId: "icon" }],
    },
    {
      name: "known general icon set in any script string",
      filename: ts("menu"),
      code: `export const i = "mdi:github";`,
      options: [{ root }],
      errors: [{ messageId: "icon" }],
    },
    {
      name: "lucide through Iconify",
      filename: vue("Icons"),
      code: `<template><Icon icon="lucide:x" /></template>`,
      options: [{ root }],
      errors: [{ messageId: "icon" }],
    },
    {
      name: "icon data import from a general set",
      filename: ts("icons"),
      code: `import { icons } from "@iconify-json/solar";`,
      options: [{ root }],
      errors: [{ messageId: "icon" }],
    },
    {
      name: "removed component by path",
      filename: vue("Page"),
      code: `<script>import InfoCard from "@/base_components/ui/cards/InfoCard.vue";</script>`,
      options: [{ root, removedComponents }],
      errors: [{ messageId: "removed" }],
    },
    {
      name: "removed component from a barrel",
      filename: vue("Page"),
      code: `<script>import { PageHeader, InfoCard } from "@/base_components";</script>`,
      options: [{ root, removedComponents }],
      errors: [{ messageId: "removed" }],
    },
    {
      name: "removed component by relative path",
      filename: `${root}/src/base_components/ui/Other.vue`,
      code: `<script>import InfoCard from "./cards/InfoCard.vue";</script>`,
      options: [{ root, removedComponents }],
      errors: [{ messageId: "removed" }],
    },
    {
      name: "removed component by dynamic import",
      filename: ts("routes"),
      code: `export const c = () => import("@/base_components/ui/cards/InfoCard.vue");`,
      options: [{ root, removedComponents }],
      errors: [{ messageId: "removed" }],
    },
    {
      name: "allowlisted file still fails on patterns it is not listed for",
      filename: vue("Legacy"),
      code: `<template><div class="text-theme-primary bg-gray-50"></div></template>`,
      options: [{ root, allowlist: { "src/Legacy.vue": ["theme"] } }],
      errors: [{ messageId: "palette" }],
    },
    {
      name: "allowlist entry for a pattern the file no longer uses",
      filename: vue("Legacy"),
      code: `<template><div class="text-theme-primary"></div></template>`,
      options: [{ root, allowlist: { "src/Legacy.vue": ["theme", "hex"] } }],
      errors: [{ messageId: "stale", data: { category: "hex" } }],
    },
    {
      name: "allowlist entry for a script file that is now clean",
      filename: ts("legacy"),
      code: `export const c = "bg-card";`,
      options: [{ root, allowlist: { "src/legacy.ts": ["palette"] } }],
      errors: [{ messageId: "stale", data: { category: "palette" } }],
    },
  ],
});

describe("design system allowlist", () => {
  it("lists only files that still exist", () => {
    const missing = Object.keys(allowlist).filter(
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      (file) => !existsSync(resolve(repoRoot, file)),
    );
    expect(missing).toEqual([]);
  });
});
