import { getIcons } from "@iconify/utils";
import type { IconifyJSON } from "@iconify/vue";
import devicon from "@iconify-json/devicon/icons.json" with { type: "json" };
import simpleIcons from "@iconify-json/simple-icons/icons.json" with { type: "json" };
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

// Brand and language logo sets that ship with the app instead of being fetched.
const LOGO_SETS: Record<string, IconifyJSON> = {
  "simple-icons": simpleIcons,
  devicon: devicon,
};

const MODULE_ID = "virtual:logo-icons";
const RESOLVED_ID = `\0${MODULE_ID}`;
const ICON_ID = /\b(simple-icons|devicon):([a-z0-9-]+)/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    const isSource = /\.(vue|ts)$/.test(entry.name);
    return isSource && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

// Finds every logo id written in the source, grouped by set.
function findLogoIds(srcDir: string): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  for (const file of sourceFiles(srcDir)) {
    for (const [, set, name] of readFileSync(file, "utf8").matchAll(ICON_ID)) {
      if (!found.has(set!)) found.set(set!, new Set());
      found.get(set!)!.add(name!);
    }
  }
  return found;
}

// Builds the subset of each logo set that the source uses.
function logoCollections(srcDir: string): IconifyJSON[] {
  return [...findLogoIds(srcDir)].map(([set, names]) => {
    const subset = getIcons(LOGO_SETS[set]!, [...names].sort(), true);
    if (subset?.not_found?.length) {
      throw new Error(`Unknown ${set} icons: ${subset.not_found.join(", ")}`);
    }
    return subset!;
  });
}

// Serves `virtual:logo-icons`: the used logos, ready for Iconify's addCollection.
export default function logoIcons(srcDir: string): Plugin {
  return {
    name: "logo-icons",
    resolveId: (id) => (id === MODULE_ID ? RESOLVED_ID : undefined),
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      return `export default ${JSON.stringify(logoCollections(srcDir))};`;
    },
  };
}
