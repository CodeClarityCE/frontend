import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";

import rule from "../../../eslint-rules/no-condensed-whitespace.js";

const tester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

const filename = "/repo/src/Example.vue";

tester.run("no-condensed-whitespace", rule, {
  valid: [
    {
      name: "CWE id and name joined by a literal separator",
      filename,
      code: `<template><span>{{ cwe.id }}</span><span v-if="cwe.name">{{ " " + cwe.name }}</span></template>`,
    },
    {
      name: "Connect label with the space outside the screen-reader text",
      filename,
      code: `<template><Button>Connect <span class="sr-only">{{ name }}</span></Button></template>`,
    },
    {
      name: "space inside text that is not whitespace only",
      filename,
      code: `<template><span>{{ count }} items</span></template>`,
    },
    {
      name: "formatting newlines around child elements",
      filename,
      code: `<template>\n  <div>\n    <span>{{ a }}</span>\n  </div>\n</template>`,
    },
    {
      name: "whitespace-only element content",
      filename,
      code: `<template><span> </span></template>`,
    },
    {
      name: "whitespace inside pre is kept by Vue",
      filename,
      code: `<template><pre> {{ code }}</pre></template>`,
    },
  ],
  invalid: [
    {
      name: "CWE name with a leading space before the interpolation",
      filename,
      code: `<template><span class="font-medium">{{ cwe.id }}</span><span v-if="cwe.name"> {{ cwe.name }}</span></template>`,
      errors: [{ messageId: "leading" }],
    },
    {
      name: "screen-reader-only Connect provider name",
      filename,
      code: `<template><Button>Connect<span class="sr-only"> {{ providerInfo.name }}</span></Button></template>`,
      errors: [{ messageId: "leading" }],
    },
    {
      name: "trailing space after an interpolation",
      filename,
      code: `<template><span>{{ a }} </span>b</template>`,
      errors: [{ messageId: "trailing" }],
    },
    {
      name: "leading space before a sibling element",
      filename,
      code: `<template><p>a<span> <b>b</b></span></p></template>`,
      errors: [{ messageId: "leading" }],
    },
  ],
});
