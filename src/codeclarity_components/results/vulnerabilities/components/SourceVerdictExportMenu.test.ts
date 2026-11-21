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

let app: TestApp;
let urls: URL[];
let saved: { name: string; blob: Blob }[];

// Records the URLs sent and the files the browser was asked to save; jsdom has no object URLs.
function watchBrowser(): void {
  urls = [];
  saved = [];
  const answerRequest = globalThis.fetch;
  vi.stubGlobal("fetch", (input: string | URL, init?: RequestInit) => {
    urls.push(new URL(String(input)));
    return answerRequest(input, init);
  });
  const blobs = new Map<string, Blob>();
  Object.assign(URL, {
    createObjectURL: (blob: Blob) => {
      const url = `blob:test/${blobs.size}`;
      blobs.set(url, blob);
      return url;
    },
    revokeObjectURL: () => undefined,
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    const blob = blobs.get(this.getAttribute("href") ?? "");
    if (blob) saved.push({ name: this.download, blob });
  });
}

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
    watchBrowser();
  });

  it.each([
    ["CSV", "csv"],
    ["JSON", "json"],
  ] as const)("saves the %s export of the analysis", async (name, format) => {
    app.http.on("GET", EXPORT_PATH, "rows");

    await exportAs(name);

    const request = urls.find((url) => url.pathname.endsWith(EXPORT_PATH));
    expect(request?.searchParams.get("format")).toBe(format);
    expect(saved.map((file) => file.name)).toEqual([
      `source-verdicts-a-1.${format}`,
    ]);
    expect(await saved[0]?.blob.text()).toBe('"rows"');
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

    expect(saved).toEqual([]);
    expect(
      await screen.findByText(
        "This analysis predates source verdicts. Re-run it to export them.",
      ),
    ).toBeTruthy();
  });

  it("reports any other failure", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("network")));

    await exportAs("JSON");

    expect(saved).toEqual([]);
    expect(
      await screen.findByText("Could not export the source verdicts"),
    ).toBeTruthy();
  });
});
