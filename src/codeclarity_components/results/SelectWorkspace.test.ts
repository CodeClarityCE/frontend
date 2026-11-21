import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { analysisPath } from "../../../tests/fixtures/results";
import { createTestApp, type TestApp } from "../../../tests/real-app";

import SelectWorkspace from "./SelectWorkspace.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

async function signedIn(workspaces: string[]): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  app.http.on("GET", `${analysisPath}/sbom/workspaces`, {
    data: { workspaces, package_manager: "npm" },
  });
  return app;
}

// Opens the workspace select from the keyboard (jsdom has no pointer capture).
async function openWorkspaces(): Promise<void> {
  screen.getByRole("combobox", { name: "Workspace" }).focus();
  await userEvent.keyboard("{Enter}");
}

function show(app: TestApp): ReturnType<typeof render> {
  return render(SelectWorkspace, {
    props: { projectID: "p-1", analysisID: "a-1" },
    global: app.global,
  });
}

describe("SelectWorkspace", () => {
  it("offers the workspaces of the analysis", async () => {
    show(await signedIn([".", "workspace1", "workspace2"]));
    await flushPromises();

    await openWorkspaces();

    expect(
      screen.getAllByRole("option").map((option) => option.textContent?.trim()),
    ).toEqual(["Root", "workspace1", "workspace2"]);
  });

  it("selects the workspace the user picks", async () => {
    const view = show(await signedIn([".", "workspace1", "workspace2"]));
    await flushPromises();

    await openWorkspaces();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(view.emitted("update:selected_workspace")?.at(-1)).toEqual([
      "workspace2",
    ]);
  });

  it("names the only workspace instead of offering a choice", async () => {
    show(await signedIn(["."]));
    await flushPromises();

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Root")).toBeTruthy();
  });

  it("reports an error when the workspaces cannot be loaded", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    app.http.on("GET", `${analysisPath}/sbom/workspaces`, {}, 500);
    const view = show(app);
    await flushPromises();

    expect(view.emitted("update:error")).toEqual([[true]]);
  });

  it("asks for nothing while signed out", async () => {
    const app = createTestApp();
    show(app);
    await flushPromises();

    expect(app.http.requests).toEqual([]);
  });

  it("selects the first workspace when the analysis has no root workspace", async () => {
    const view = show(await signedIn(["api", "frontend"]));
    await flushPromises();

    expect(view.emitted("update:selected_workspace")).toEqual([["api"]]);
  });

  it("keeps the root workspace when the analysis has one", async () => {
    const view = show(await signedIn([".", "packages/a"]));
    await flushPromises();

    expect(view.emitted("update:selected_workspace")).toBeUndefined();
  });
});
