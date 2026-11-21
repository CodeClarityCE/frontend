import { render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";

import { Toaster } from "@/shadcn/ui/sonner";

import { analysisPath } from "../../../../../tests/fixtures/results";
import { createTestApp, type TestApp } from "../../../../../tests/real-app";

import KnowledgeStatusNotice from "./KnowledgeStatusNotice.vue";

const healthy = {
  status: "healthy",
  watermark: "2026-11-09T06:00:00.000Z",
  last_outcome: "success",
  last_run_started_at: "2026-11-09T05:00:00.000Z",
  last_run_finished_at: "2026-11-09T06:00:00.000Z",
  in_progress: false,
  row_count: 100,
  stale_after_hours: 24,
};

const SOURCES = [
  "cwe",
  "epss",
  "friends_of_php",
  "gcve",
  "kev",
  "licenses",
  "nvd",
  "osv",
];

// Builds every source, healthy unless overridden.
function statusBody(overrides: Record<string, object> = {}): object {
  return {
    data: {
      sources: SOURCES.map((source) => ({
        source,
        ...healthy,
        ...overrides[source],
      })),
    },
  };
}

const SNAPSHOT_PATH = `${analysisPath}/vulnerabilities/knowledge-snapshot`;

let app: TestApp;

// Answers the current status request, and the snapshot request with no snapshot unless given.
function respondWith(
  body: object,
  status = 200,
  snapshot: { body: object; status?: number } = { body: { data: null } },
): void {
  app.http.on("GET", "/knowledge/status", body, status);
  app.http.on("GET", SNAPSHOT_PATH, snapshot.body, snapshot.status ?? 200);
}

// Builds a snapshot of all seven sources, healthy unless overridden.
function snapshotBody(
  overrides: Record<string, object> = {},
  extra: object = {},
): { body: object } {
  return {
    body: {
      data: {
        taken_at: "2026-10-01T12:00:00Z",
        ...extra,
        sources: SOURCES.map((source) => ({
          source,
          status: "healthy",
          comparable: true,
          watermark: "2026-10-01T06:00:00Z",
          row_count: 100,
          last_outcome: "success",
          stale_after_hours: 24,
          ...overrides[source],
        })),
      },
    },
  };
}

// Shows the notice next to the app's toaster, so error toasts would be visible.
async function mountNotice(): Promise<HTMLElement> {
  render(
    {
      render: () =>
        h("div", [
          h(KnowledgeStatusNotice, {
            analysisID: "a-1",
            projectID: "p-1",
          }),
          h(Toaster),
        ]),
    },
    { global: app.global },
  );
  await flushPromises();
  return (
    screen.queryByTestId("knowledge-status-notice") ??
    document.createElement("div")
  );
}

// The texts of the toasts on screen.
function toasts(): string[] {
  return [...document.querySelectorAll("[data-sonner-toast]")].map(
    (toast) => toast.textContent ?? "",
  );
}

// Whether the app reported an error to the server log.
function reportedError(): boolean {
  return app.http.requests.some((request) => request.path === "/logs");
}

describe("KnowledgeStatusNotice", () => {
  beforeEach(async () => {
    app = createTestApp({ signedIn: true });
    await app.visit("/projects");
  });

  it("names each stale or failed source and no healthy one", async () => {
    respondWith(
      statusBody({
        nvd: { status: "stale", watermark: "2026-11-01T00:00:00.000Z" },
        friends_of_php: { status: "failed", last_outcome: "failure" },
      }),
    );

    const text = (await mountNotice()).textContent;

    expect(text).toContain("NVD");
    expect(text).toContain("FriendsOfPHP");
    expect(text).not.toContain("OSV");
    expect(text).not.toContain("EPSS");
  });

  it("names the KEV catalog by its publisher", async () => {
    respondWith(statusBody({ kev: { status: "stale" } }));

    expect((await mountNotice()).textContent).toContain("CISA KEV");
  });

  it("shows nothing when every source is healthy", async () => {
    respondWith(statusBody());

    expect((await mountNotice()).textContent).toBe("");
  });

  it("shows nothing and no error when the status request fails", async () => {
    respondWith({}, 500);

    expect((await mountNotice()).textContent).toBe("");
    expect(toasts()).toEqual([]);
    expect(reportedError()).toBe(false);
  });

  it("shows nothing when the network is down", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("offline")));

    expect((await mountNotice()).textContent).toBe("");
    expect(toasts()).toEqual([]);
  });

  it("does not request status for a signed-out user", async () => {
    app = createTestApp();

    await mountNotice();

    expect(app.http.requests).toEqual([]);
  });

  it("explains a source that has never run without calling it broken", async () => {
    const neverRun = {
      status: "stale",
      watermark: null,
      last_outcome: null,
      last_run_started_at: null,
      last_run_finished_at: null,
      row_count: 0,
    };
    respondWith(
      statusBody(
        Object.fromEntries(SOURCES.map((source) => [source, neverRun])),
      ),
    );

    const text = (await mountNotice()).textContent;

    expect(text).toContain("No update has been recorded yet");
    expect(text).toContain("new installation");
    expect(text).not.toMatch(/failed|out of date/i);
  });

  it("dates a backfilled source that has no recorded run", async () => {
    respondWith(
      statusBody({
        nvd: {
          status: "stale",
          last_outcome: null,
          watermark: "2025-05-27T00:00:00.000Z",
        },
      }),
    );

    const text = (await mountNotice()).textContent;

    expect(text).toContain("No update has been recorded yet");
    expect(text).toContain("2025");
  });

  it("separates a failed update from out of date data", async () => {
    respondWith(
      statusBody({
        nvd: { status: "failed", last_outcome: "failure" },
        osv: { status: "stale", watermark: "2026-11-01T00:00:00.000Z" },
      }),
    );

    await mountNotice();
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);

    expect(items.find((item) => item.startsWith("NVD"))).toMatch(
      /last update failed/i,
    );
    expect(items.find((item) => item.startsWith("OSV"))).toMatch(
      /out of date/i,
    );
  });

  it("says the notice reflects current status", async () => {
    respondWith(statusBody({ nvd: { status: "stale" } }));

    expect((await mountNotice()).textContent).toMatch(/current status/i);
  });

  it("does not claim an update is running", async () => {
    respondWith(
      statusBody({
        nvd: {
          status: "stale",
          in_progress: true,
          last_run_finished_at: null,
        },
      }),
    );

    expect((await mountNotice()).textContent).not.toMatch(
      /in progress|running/i,
    );
  });

  it("shows the sources as they were when the analysis ran", async () => {
    respondWith(
      statusBody({ osv: { status: "stale" } }),
      200,
      snapshotBody({
        nvd: {
          status: "stale",
          comparable: false,
          watermark: "2026-09-20T00:00:00Z",
        },
      }),
    );

    const text = (await mountNotice()).textContent;

    expect(text).toContain("NVD");
    expect(text).not.toContain("OSV");
    expect(text).toMatch(/when this analysis ran/i);
    expect(text).not.toMatch(/current status/i);
  });

  it("falls back to current status when the snapshot cannot be read", async () => {
    respondWith(statusBody({ osv: { status: "stale" } }), 200, {
      body: {},
      status: 500,
    });

    const text = (await mountNotice()).textContent;

    expect(text).toContain("OSV");
    expect(text).toMatch(/current status/i);
    expect(toasts()).toEqual([]);
  });

  it("uses current status when the snapshot could not read any source", async () => {
    const unknown = {
      status: "unknown",
      comparable: false,
      watermark: null,
      last_outcome: null,
      row_count: 0,
    };
    respondWith(
      statusBody({ osv: { status: "stale" } }),
      200,
      snapshotBody(
        Object.fromEntries(SOURCES.map((source) => [source, unknown])),
      ),
    );

    const text = (await mountNotice()).textContent;

    expect(text).toContain("OSV");
    expect(text).not.toContain("NVD");
    expect(text).toMatch(/current status/i);
  });

  it("says when a source's state was not recorded for the analysis", async () => {
    respondWith(
      statusBody(),
      200,
      snapshotBody({
        nvd: { status: "unknown", last_outcome: null, watermark: null },
      }),
    );

    const notice = await mountNotice();
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatch(/^NVD: Status could not be read/);
    expect(notice.textContent).not.toContain("new installation");
  });

  it("names the as-of day of an as-of analysis", async () => {
    respondWith(
      statusBody(),
      200,
      snapshotBody(
        { nvd: { status: "stale" } },
        { knowledge_asof: "2026-06-01" },
      ),
    );

    expect((await mountNotice()).textContent).toMatch(/as of June 1, 2026/);
  });
});
