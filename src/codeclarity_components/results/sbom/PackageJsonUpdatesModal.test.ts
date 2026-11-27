import { fireEvent, render, screen, within } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createTestApp, withToaster } from "../../../../tests/real-app";

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

  describe("when the browser refuses the clipboard write", () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown): void => {
      unhandled.push(reason);
    };

    afterEach(() => {
      process.off("unhandledRejection", onUnhandled);
      unhandled.length = 0;
      vi.unstubAllGlobals();
    });

    it("says it couldn't copy instead of failing", async () => {
      process.on("unhandledRejection", onUnhandled);
      const writeText = vi
        .fn<(text: string) => Promise<void>>()
        .mockRejectedValue(
          new DOMException(
            "Failed to execute 'writeText' on 'Clipboard': Write permission denied.",
            "NotAllowedError",
          ),
        );
      vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
      const app = createTestApp({ signedIn: true });
      render(
        withToaster(PackageJsonUpdatesModal, {
          open: true,
          updates: [lodash],
          packageManager: "npm",
        }),
        { global: app.global },
      );
      const dialog = await screen.findByRole("dialog", {
        name: "Update direct dependencies",
      });

      await fireEvent.click(
        within(dialog).getByRole("button", { name: "Copy commands" }),
      );

      expect(writeText).toHaveBeenCalledWith("npm install lodash@^4.17.21");
      expect(
        await screen.findByText(
          "Couldn't copy. Select the text and copy it yourself.",
        ),
      ).toBeTruthy();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(unhandled).toEqual([]);
      expect(app.http.requests.some((r) => r.path === "/logs")).toBe(false);
    });
  });
});
