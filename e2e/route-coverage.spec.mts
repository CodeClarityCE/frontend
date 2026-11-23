import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";

import {
  discoverRoutes,
  routeCoverageProblems,
} from "./helpers/route-coverage.mjs";
import { routeSpecs } from "./route-registry.mjs";

const e2eDir = new URL(".", import.meta.url);
const srcDir = new URL("../src/", import.meta.url);

// Reads a view from its import path in the router, where @/ is src/.
const readView = (from: string): string =>
  readFileSync(new URL(from.replace(/^@\//, ""), srcDir), "utf8");

test("every page of the app has a registered spec with a phone test", () => {
  const routes = discoverRoutes(
    readFileSync(new URL("router.ts", srcDir), "utf8"),
    readView,
  );
  const specFiles = readdirSync(e2eDir).filter((f) => f.endsWith(".spec.mts"));
  const phoneSpecFiles = specFiles.filter((f) =>
    readFileSync(new URL(f, e2eDir), "utf8").includes("describeOnAPhone("),
  );

  expect(
    routeCoverageProblems({
      routes,
      registry: routeSpecs,
      specFiles,
      phoneSpecFiles,
    }),
  ).toEqual([]);
});
