import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import FreshnessThresholdSetting from "@/codeclarity_components/organizations/manage/FreshnessThresholdSetting.vue";

import { createTestApp, type TestApp, withToaster } from "../../../../real-app";

const settingsPath = "/org/org-1/settings";

function openSetting(): TestApp {
  const app = createTestApp({ signedIn: true });
  app.http.on("PATCH", settingsPath, { status_code: 200, status: "success" });
  render(withToaster(FreshnessThresholdSetting, { orgId: "org-1", days: 14 }), {
    global: app.global,
  });
  return app;
}

const sent = (app: TestApp): unknown[] =>
  app.http.requests
    .filter((r) => r.method === "PATCH" && r.path === settingsPath)
    .map((r) => r.body);

describe("FreshnessThresholdSetting", () => {
  it("saves the number of days after which a project is stale", async () => {
    const app = openSetting();
    const input = screen.getByLabelText<HTMLInputElement>("Stale after (days)");
    expect(input.value).toBe("14");

    await userEvent.clear(input);
    await userEvent.type(input, "30");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Projects are now stale after 30 days"),
    ).toBeInTheDocument();
    expect(sent(app)).toEqual([{ freshness_threshold_days: 30 }]);
  });

  it("does not send an empty number of days", async () => {
    const app = openSetting();

    await userEvent.clear(screen.getByLabelText("Stale after (days)"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a whole number of days from 1 to 365.",
    );
    expect(sent(app)).toEqual([]);
  });

  it("does not send a number of days outside 1 to 365", async () => {
    const app = openSetting();
    const input = screen.getByLabelText<HTMLInputElement>("Stale after (days)");

    await userEvent.clear(input);
    await userEvent.type(input, "400");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(input.validity.rangeOverflow).toBe(true);
    expect(sent(app)).toEqual([]);
  });
});
