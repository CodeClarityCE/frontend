import { defineConfig, devices } from "@playwright/test";

// The E2E_* settings are described under "Run End-to-End Tests" in the README.
const liveBaseURL = process.env.E2E_BASE_URL;
const hostResolverRules = process.env.E2E_HOST_RESOLVER_RULES;
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const port = Number(process.env.E2E_PORT ?? 4173);
const localURL = `http://127.0.0.1:${port}`;
// Only "1" or "true" turns the extra browsers on, so "0" leaves them off.
const allBrowsers = /^(1|true)$/i.test(process.env.E2E_ALL_BROWSERS ?? "");

// Chromium options shared by the desktop and Pixel 5 projects.
const chromiumLaunch = {
  ...(chromiumPath ? { executablePath: chromiumPath } : {}),
  args: hostResolverRules ? [`--host-resolver-rules=${hostResolverRules}`] : [],
};

// Tests tagged @phone (describeOnAPhone in e2e/helpers/phone.mts) run on
// Pixel 5 only; every other test runs on the desktop projects.
const PHONE = /@phone/;

const defaultProjects = [
  {
    name: "chromium",
    grepInvert: PHONE,
    use: { ...devices["Desktop Chrome"], launchOptions: chromiumLaunch },
  },
  {
    name: "pixel-5",
    grep: PHONE,
    use: {
      ...devices["Pixel 5"],
      // The 390px phone screenshot width.
      viewport: { width: 390, height: 844 },
      launchOptions: chromiumLaunch,
    },
  },
];

const extraBrowsers = [
  {
    name: "firefox",
    grepInvert: PHONE,
    use: { ...devices["Desktop Firefox"] },
  },
  {
    name: "webkit",
    grepInvert: PHONE,
    use: { ...devices["Desktop Safari"] },
  },
];

// Only against a real stack: one journey, no retries, a trace kept on failure.
const realStackProjects = liveBaseURL
  ? [
      {
        name: "real-stack",
        testDir: "./e2e/real-stack",
        testMatch: "**/*.journey.mts",
        retries: 0,
        timeout: 6 * 60 * 1000,
        use: {
          ...devices["Desktop Chrome"],
          viewport: { width: 1280, height: 1024 },
          trace: "retain-on-failure",
          launchOptions: chromiumLaunch,
        },
      },
    ]
  : [];

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
    baseURL: liveBaseURL ?? localURL,
    ignoreHTTPSErrors: !!liveBaseURL,

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video recording */
    video: "retain-on-failure",
  },

  projects: [
    ...defaultProjects,
    ...(allBrowsers ? extraBrowsers : []),
    ...realStackProjects,
  ],

  /* Run your local dev server before starting the tests */
  webServer: liveBaseURL
    ? undefined
    : {
        // Local binaries, not pnpm scripts, so a run never triggers an install.
        command: `node_modules/.bin/vite build && node_modules/.bin/vite preview --host 127.0.0.1 --port ${port} --strictPort`,
        url: localURL,
        reuseExistingServer: false,
        timeout: 180 * 1000,
      },

  /* Global timeout for each test */
  timeout: 30 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 5 * 1000,
  },
});
