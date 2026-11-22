import { expect, type Locator, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

import { expectPageSweep } from "./helpers/page-sweep.mjs";
import { dependency, ResultTabsPage } from "./pages/result-tabs.page.mjs";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1024 });
});

interface CycloneDxComponent {
  "bom-ref": string;
  name: string;
  version: string;
  purl?: string;
  licenses?: Record<string, unknown>[];
  properties: { name: string; value: string }[];
}

test.describe("SBOM export", () => {
  test("the CycloneDX file has package URLs, licenses and no undefined", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn({
      dependencies: [
        // As the API sends them: no outdated flag, a purl and a license.
        {
          name: "@vue/shared",
          version: "3.5.0",
          newest_release: "3.5.13",
          purl: "pkg:npm/%40vue/shared@3.5.0",
          license: "MIT",
          is_direct_count: 1,
          prod: true,
          dev: false,
          deprecated: false,
        },
        {
          name: "node-forge",
          version: "0.9.0",
          newest_release: "0.9.0",
          license: "(BSD-3-Clause OR GPL-2.0)",
          is_direct_count: 0,
          prod: true,
          dev: false,
        },
        {
          name: "left-pad",
          version: "1.3.0",
          newest_release: "1.3.0",
          license: "SEE LICENSE IN LICENSE.md",
          is_direct_count: 0,
          prod: false,
          dev: true,
        },
      ],
    });
    await tabs.goto();
    await expect(tabs.rows("Dependencies")).toHaveCount(3);

    await page.getByRole("button", { name: "Export SBOM" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: /CycloneDX/ }).click();
    const text = await readFile(await (await download).path(), "utf8");

    expect(text).not.toContain("undefined");
    const bom = JSON.parse(text) as {
      bomFormat: string;
      specVersion: string;
      metadata: { component: { name: string } };
      components: CycloneDxComponent[];
    };
    expect(bom.bomFormat).toBe("CycloneDX");
    expect(bom.metadata.component.name).toBe("web-frontend");
    const byName = Object.fromEntries(bom.components.map((c) => [c.name, c]));
    expect(byName["@vue/shared"]).toMatchObject({
      "bom-ref": "pkg:npm/%40vue/shared@3.5.0",
      purl: "pkg:npm/%40vue/shared@3.5.0",
      licenses: [{ expression: "MIT" }],
    });
    // No purl from the API: one is built from the name and version.
    expect(byName["node-forge"]).toMatchObject({
      purl: "pkg:npm/node-forge@0.9.0",
      licenses: [{ expression: "(BSD-3-Clause OR GPL-2.0)" }],
    });
    expect(byName["left-pad"]!.licenses).toEqual([
      { license: { name: "SEE LICENSE IN LICENSE.md" } },
    ]);
    expect(byName["@vue/shared"]!.properties).toEqual([
      { name: "codeclarity:is_direct", value: "true" },
      { name: "codeclarity:is_deprecated", value: "false" },
      { name: "codeclarity:is_outdated", value: "true" },
    ]);
    expect(byName["left-pad"]!.properties).toEqual([
      { name: "codeclarity:is_direct", value: "false" },
      { name: "codeclarity:is_deprecated", value: "false" },
      { name: "codeclarity:is_outdated", value: "false" },
    ]);
  });
});

test.describe("SBOM table", () => {
  test("without a sort, dependencies are in ascending name order", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    // Sent Z to A, as the API used to.
    await tabs.signIn({
      dependencies: ["vitest", "ms", "lodash", "express"].map((name) =>
        dependency(name, "1.0.0"),
      ),
    });
    await tabs.goto();
    const sort = tabs.sortButton("Dependencies", "Package");

    await sort.click();
    await sort.click();

    await expect(
      tabs.table("Dependencies").getByRole("columnheader", { name: "Package" }),
    ).not.toHaveAttribute("aria-sort", /.+/);
    await expect(
      tabs.rows("Dependencies").locator("td:first-child"),
    ).toHaveText(["express", "lodash", "ms", "vitest"]);
  });

  test("search ignores surrounding spaces", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    await tabs.signIn();
    await tabs.goto();
    await expect(tabs.rows("Dependencies")).toHaveCount(5);

    await page
      .getByRole("searchbox", { name: "Search dependencies" })
      .fill("  lodash ");

    await expect(tabs.rows("Dependencies")).toHaveCount(1);
    await expect(tabs.rows("Dependencies")).toContainText("lodash");
    await expectPageSweep(page);
  });
});

