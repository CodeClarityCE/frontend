import { expect, type Locator, type Page } from "@playwright/test";

interface Options {
  timeout?: number;
}

/**
 * Compares a region's accessibility tree with `<name>.aria.yml` in the spec's
 * snapshot folder. Every node and name in the file must be on the page, in
 * order; nodes the file does not list are allowed, as Playwright's own
 * generated snapshots leave out text that repeats an element's name.
 */
export async function expectAriaSnapshot(
  region: Locator,
  name: string,
  options: Options = {},
): Promise<void> {
  await expect(region).toMatchAriaSnapshot({
    name: `${name}.aria.yml`,
    ...options,
  });
}

/**
 * Snapshots the page's `main` landmark only, so the shell stays out of page
 * snapshots: `await expectMainSnapshot(page, "projects-list")`.
 */
export async function expectMainSnapshot(
  page: Page,
  name: string,
  options: Options = {},
): Promise<void> {
  await expectAriaSnapshot(page.getByRole("main"), name, options);
}
