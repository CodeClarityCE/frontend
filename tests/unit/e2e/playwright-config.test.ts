import type { PlaywrightTestConfig } from "@playwright/test";
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

  it("adds firefox and webkit when E2E_ALL_BROWSERS is set", async () => {
    vi.stubEnv("E2E_ALL_BROWSERS", "1");
    expect(await projectNames()).toEqual([
      "chromium",
      "pixel-5",
      "firefox",
      "webkit",
    ]);
  });
});
