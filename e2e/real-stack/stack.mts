import { expect, type Page } from "@playwright/test";

import { type Dependency, npmProjectArchive } from "./npm-project.mjs";

// What the golden journeys share: the dev account, waits sized for a real stack, and the steps
// several journeys take the same way a user does.

/** The account `stack.sh up` creates, as on the dev stack. */
export const DEV_ACCOUNT = {
  email: "john.doe@codeclarity.io",
  password: "ThisIs4Str0ngP4ssW0rd?",
  name: "John Doe",
};

// Real responses take longer than mocks, and analyses run in the background.
export const LOADED = { timeout: 30_000 };
const ANALYSED = { timeout: 4 * 60_000 };

/** A name no earlier run on the same stack used, so a rerun finds its own data. */
export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/** Signs in from the login page and waits to leave it. */
export async function logIn(
  page: Page,
  account: { email: string; password: string } = DEV_ACCOUNT,
): Promise<void> {
  await page.goto("/login");
  await page.getByPlaceholder("Enter your email").fill(account.email);
  await page.getByPlaceholder("Enter your password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/, LOADED);
}

/** Imports an npm project by uploading its archive, as the Add project page offers. */
export async function uploadProject(
  page: Page,
  name: string,
  dependency?: Dependency,
): Promise<void> {
  await page.goto("/projects/add");
  await page.getByRole("button", { name: /Upload an archive/ }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Archive", { exact: true }).setInputFiles({
    name: "journey-app.tar.gz",
    mimeType: "application/gzip",
    buffer: npmProjectArchive(dependency),
  });
  await page.getByRole("button", { name: "Create project and upload" }).click();
  await expect(page).toHaveURL(/\/projects$/, LOADED);
}

/** Starts the Default Analyzer on project `name` and opens its results once it is done. */
export async function analyse(page: Page, name: string): Promise<void> {
  await page.goto("/projects");
  const row = page.getByTestId("project-row").filter({ hasText: name });
  const analyses = row.getByRole("button", { name: new RegExp(`of ${name}$`) });
  await expect(row).toBeVisible(LOADED);
  const before = (await analyses.count())
    ? Number.parseInt((await analyses.textContent()) ?? "0", 10)
    : 0;
  await page
    .getByRole("link", { name: `New analysis of ${name}` })
    .click(LOADED);
  await page.getByRole("radio", { name: /Default Analyzer/ }).click(LOADED);
  await page.getByRole("button", { name: "Start Analysis" }).click();
  await expect(page).toHaveURL(/\/projects$/, LOADED);
  // The list polls while the analysis runs; the newest one is listed first.
  await expect(analyses).toHaveText(
    `${before + 1} ${before === 0 ? "analysis" : "analyses"}`,
    LOADED,
  );
  await expect(row).toContainText("Completed", ANALYSED);
  await page.getByRole("link", { name: `Results of ${name}` }).click(LOADED);
  await expect(page).toHaveURL(/\/results/, LOADED);
}

/** Opens the latest results of project `name` from the projects list. */
export async function openResults(page: Page, name: string): Promise<void> {
  await page.goto("/projects");
  await page.getByRole("link", { name: `Results of ${name}` }).click(LOADED);
  await expect(page).toHaveURL(/\/results/, LOADED);
}

/** The cards of the Vulnerabilities tab of an open results page. */
export async function vulnerabilityCards(page: Page) {
  await page.getByRole("tab", { name: "Vulnerabilities" }).click(LOADED);
  return page
    .getByRole("list", { name: "Vulnerabilities" })
    .getByRole("article");
}
