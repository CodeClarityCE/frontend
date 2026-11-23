import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";

import { Toaster } from "@/shadcn/ui/sonner";
import { APIErrors } from "@/utils/api/ApiErrors";

import { analysisPath } from "../../../../../tests/fixtures/results";
import { createTestApp, type TestApp } from "../../../../../tests/real-app";

import SourceVerdictExportMenu from "./SourceVerdictExportMenu.vue";

const EXPORT_PATH = `${analysisPath}/vulnerabilities/source-verdicts`;

// The browser's file download, which jsdom cannot do.
const { saveBlob } = vi.hoisted(() => ({ saveBlob: vi.fn() }));
vi.mock("@/utils/download", () => ({ saveBlob }));

let app: TestApp;

// The files the browser was asked to save, as [blob, name] pairs.
const saved = (): [Blob, string][] => saveBlob.mock.calls as [Blob, string][];

// Opens the menu, next to the app's toaster, and picks a format.
async function exportAs(name: "CSV" | "JSON"): Promise<void> {
  render(
    {
      render: () =>
        h("div", [
          h(SourceVerdictExportMenu, { analysisID: "a-1", projectID: "p-1" }),
          h(Toaster),
        ]),
    },
    { global: app.global },
  );
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: /Export source verdicts/ }),
  );
  await user.click(
    await screen.findByRole("menuitem", {
      name: (text) => text.startsWith(name),
    }),
  );
  await flushPromises();
}

describe("SourceVerdictExportMenu", () => {
  beforeEach(async () => {
    app = createTestApp({ signedIn: true });
    await app.visit("/projects");
    saveBlob.mockClear();
  });

  it.each([
    ["CSV", "csv"],
    ["JSON", "json"],
  ] as const)("saves the %s export of the analysis", async (name, format) => {
    app.http.on("GET", EXPORT_PATH, "rows");

    await exportAs(name);

    const request = app.http.requests.find((r) => r.path === EXPORT_PATH);
    expect(request?.query.get("format")).toBe(format);
    expect(saved().map(([, name]) => name)).toEqual([
      `source-verdicts-a-1.${format}`,
    ]);
    expect(await saved()[0]?.[0].text()).toBe("rows");
  });

  it("says the analysis predates source verdicts when the API has none", async () => {
    app.http.on(
      "GET",
      EXPORT_PATH,
      {
        error_code: APIErrors.SourceVerdictsNotAvailable,
        error_message: "none",
      },
      404,
    );

    await exportAs("CSV");

    expect(saved()).toEqual([]);
    expect(
      await screen.findByText(
        "This analysis predates source verdicts. Re-run it to export them.",
      ),
    ).toBeTruthy();
  });

  it("reports any other failure", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("network")));

    await exportAs("JSON");

    expect(saved()).toEqual([]);
    expect(
      await screen.findByText("Could not export the source verdicts"),
    ).toBeTruthy();
  });
});
