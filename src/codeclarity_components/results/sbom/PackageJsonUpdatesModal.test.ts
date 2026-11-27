import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp } from "../../../../tests/real-app";

import PackageJsonUpdatesModal from "./PackageJsonUpdatesModal.vue";
import type { PackageUpdate } from "./utils/packageManagerUtils";

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
  render(PackageJsonUpdatesModal, {
    props: { open: true, ...props },
    global: createTestApp().global,
  });
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

  it.each([
    [
      "npm",
      "package.json",
      "npm install",
      "package-lock.json",
      "npm install writes the new ranges to package.json too.",
    ],
    [
      "yarn",
      "package.json",
      "yarn install",
      "yarn.lock",
      "yarn add writes the new ranges to package.json too.",
    ],
    [
      "pnpm",
      "package.json",
      "pnpm install",
      "pnpm-lock.yaml",
      "pnpm add writes the new ranges to package.json too.",
    ],
    [
      "bun",
      "package.json",
      "bun install",
      "bun.lock",
      "bun add writes the new ranges to package.json too.",
    ],
    [
      "composer",
      "composer.json",
      "composer update --lock",
      "composer.lock",
      "composer require writes the new constraints to composer.json too.",
    ],
  ])(
    "names %s's manifest, install command, lockfile and help",
    async (manager, manifest, install, lockfile, help) => {
      const dialog = await show({ updates: [lodash], packageManager: manager });
      const text = (dialog.textContent ?? "").replace(/\s+/g, " ");

      expect(text).toContain(`${manifest} changes`);
      expect(text).toContain(
        `Merge it into ${manifest}, then run ${install} to update the lockfile.`,
      );
      expect(text).toContain(
        `The commands update ${lockfile} for you. ${help}`,
      );
    },
  );

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
