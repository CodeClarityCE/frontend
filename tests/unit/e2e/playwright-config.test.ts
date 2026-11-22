import type { PlaywrightTestConfig } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

// Vitest runs from the frontend root, where the config lives.
const configURL = pathToFileURL(resolve("playwright.config.mjs"));

// Loads the Playwright config fresh, so env flags are read again.
async function projectNames(): Promise<string[]> {
  vi.resetModules();
  const { default: config } = (await import(
    /* @vite-ignore */ configURL.href
  )) as { default: PlaywrightTestConfig };
  return (config.projects ?? []).map((project) => project.name ?? "");
}

describe("Playwright projects", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("runs chromium desktop and Pixel 5 by default", async () => {
    vi.stubEnv("E2E_ALL_BROWSERS", "");
    expect(await projectNames()).toEqual(["chromium", "pixel-5"]);
  });

  it.each(["1", "true", "TRUE"])(
    "adds firefox and webkit when E2E_ALL_BROWSERS is %s",
    async (value) => {
      vi.stubEnv("E2E_ALL_BROWSERS", value);
      expect(await projectNames()).toEqual([
        "chromium",
        "pixel-5",
        "firefox",
        "webkit",
      ]);
    },
  );

  it.each(["0", "false", "no"])(
    "keeps the default projects when E2E_ALL_BROWSERS is %s",
    async (value) => {
      vi.stubEnv("E2E_ALL_BROWSERS", value);
      expect(await projectNames()).toEqual(["chromium", "pixel-5"]);
    },
  );

  // Lists the harness tests as "<project> › <describe> › <title>" lines.
  function listed(): string[] {
    const out = execFileSync(
      resolve("node_modules/.bin/playwright"),
      ["test", "--list", "e2e/harness.spec.mts"],
      { encoding: "utf8", env: { ...process.env, E2E_ALL_BROWSERS: "" } },
    );
    return out
      .split("\n")
      .filter((line) => line.includes("›"))
      .map((line) => line.trim().replace(/ › harness\.spec\.mts:\d+:\d+/, ""));
  }

  it("runs phone tests on Pixel 5 only, and the rest on chromium only", () => {
    const lines = listed();
    const phone =
      "Page sweep harness on a Pixel 5 › passes a page that fits the phone";
    const desktop = "E2E harness › axe check passes on a clean page";
    expect(lines).toContain(`[pixel-5] › ${phone}`);
    expect(lines).not.toContain(`[chromium] › ${phone}`);
    expect(lines).toContain(`[chromium] › ${desktop}`);
    expect(lines).not.toContain(`[pixel-5] › ${desktop}`);
  });
});
