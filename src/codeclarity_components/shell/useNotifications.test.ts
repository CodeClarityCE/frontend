import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import { createTestApp, type TestApp } from "../../../tests/real-app";

import {
  type Notification,
  NotificationContentType,
} from "./notification.entity";
import { useNotifications } from "./useNotifications";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const ok = { status_code: 200, status: "success" };

// The notifications page the API answers.
const page = (data: Notification[]) => ({
  data,
  entry_count: data.length,
  page: 0,
  entries_per_page: 100,
  total_entries: data.length,
  total_pages: 1,
  status: "success",
  matching_count: data.length,
  filter_count: {},
});

function note(
  id: string,
  content_type: NotificationContentType,
  content: Notification["content"] = {},
  title = `Notification ${id}`,
): Notification {
  return {
    id,
    title,
    description: `About ${id}`,
    content,
    content_type,
  } as Notification;
}

const notifications = [
  note("01", NotificationContentType.PackageUpdate, {
    package_name: "lodash",
    current_version: "1.0.0",
    new_version: "1.1.0",
    dependency_type: "development",
  }),
  note("02", NotificationContentType.VulnSummary, { project_name: "api" }),
  note("03", NotificationContentType.PackageUpdate, {
    package_name: "vue",
    current_version: "3.0.0",
    new_version: "3.1.0",
    dependency_type: "production",
  }),
  note("04", NotificationContentType.NewVersion),
  // A stable to prerelease jump is not worth recommending, so it is hidden.
  note("05", NotificationContentType.PackageUpdate, {
    package_name: "react",
    current_version: "18.0.0",
    new_version: "19.0.0-beta.1",
    dependency_type: "production",
  }),
];

let app: TestApp;

// Loads the signed-in user's notifications as the shell does.
async function loaded(
  answer: Notification[] = notifications,
): Promise<ReturnType<typeof useNotifications>> {
  app.http.on("GET", "/notifications", page(answer));
  const state = useNotifications();
  await flushPromises();
  return state;
}

beforeEach(() => {
  app = createTestApp({ signedIn: true });
  app.http.on("DELETE", "/notifications", ok);
  app.http.on("DELETE", "/notifications/02", ok);
});

describe("useNotifications", () => {
  it("lists vulnerabilities first, then production, then development updates", async () => {
    const state = await loaded();

    expect(state.pageItems.value.map((n) => n.id)).toEqual([
      "02",
      "03",
      "01",
      "04",
    ]);
    expect(state.visibleCount.value).toBe(4);
  });

  it("counts notifications per category, leaving out hidden ones", async () => {
    const state = await loaded();

    expect(state.counts.value).toEqual({
      vulnerabilities: 1,
      production: 1,
      development: 1,
      other: 1,
    });
  });

  it("filters by category and by search text", async () => {
    const state = await loaded();

    state.selectedFilter.value = "production";
    expect(state.pageItems.value.map((n) => n.id)).toEqual(["03"]);

    state.selectedFilter.value = "all";
    state.searchQuery.value = "LODASH";
    expect(state.pageItems.value.map((n) => n.id)).toEqual(["01"]);
  });

  it("pages through ten notifications at a time", async () => {
    const state = await loaded(
      Array.from({ length: 12 }, (_, i) =>
        note(String(i).padStart(2, "0"), NotificationContentType.NewVersion),
      ),
    );

    expect(state.pageItems.value).toHaveLength(10);
    expect(state.totalPages.value).toBe(2);
    state.nextPage();
    expect(state.pageItems.value).toHaveLength(2);
    state.searchQuery.value = "0";
    await nextTick();
    expect(state.currentPage.value).toBe(0);
  });

  it("dismisses one notification or all of them", async () => {
    const state = await loaded();

    const deletes = () =>
      app.http.requests.filter((r) => r.method === "DELETE").map((r) => r.path);

    await state.dismiss("02");
    expect(deletes()).toEqual(["/notifications/02"]);
    expect(state.pageItems.value.map((n) => n.id)).not.toContain("02");

    await state.dismissAll();
    expect(deletes()).toEqual(["/notifications/02", "/notifications"]);
    expect(state.visibleCount.value).toBe(0);
  });
});
