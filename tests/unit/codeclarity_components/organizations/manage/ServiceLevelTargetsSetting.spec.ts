import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import ServiceLevelTargetsSetting from "@/codeclarity_components/organizations/manage/ServiceLevelTargetsSetting.vue";

import { createTestApp, type TestApp, withToaster } from "../../../../real-app";

const SUGGESTED = { critical: 7, high: 30, medium: 90, low: null };
const settingsPath = "/org/org-1/settings";

function openSetting(enabled = false): TestApp {
  const app = createTestApp({ signedIn: true });
  app.http.on("PATCH", settingsPath, { status_code: 200, status: "success" });
  render(
    withToaster(ServiceLevelTargetsSetting, {
      orgId: "org-1",
      enabled,
      days: SUGGESTED,
    }),
    { global: app.global },
  );
  return app;
}

const field = (label: string): HTMLInputElement =>
  screen.getByLabelText<HTMLInputElement>(label);

const sent = (app: TestApp): unknown[] =>
  app.http.requests
    .filter((r) => r.method === "PATCH" && r.path === settingsPath)
    .map((r) => r.body);

describe("ServiceLevelTargetsSetting", () => {
  it("shows the suggested days, with no target for Low", () => {
    openSetting();

    expect(field("Critical").value).toBe("7");
    expect(field("High").value).toBe("30");
    expect(field("Medium").value).toBe("90");
    expect(field("Low").value).toBe("");
    expect(
      screen.getByRole("switch", { name: "Use service level targets" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("turns targets on and saves the days, a blank field meaning no target", async () => {
    const app = openSetting();
    const typist = userEvent.setup();

    await typist.click(
      screen.getByRole("switch", { name: "Use service level targets" }),
    );
    await typist.clear(field("Critical"));
    await typist.type(field("Critical"), "3");
    await typist.clear(field("Medium"));
    await typist.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("New tickets now get due dates from the targets"),
    ).toBeInTheDocument();
    expect(sent(app)).toEqual([
      {
        service_level_targets_enabled: true,
        service_level_targets: {
          critical: 3,
          high: 30,
          medium: null,
          low: null,
        },
      },
    ]);
  });

  it("does not send days that are not whole and positive", async () => {
    const app = openSetting(true);

    await userEvent.clear(field("High"));
    await userEvent.type(field("High"), "2.5");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(field("High").validity.stepMismatch).toBe(true);
    expect(sent(app)).toEqual([]);
  });

  it("says when the member may not change the setting", async () => {
    const app = openSetting(true);
    app.http.on(
      "PATCH",
      settingsPath,
      {
        status_code: 403,
        status: "failure",
        error_code: "NotAuthorized",
        error_message: "Not authorized",
      },
      403,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(
        "You do not have permission to change this setting",
      ),
    ).toBeInTheDocument();
  });
});
