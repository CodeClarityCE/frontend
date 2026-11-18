import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import PackageJsonUpdatesModal from "./PackageJsonUpdatesModal.vue";
import type { PackageUpdate } from "./utils/packageManagerUtils";

// The real helpers, so dialogs behave as in the browser.
vi.mock("@vueuse/core", async () => await vi.importActual("@vueuse/core"));

const lodash: PackageUpdate = {
  name: "lodash",
  currentVersion: "4.17.20",
  latestVersion: "4.17.21",
  isDev: false,
  isProd: true,
  ecosystem: "npm",
};
const monolog: PackageUpdate = {
  name: "monolog/monolog",
  currentVersion: "2.9.1",
  latestVersion: "3.5.0",
  isDev: false,
  isProd: true,
  ecosystem: "packagist",
};

function show(props: {
  updates: PackageUpdate[];
  packageManager?: string;
  packageManagers?: Record<string, string>;
}): Promise<HTMLElement> {
  render(PackageJsonUpdatesModal, { props: { open: true, ...props } });
  return screen.findByRole("dialog", { name: "Update direct dependencies" });
}

describe("PackageJsonUpdatesModal", () => {
  it("gives one manager's commands for a single-manager workspace", async () => {
    const dialog = await show({ updates: [lodash], packageManager: "npm" });
    expect(within(dialog).getByLabelText("Update commands").textContent).toBe(
      "npm install lodash@^4.17.21",
    );
    expect(dialog.textContent).toContain("package.json changes");
  });

  it("gives npm and Composer their own commands in a mixed workspace", async () => {
    const dialog = await show({
      updates: [lodash, monolog],
      packageManager: "multi-language",
      packageManagers: { npm: "NPM", packagist: "COMPOSER" },
    });

    expect(
      within(dialog).getByLabelText("npm update commands").textContent,
    ).toBe("npm install lodash@^4.17.21");
    expect(
      within(dialog).getByLabelText("composer update commands").textContent,
    ).toBe("composer require monolog/monolog:^3.5.0");

    const npmManifest = within(dialog).getByLabelText("package.json changes");
    expect(JSON.parse(npmManifest.textContent ?? "")).toEqual({
      dependencies: { lodash: "^4.17.21" },
    });
    const composerManifest = within(dialog).getByLabelText(
      "composer.json changes",
    );
    expect(JSON.parse(composerManifest.textContent ?? "")).toEqual({
      require: { "monolog/monolog": "^3.5.0" },
    });

    expect(dialog.textContent).not.toContain("could not tell");
  });
});
