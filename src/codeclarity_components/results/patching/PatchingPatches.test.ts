import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "vue-sonner";

import { analysisPath } from "../../../../tests/fixtures/results";
import { createTestApp, type TestApp } from "../../../../tests/real-app";

import PatchingPatches from "./PatchingPatches.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const upgrade = (
  patch_type: string | null,
  vulnerable: boolean,
  to: string | null = null,
) => ({
  original_constraint: "^1.0.0",
  vulnerable,
  patch_type,
  upgrade_to: to,
  potential_breaking_changes: false,
});

function manifest(package_manager = "NPM") {
  return {
    patched_manifest_raw:
      '{\n  "dependencies": {\n    "express": "^4.21.2"\n  }\n}',
    patched_manifest: {
      dependencies: {
        express: upgrade("FULL", true, "4.21.2"),
        request: upgrade("NONE", true),
        ms: upgrade(null, false),
      },
      devDependencies: { vitest: upgrade("PARTIAL", true, "3.2.4") },
    },
    other_info: { package_manager, relative_package_file: "app/package.json" },
  };
}

// Opens the patched manifest of analysis a-1 next to the app's toaster.
async function show(data: unknown = manifest()): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  if (data) app.http.on("GET", `${analysisPath}/patching/manifest`, { data });
  render(Toaster, { global: app.global });
  render(PatchingPatches, {
    props: { analysisID: "a-1", projectID: "p-1" },
    global: app.global,
  });
  await flushPromises();
  return app;
}

function changes(heading: string): string[] {
  const section = screen.getByRole("heading", { name: heading }).parentElement!;
  return within(section)
    .getAllByRole("listitem")
    .map((item) => item.textContent?.replace(/\s+/g, " ").trim() ?? "");
}

describe("PatchingPatches", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("lists each dependency change with its patch status", async () => {
    await show();
    expect(changes("Dependencies")).toEqual([
      "express ^1.0.0 to 4.21.2 Full patch",
      "request ^1.0.0 No patch",
      "ms ^1.0.0 Not vulnerable",
    ]);
    expect(changes("Development dependencies")).toEqual([
      "vitest ^1.0.0 to 3.2.4 Partial patch",
    ]);
  });

  it("asks to update the dependency entries of the manifest", async () => {
    await show();
    expect(
      screen.getByText(/Update these dependency entries in/).textContent,
    ).toContain("app/package.json");
  });

  it("copies the dependency entries as they are sent", async () => {
    await show();
    await userEvent.click(
      screen.getByRole("button", { name: "Copy the dependency entries" }),
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      '{\n  "dependencies": {\n    "express": "^4.21.2"\n  }\n}',
    );
    expect(await screen.findByText("Copied to the clipboard")).toBeTruthy();
  });

  it("copies the reinstall command for the package manager", async () => {
    await show(manifest("YARN"));
    expect(
      screen.getByText("rm yarn.lock ; yarn install --prefer-online"),
    ).toBeTruthy();
    await userEvent.click(
      screen.getByRole("button", { name: "Copy the command" }),
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "rm yarn.lock ; yarn install --prefer-online",
    );
  });

  it("shows nothing when there is no patched manifest", async () => {
    await show(null);
    expect(screen.queryByText("Patched manifest")).toBeNull();
  });
});