test.describe("SBOM counts", () => {
  test("the SBOM counts vulnerabilities as the vulnerabilities tab does", async ({
    page,
  }) => {
    const tabs = new ResultTabsPage(page);
    // One vulnerability hits two dependencies: 4 findings, 3 vulnerabilities.
    await tabs.signIn({
      vulnFinder: true,
      vulnStats: { number_of_issues: 4, number_of_vulnerabilities: 3 },
    });
    await tabs.goto();

    const numbers = page.getByRole("list", { name: "Dependency numbers" });
    await expect(numbers.getByRole("listitem").nth(3)).toHaveText(
      /^\s*Vulnerabilities\s*3(?!\d)/,
    );
    await expectPageSweep(page);
  });
});

test.describe("SBOM dependency details", () => {
  for (const url of [
    "git://github.com/lodash/lodash.git",
    "git+https://github.com/lodash/lodash.git",
    "git+ssh://git@github.com/lodash/lodash.git",
    "ssh://git@github.com/lodash/lodash.git",
    "git@github.com:lodash/lodash.git",
  ])
    test(`a ${url} repository opens on the web`, async ({ page }) => {
      const tabs = new ResultTabsPage(page);
      await tabs.signIn({ details: { source: { Type: "git", Url: url } } });
      await tabs.gotoDetails();

      await expect(
        page.getByRole("link", { name: /GitHub \(opens in a new tab\)/ }),
      ).toHaveAttribute("href", "https://github.com/lodash/lodash");
    });

  test("install age and release age agree", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    // Released 2020-08-13, viewed 2026-06-01: five years and nine months.
    await tabs.signIn();
    await tabs.gotoDetails();
    await expect(tabs.heading).toContainText("lodash");

    // Under the installed and the latest version.
    await expect(page.getByText("5 years ago", { exact: true })).toHaveCount(2);
    const age = page
      .getByRole("term")
      .filter({ hasText: "Release age" })
      .locator("xpath=following-sibling::dd");
    await expect(age).toHaveText("5 years old");
    await expectPageSweep(page);
  });

  test("the graph's minimap covers no node", async ({ page }) => {
    const tabs = new ResultTabsPage(page);
    // A chain five deep that fans out into thirteen packages: the graph
    // fills the canvas down to its bottom right corner.
    const chain = Array.from({ length: 5 }, (_, i) => `chain-${i}@1.0.0`);
    const leaves = Array.from({ length: 13 }, (_, i) =>
      i === 12 ? "lodash@4.17.20" : `leaf-${i}@1.0.0`,
    );
    const ids = ["__VIRTUAL_ROOT__", ...chain];
    await tabs.signIn({
      graph: [
        ...ids.map((id, i) => ({
          id,
          parentIds: i === 0 ? [] : [ids[i - 1]],
          childrenIds: i === ids.length - 1 ? leaves : [ids[i + 1]],
          prod: true,
        })),
        ...leaves.map((id) => ({
          id,
          parentIds: [chain[4]],
          childrenIds: [],
          prod: true,
        })),
      ],
    });
    await tabs.gotoDetails();
    const graph = page.getByRole("group", {
      name: /Dependency graph of lodash/,
    });
    const nodes = graph.locator(".vue-flow__node");
    await expect(nodes).toHaveCount(19);
    const minimap = graph.locator(".vue-flow__minimap");
    await expect(minimap).toBeVisible();
    // Let the fit-to-view settle before measuring.
    await page.waitForTimeout(500);

    const map = (await minimap.boundingBox())!;
    const overlapping: string[] = [];
    for (const node of await nodes.all()) {
      if (overlaps((await node.boundingBox())!, map))
        overlapping.push(await nodeLabel(node));
    }
    expect(overlapping).toEqual([]);
    // Still drawn at a readable size, not shrunk out of the way.
    const target = (await graph
      .locator('.vue-flow__node[data-id="lodash@4.17.20"]')
      .boundingBox())!;
    expect(target.width).toBeGreaterThan(30);
  });
});

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlaps(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

async function nodeLabel(node: Locator): Promise<string> {
  return (await node.getAttribute("data-id")) ?? "";
}
