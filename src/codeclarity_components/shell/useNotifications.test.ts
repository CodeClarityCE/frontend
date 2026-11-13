import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import {
  type Notification,
  NotificationContentType,
} from "./notification.entity";
import { useNotifications } from "./useNotifications";

const { getNotifications, deleteNotification, deleteAllNotifications } =
  vi.hoisted(() => ({
    getNotifications: vi.fn(),
    deleteNotification: vi.fn(),
    deleteAllNotifications: vi.fn(),
  }));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "test-token" }),
}));

vi.mock("./notification.repository", () => ({
  NotificationRepository: class {
    getNotifications = getNotifications;
    deleteNotification = deleteNotification;
    deleteAllNotifications = deleteAllNotifications;
  },
}));

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

async function loaded(): Promise<ReturnType<typeof useNotifications>> {
  const state = useNotifications();
  await flushPromises();
  return state;
}

beforeEach(() => {
  vi.clearAllMocks();
  getNotifications.mockResolvedValue({
    data: notifications,
    matching_count: 5,
  });
  deleteNotification.mockResolvedValue(undefined);
  deleteAllNotifications.mockResolvedValue(undefined);
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
    getNotifications.mockResolvedValue({
      data: Array.from({ length: 12 }, (_, i) =>
        note(String(i).padStart(2, "0"), NotificationContentType.NewVersion),
      ),
      matching_count: 12,
    });
    const state = await loaded();

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

    await state.dismiss("02");
    expect(deleteNotification).toHaveBeenCalledWith(
      expect.objectContaining({ notification_id: "02" }),
    );
    expect(state.pageItems.value.map((n) => n.id)).not.toContain("02");

    await state.dismissAll();
    expect(deleteAllNotifications).toHaveBeenCalled();
    expect(state.visibleCount.value).toBe(0);
  });
});
