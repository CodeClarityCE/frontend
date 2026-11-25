import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { createTestApp, type TestApp } from "../../../../tests/real-app";

import OrganizationCreate from "./OrganizationCreate.vue";

function open(): TestApp {
  const app = createTestApp({ signedIn: true });
  render(OrganizationCreate, { global: app.global });
  return app;
}

function submit(): Promise<void> {
  return userEvent.click(
    screen.getByRole("button", { name: "Create organisation" }),
  );
}

describe("OrganizationCreate validation", () => {
  it("asks for a name and a description when both are untouched", async () => {
    const app = open();

    await submit();

    expect(await screen.findByText("A name is required")).toBeVisible();
    expect(screen.getByText("A description is required")).toBeVisible();
    expect(app.http.requests.some((r) => r.method === "POST")).toBe(false);
  });

  it("counts a blank name as too short", async () => {
    open();

    await userEvent.type(screen.getByLabelText("Name"), "   ");
    await userEvent.type(screen.getByLabelText("Description"), "Lab");
    await submit();

    expect(await screen.findByText("At least 2 characters")).toBeVisible();
  });

  it("rejects a name over 50 characters", async () => {
    open();

    await userEvent.type(screen.getByLabelText("Name"), "a".repeat(51));
    await userEvent.type(screen.getByLabelText("Description"), "Lab");
    await submit();

    expect(await screen.findByText("At most 50 characters")).toBeVisible();
  });
});
