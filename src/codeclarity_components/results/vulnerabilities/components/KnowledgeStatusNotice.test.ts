import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import KnowledgeStatusNotice from "./KnowledgeStatusNotice.vue";

// Runs the real repository so only the network is faked.
vi.unmock("@/utils/api/BaseRepository");
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("vue-sonner", () => ({ toast }));
const auth = vi.hoisted(() => ({ getAuthenticated: true, getToken: "token" }));
vi.mock("@/stores/auth", () => ({ useAuthStore: () => auth }));
vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ getDefaultOrg: { id: "org-1" } }),
}));

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
  "licenses",
  "nvd",
  "osv",
];

// Builds all seven sources, healthy unless overridden.
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

const SNAPSHOT_URL =
  "/org/org-1/projects/project-1/analysis/analysis-1/vulnerabilities/knowledge-snapshot";

// Answers the current status request, and the snapshot request with no snapshot unless given.
function respondWith(
  body: object,
  status = 200,
  snapshot: { body: object; status?: number } = { body: { data: null } },
): void {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = input instanceof Request ? input.url : input.toString();
    let answer: { body: object; status?: number } = { body: {}, status: 404 };
    if (url.includes(SNAPSHOT_URL)) answer = snapshot;
    else if (url.includes("/knowledge/status")) answer = { body, status };
    return Promise.resolve(
      new Response(JSON.stringify(answer.body), {
        status: answer.status ?? 200,
      }),
    );
  });
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

async function mountNotice(): Promise<ReturnType<typeof mount>> {
  const wrapper = mount(KnowledgeStatusNotice, {
    props: { analysisID: "analysis-1", projectID: "project-1" },
  });
  await flushPromises();
  return wrapper;
}

describe("KnowledgeStatusNotice", () => {
  beforeEach(() => {
    auth.getAuthenticated = true;
    toast.error.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("names each stale or failed source and no healthy one", async () => {
    respondWith(
      statusBody({
        nvd: { status: "stale", watermark: "2026-11-01T00:00:00.000Z" },
        friends_of_php: { status: "failed", last_outcome: "failure" },
      }),
    );

    const text = (await mountNotice()).text();

    expect(text).toContain("NVD");
    expect(text).toContain("FriendsOfPHP");
    expect(text).not.toContain("OSV");
    expect(text).not.toContain("EPSS");
  });

  it("shows nothing when every source is healthy", async () => {
    respondWith(statusBody());

    expect((await mountNotice()).text()).toBe("");
  });

  it("shows nothing and no error when the status request fails", async () => {
    respondWith({}, 500);
    const warn = vi.spyOn(console, "warn");

    const wrapper = await mountNotice();

    expect(wrapper.text()).toBe("");
    expect(toast.error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("shows nothing when the network is down", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("offline"));

    expect((await mountNotice()).text()).toBe("");
  });

  it("does not request status for a signed-out user", async () => {
    auth.getAuthenticated = false;

    await mountNotice();

    expect(fetch).not.toHaveBeenCalled();
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

    const text = (await mountNotice()).text();

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

    const text = (await mountNotice()).text();

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

    const items = (await mountNotice()).findAll("li").map((li) => li.text());

    expect(items.find((item) => item.startsWith("NVD"))).toMatch(
      /last update failed/i,
    );
    expect(items.find((item) => item.startsWith("OSV"))).toMatch(
      /out of date/i,
    );
  });

  it("says the notice reflects current status", async () => {
    respondWith(statusBody({ nvd: { status: "stale" } }));

    expect((await mountNotice()).text()).toMatch(/current status/i);
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

    expect((await mountNotice()).text()).not.toMatch(/in progress|running/i);
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

    const text = (await mountNotice()).text();

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

    const wrapper = await mountNotice();

    expect(wrapper.text()).toContain("OSV");
    expect(wrapper.text()).toMatch(/current status/i);
    expect(toast.error).not.toHaveBeenCalled();
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

    const text = (await mountNotice()).text();

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

    const wrapper = await mountNotice();
    const items = wrapper.findAll("li").map((li) => li.text());

    expect(items).toHaveLength(1);
    expect(items[0]).toMatch(/^NVD: Status could not be read/);
    expect(wrapper.text()).not.toContain("new installation");
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

    expect((await mountNotice()).text()).toMatch(/as of June 1, 2026/);
  });
});
