import { defineConfig, devices } from "@playwright/test";

/*
 * Running against the live dev stack instead of a local preview server:
 * - E2E_BASE_URL (e.g. https://localhost): target that URL and skip webServer.
 *   The dev stack uses a self-signed cert, so HTTPS errors are ignored then.
 * - E2E_HOST_RESOLVER_RULES (e.g. "MAP localhost 172.17.0.1"): Chromium host
 *   mapping, for a sandbox where the stack is published on the Docker gateway
 *   but Caddy only answers for the "localhost" server name.
 * - PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH: use a system Chromium instead of a
 *   Playwright-downloaded one.
 */
const liveBaseURL = process.env.E2E_BASE_URL;
const hostResolverRules = process.env.E2E_HOST_RESOLVER_RULES;
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

/**
 * Playwright configuration for CodeClarity E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.mts",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [["html", { open: "never" }], ["list"]],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: liveBaseURL ?? "http://localhost:4173",
    ignoreHTTPSErrors: !!liveBaseURL,

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video recording */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          ...(chromiumPath ? { executablePath: chromiumPath } : {}),
          args: hostResolverRules
            ? [`--host-resolver-rules=${hostResolverRules}`]
            : [],
        },
      },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: liveBaseURL
    ? undefined
    : {
        command: "pnpm preview",
        url: "http://localhost:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },

  /* Global timeout for each test */
  timeout: 30 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 5 * 1000,
  },
});
