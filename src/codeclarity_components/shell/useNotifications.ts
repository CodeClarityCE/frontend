import { computed, type ComputedRef, type Ref, ref, watch } from "vue";

import { useAuthStore } from "@/stores/auth";
import {
  getUpgradeType,
  isGreaterThan,
  isPrerelease,
  shouldRecommendUpgrade,
} from "@/utils/semver";

import {
  type Notification,
  NotificationContentType,
} from "./notification.entity";
import { NotificationRepository } from "./notification.repository";

export type NotificationCategory =
  "vulnerabilities" | "production" | "development" | "other";

export type NotificationFilter = "all" | NotificationCategory;

export type UpgradeType =
  "major" | "minor" | "patch" | "prerelease" | "downgrade" | "same";

export interface VersionInfo {
  fromVersion: string;
  toVersion: string;
  isUpgrade: boolean;
  isPrerelease: boolean;
  upgradeType: UpgradeType;
}

const ENTRIES_PER_PAGE = 10;
const CATEGORY_ORDER: NotificationCategory[] = [
  "vulnerabilities",
  "production",
  "development",
  "other",
];

export function notificationCategory(
  notification: Notification,
): NotificationCategory {
  const type = notification.content_type;
  if (
    type === NotificationContentType.VulnSummary ||
    type === NotificationContentType.VulnerabilitySummary ||
    type === NotificationContentType.FixAvailable
  ) {
    return "vulnerabilities";
  }
  if (type === NotificationContentType.PackageUpdate) {
    const dependency = notification.content?.dependency_type;
    if (dependency === "production" || dependency === "development") {
      return dependency;
    }
  }
  return "other";
}

// Package updates we would not recommend (downgrades, stable to prerelease) are hidden.
function isHidden(notification: Notification): boolean {
  if (notification.content_type !== NotificationContentType.PackageUpdate) {
    return false;
  }
  const { current_version, new_version } = notification.content;
  return current_version && new_version
    ? !shouldRecommendUpgrade(current_version, new_version)
    : false;
}

// The from and to versions in upgrade order, flagging data that runs backwards.
export function versionInfo(notification: Notification): VersionInfo {
  const current = notification.content.current_version;
  const next = notification.content.new_version;
  if (!current || !next) {
    return {
      fromVersion: current ?? "",
      toVersion: next ?? "",
      isUpgrade: true,
      isPrerelease: false,
      upgradeType: "minor",
    };
  }
  if (isGreaterThan(current, next)) {
    return {
      fromVersion: next,
      toVersion: current,
      isUpgrade: false,
      isPrerelease: isPrerelease(next),
      upgradeType: "downgrade",
    };
  }
  const upgradeType = getUpgradeType(current, next);
  return {
    fromVersion: current,
    toVersion: next,
    isUpgrade: upgradeType !== "downgrade" && upgradeType !== "same",
    isPrerelease: isPrerelease(next),
    upgradeType,
  };
}

function matches(notification: Notification, query: string): boolean {
  const { content } = notification;
  return [
    notification.title,
    notification.description,
    content.package_name,
    content.project_name,
  ].some((text) => text?.toLowerCase().includes(query));
}

export interface NotificationsState {
  isLoading: Ref<boolean>;
  searchQuery: Ref<string>;
  selectedFilter: Ref<NotificationFilter>;
  currentPage: Ref<number>;
  counts: ComputedRef<Record<NotificationCategory, number>>;
  visibleCount: ComputedRef<number>;
  filteredCount: ComputedRef<number>;
  totalPages: ComputedRef<number>;
  pageItems: ComputedRef<Notification[]>;
  entriesPerPage: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  dismiss: (notificationId: string) => Promise<void>;
  dismissAll: () => Promise<void>;
}

// Loads the user's notifications and exposes search, filter, paging and dismiss.
export function useNotifications(): NotificationsState {
  const authStore = useAuthStore();
  const repository = new NotificationRepository();

  const all = ref<Notification[]>([]);
  const isLoading = ref(false);
  const searchQuery = ref("");
  const selectedFilter = ref<NotificationFilter>("all");
  const currentPage = ref(0);

  const visible = computed(() => all.value.filter((n) => !isHidden(n)));
  const visibleCount = computed(() => visible.value.length);

  const counts = computed(() => {
    const result: Record<NotificationCategory, number> = {
      vulnerabilities: 0,
      production: 0,
      development: 0,
      other: 0,
    };
    for (const n of visible.value) result[notificationCategory(n)]++;
    return result;
  });

  const filtered = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    return visible.value
      .filter(
        (n) =>
          selectedFilter.value === "all" ||
          notificationCategory(n) === selectedFilter.value,
      )
      .filter((n) => !query || matches(n, query))
      .sort(
        (a, b) =>
          CATEGORY_ORDER.indexOf(notificationCategory(a)) -
            CATEGORY_ORDER.indexOf(notificationCategory(b)) ||
          b.id.localeCompare(a.id),
      );
  });
  const filteredCount = computed(() => filtered.value.length);
  const totalPages = computed(() =>
    Math.ceil(filteredCount.value / ENTRIES_PER_PAGE),
  );
  const pageItems = computed(() =>
    filtered.value.slice(
      currentPage.value * ENTRIES_PER_PAGE,
      (currentPage.value + 1) * ENTRIES_PER_PAGE,
    ),
  );

  watch([searchQuery, selectedFilter], () => {
    currentPage.value = 0;
  });

  function goToPage(page: number): void {
    if (page >= 0 && page < totalPages.value) currentPage.value = page;
  }

  async function fetch(): Promise<void> {
    isLoading.value = true;
    try {
      // Load up to 100 so sorting and filtering see the whole list.
      const resp = await repository.getNotifications({
        bearerToken: authStore.getToken!,
        handleBusinessErrors: true,
        page: 0,
        entries_per_page: 100,
      });
      all.value = resp.data;
    } catch {
      // The base repository already reports failed requests.
    } finally {
      isLoading.value = false;
    }
  }

  async function dismiss(notificationId: string): Promise<void> {
    try {
      await repository.deleteNotification({
        bearerToken: authStore.getToken!,
        handleBusinessErrors: true,
        notification_id: notificationId,
      });
    } catch {
      // The base repository already reports failed requests.
    }
    all.value = all.value.filter((n) => n.id !== notificationId);
  }

  async function dismissAll(): Promise<void> {
    try {
      await repository.deleteAllNotifications({
        bearerToken: authStore.getToken!,
        handleBusinessErrors: true,
      });
    } catch {
      // The base repository already reports failed requests.
    }
    all.value = [];
  }

  void fetch();

  return {
    isLoading,
    searchQuery,
    selectedFilter,
    currentPage,
    counts,
    visibleCount,
    filteredCount,
    totalPages,
    pageItems,
    entriesPerPage: ENTRIES_PER_PAGE,
    nextPage: () => goToPage(currentPage.value + 1),
    prevPage: () => goToPage(currentPage.value - 1),
    goToPage,
    dismiss,
    dismissAll,
  };
}
