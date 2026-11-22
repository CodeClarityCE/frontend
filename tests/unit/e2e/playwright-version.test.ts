import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest runs from the frontend root.
const packageJson = readFileSync(resolve("package.json"), "utf8");
const baselinesScript = readFileSync(
  resolve(".cloud/scripts/e2e-baselines.sh"),
  "utf8",
);
const ciWorkflow = readFileSync(resolve(".github/workflows/ci.yml"), "utf8");

// Returns the Playwright image reference in the text, or fails the test.
function image(text: string): string {
  const match = /(mcr\.microsoft\.com\/playwright:v[^\s"']+)/.exec(text);
  if (!match?.[1]) throw new Error("no Playwright image found");
  return match[1];
}

describe("Playwright version", () => {
  const pinned = (
    JSON.parse(packageJson) as {
      devDependencies: Record<string, string>;
    }
  ).devDependencies["@playwright/test"];
  const baselinesImage = image(baselinesScript);
  const ciImage = image(ciWorkflow);

  it("is the same in the baselines script and the CI e2e image", () => {
    expect(ciImage).toBe(baselinesImage);
  });

  it("matches @playwright/test in package.json", () => {
    expect(
      baselinesImage.startsWith(
        `mcr.microsoft.com/playwright:v${pinned ?? "?"}-noble@sha256:`,
      ),
      `${baselinesImage} is not @playwright/test ${pinned ?? "?"}`,
    ).toBe(true);
  });
});
