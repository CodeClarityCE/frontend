import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp, type TestApp } from "../../../../../tests/real-app";

import LocalUploadComponent from "./LocalUploadComponent.vue";

// The upload form with an archive picked, so its submit button is enabled.
async function openWithArchive(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  render(LocalUploadComponent, { global: app.global });
  const archive = new File(["zip"], "project.zip", { type: "application/zip" });
  await userEvent.upload(screen.getByLabelText("Archive"), archive);
  return app;
}

function submit(): Promise<void> {
  return userEvent.click(
    screen.getByRole("button", { name: "Create project and upload" }),
  );
}

describe("LocalUploadComponent validation", () => {
  it("asks for a name when it is left empty and sends nothing", async () => {
    const app = await openWithArchive();

    await submit();

    expect(
      await screen.findByText("A name of at least 2 characters is required"),
    ).toBeVisible();
    expect(app.http.requests.some((r) => r.method === "POST")).toBe(false);
  });

  it("counts a blank name as too short", async () => {
    await openWithArchive();

    await userEvent.type(screen.getByLabelText("Name"), "   ");
    await submit();

    expect(
      await screen.findByText("A name of at least 2 characters is required"),
    ).toBeVisible();
  });

  it("rejects a name over 100 characters and a description over 500", async () => {
    await openWithArchive();

    await userEvent.click(screen.getByLabelText("Name"));
    await userEvent.paste("n".repeat(101));
    await userEvent.click(screen.getByLabelText("Description (optional)"));
    await userEvent.paste("d".repeat(501));
    await submit();

    expect(await screen.findByText("At most 500 characters")).toBeVisible();
    expect(screen.getByText("At most 100 characters")).toBeVisible();
  });
});
