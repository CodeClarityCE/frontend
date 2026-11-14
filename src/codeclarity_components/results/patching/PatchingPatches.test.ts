import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PatchingPatches from "./PatchingPatches.vue";

const repo = vi.hoisted(() => ({ getPatchesManifest: vi.fn() }));
vi.mock("@/codeclarity_components/results/results.repository", () => ({
  ResultsRepository: class {
    getPatchesManifest = repo.getPatchesManifest;
  },
}));
vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "token" }),
}));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));
const toasts = vi.hoisted(() => ({
  successToast: vi.fn(),
  errorToast: vi.fn(),
}));
vi.mock("@/utils/toasts", () => toasts);

const upgrade = (patch_type: string, vulnerable: boolean, to = "") => ({
  vulnerable,
  patch_type,
  original_constraint: "^1.0.0",
  upgrade_to: to,
});

function manifest(package_manager = "NPM") {
  return {
    patched_manifest_raw: { name: "web" },
    patched_manifest: {
      name: "web",
      version: "1.0.0",
      dependencies: {
        express: upgrade("FULL", true, "^4.21.2"),
        request: upgrade("NONE", true),
        ms: upgrade("NONE", false),
      },
      devDependencies: { vitest: upgrade("PARTIAL", true, "^3.2.4") },
    },
    other_info: { package_manager, relative_package_file: "app/package.json" },
  };
}

async function show(data = manifest()): Promise<void> {
  repo.getPatchesManifest.mockResolvedValue({ data });
  render(PatchingPatches, { props: { analysisID: "a-1", projectID: "p-1" } });
  await flushPromises();
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
      "express ^1.0.0 to ^4.21.2 Full patch",
      "request ^1.0.0 No patch",
      "ms ^1.0.0 Not vulnerable",
    ]);
    expect(changes("Development dependencies")).toEqual([
      "vitest ^1.0.0 to ^3.2.4 Partial patch",
    ]);
  });

  it("copies the patched manifest", async () => {
    await show();
    await userEvent.click(
      screen.getByRole("button", { name: "Copy the patched manifest" }),
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify({ name: "web" }, null, 2),
    );
    expect(toasts.successToast).toHaveBeenCalledWith("Copied to the clipboard");
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
    repo.getPatchesManifest.mockRejectedValue(new Error("none"));
    render(PatchingPatches, { props: { analysisID: "a-1", projectID: "p-1" } });
    await flushPromises();
    expect(screen.queryByText("Patched manifest")).toBeNull();
  });
});
