<script setup lang="ts">
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Equal,
  ExternalLink,
  FlaskConical,
  Info,
  LoaderCircle,
  type LucideIcon,
  PackageOpen,
  ShieldAlert,
  TriangleAlert,
  X,
} from "@lucide/vue";
import { computed, type Ref, ref, watch } from "vue";

import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shadcn/ui/sidebar";
import { useAuthStore } from "@/stores/auth";
import {
  getUpgradeType,
  isGreaterThan,
  isPrerelease as semverIsPrerelease,
  shouldRecommendUpgrade,
} from "@/utils/semver";

import {
  type Notification,
  NotificationContentType,
} from "./notification.entity";
import { NotificationRepository } from "./notification.repository";

const authStore = useAuthStore();

const allNotifications: Ref<Notification[]> = ref([]);
const total_notifications: Ref<number> = ref(0);
const currentPage: Ref<number> = ref(0);
const searchQuery: Ref<string> = ref("");
const selectedFilter: Ref<string> = ref("all");
const entriesPerPage = 10;
const isLoading: Ref<boolean> = ref(false);

// Repositories
const notificationRepository: NotificationRepository =
  new NotificationRepository();

// Priority mapping for sorting
const getPriority = (notification: Notification): number => {
  if (
    notification.content_type === NotificationContentType.VulnSummary ||
    notification.content_type ===
      NotificationContentType.VulnerabilitySummary ||
    notification.content_type === NotificationContentType.FixAvailable
  ) {
    return 1; // Highest priority - vulnerabilities
  }
  if (
    notification.content_type === NotificationContentType.PackageUpdate &&
    notification.content?.dependency_type === "production"
  ) {
    return 2; // High priority - production dependencies
  }
  if (
    notification.content_type === NotificationContentType.PackageUpdate &&
    notification.content?.dependency_type === "development"
  ) {
    return 3; // Medium priority - dev dependencies
  }
  return 4; // Lowest priority - other updates
};

// Filter and sort notifications
const filteredNotifications = computed(() => {
  let filtered = allNotifications.value;

  // Filter out prerelease notifications
  filtered = filtered.filter(
    (notification) => !shouldFilterNotification(notification),
  );

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (notification) =>
        notification.title.toLowerCase().includes(query) ||
        notification.description.toLowerCase().includes(query) ||
        (notification.content.package_name?.toLowerCase().includes(query) ??
          false) ||
        (notification.content.project_name?.toLowerCase().includes(query) ??
          false),
    );
  }

  // Apply type filter
  if (selectedFilter.value !== "all") {
    filtered = filtered.filter((notification) => {
      switch (selectedFilter.value) {
        case "vulnerabilities":
          return (
            notification.content_type === NotificationContentType.VulnSummary ||
            notification.content_type ===
              NotificationContentType.VulnerabilitySummary ||
            notification.content_type === NotificationContentType.FixAvailable
          );
        case "production":
          return (
            notification.content_type ===
              NotificationContentType.PackageUpdate &&
            notification.content?.dependency_type === "production"
          );
        case "development":
          return (
            notification.content_type ===
              NotificationContentType.PackageUpdate &&
            notification.content?.dependency_type === "development"
          );
        case "other":
          return (
            notification.content_type === NotificationContentType.NewVersion ||
            (notification.content_type ===
              NotificationContentType.PackageUpdate &&
              !notification.content?.dependency_type)
          );
        default:
          return true;
      }
    });
  }

  // Sort by priority then by most recent
  return filtered.sort((a, b) => {
    const priorityDiff = getPriority(a) - getPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    // If same priority, sort by ID (assuming newer IDs are higher)
    return b.id.localeCompare(a.id);
  });
});

// Paginated notifications
const paginatedNotifications = computed(() => {
  const start = currentPage.value * entriesPerPage;
  const end = start + entriesPerPage;
  return filteredNotifications.value.slice(start, end);
});

// Notification counts by type (excluding filtered prerelease notifications)
const notificationCounts = computed(() => {
  const counts = {
    vulnerabilities: 0,
    production: 0,
    development: 0,
    other: 0,
  };

  // Only count notifications that wouldn't be filtered out
  allNotifications.value
    .filter((notification) => !shouldFilterNotification(notification))
    .forEach((notification) => {
      if (
        notification.content_type === NotificationContentType.VulnSummary ||
        notification.content_type ===
          NotificationContentType.VulnerabilitySummary ||
        notification.content_type === NotificationContentType.FixAvailable
      ) {
        counts.vulnerabilities++;
      } else if (
        notification.content_type === NotificationContentType.PackageUpdate &&
        notification.content?.dependency_type === "production"
      ) {
        counts.production++;
      } else if (
        notification.content_type === NotificationContentType.PackageUpdate &&
        notification.content?.dependency_type === "development"
      ) {
        counts.development++;
      } else {
        counts.other++;
      }
    });

  return counts;
});

// Total filtered notifications count
const totalFilteredCount = computed(() => filteredNotifications.value.length);

// Total count for display (excluding prerelease notifications)
const displayNotificationCount = computed(() => {
  return allNotifications.value.filter(
    (notification) => !shouldFilterNotification(notification),
  ).length;
});

// Total pages
const totalPages = computed(() =>
  Math.ceil(totalFilteredCount.value / entriesPerPage),
);

// Helper function to determine if a notification should be filtered out
const shouldFilterNotification = (notification: Notification): boolean => {
  // Filter out package update notifications that shouldn't be recommended
  if (notification.content_type === NotificationContentType.PackageUpdate) {
    const currentVersion = notification.content.current_version;
    const newVersion = notification.content.new_version;

    if (currentVersion && newVersion) {
      // Use the semver utility to determine if this upgrade should be recommended
      return !shouldRecommendUpgrade(currentVersion, newVersion);
    }
  }
  return false;
};

// Helper function to get properly ordered versions with upgrade analysis
const getVersionInfo = (
  notification: Notification,
): {
  fromVersion: string;
  toVersion: string;
  isUpgrade: boolean;
  isPrerelease: boolean;
  upgradeType:
    "major" | "minor" | "patch" | "prerelease" | "downgrade" | "same";
} => {
  const content = notification.content;
  if (!content.current_version || !content.new_version) {
    return {
      fromVersion: content.current_version ?? "",
      toVersion: content.new_version ?? "",
      isUpgrade: true,
      isPrerelease: false,
      upgradeType: "minor" as const,
    };
  }

  const currentVersion = content.current_version;
  const newVersion = content.new_version;
  const upgradeType = getUpgradeType(currentVersion, newVersion);
  const newVersionIsPrerelease = semverIsPrerelease(newVersion);

  // Check if current_version is actually newer than new_version (incorrect data)
  const currentIsNewer = isGreaterThan(currentVersion, newVersion);

  if (currentIsNewer) {
    // Data is backwards - swap them and mark as downgrade
    return {
      fromVersion: newVersion,
      toVersion: currentVersion,
      isUpgrade: false, // This would be a downgrade, which is unusual
      isPrerelease: newVersionIsPrerelease,
      upgradeType: "downgrade" as const,
    };
  } else {
    // Data is correct
    return {
      fromVersion: currentVersion,
      toVersion: newVersion,
      isUpgrade: upgradeType !== "downgrade" && upgradeType !== "same",
      isPrerelease: newVersionIsPrerelease,
      upgradeType,
    };
  }
};

// Reset page when search or filter changes
watch([searchQuery, selectedFilter], () => {
  currentPage.value = 0;
});

async function fetchAllNotifications(): Promise<void> {
  isLoading.value = true;
  try {
    // Fetch a larger number to get all notifications for better sorting/filtering
    const resp = await notificationRepository.getNotifications({
      bearerToken: authStore.getToken!,
      handleBusinessErrors: true,
      page: 0,
      entries_per_page: 100, // Fetch more notifications for better overview
    });
    allNotifications.value = resp.data;
    total_notifications.value = resp.matching_count;
  } catch {
    // The base repository already reports failed requests.
  } finally {
    isLoading.value = false;
  }
}

async function deleteNotification(notification_id: string): Promise<void> {
  try {
    await notificationRepository.deleteNotification({
      bearerToken: authStore.getToken!,
      handleBusinessErrors: true,
      notification_id: notification_id,
    });
  } catch {
    // The base repository already reports failed requests.
  }
  allNotifications.value = allNotifications.value.filter(
    (notification) => notification.id !== notification_id,
  );
  total_notifications.value -= 1;
}

async function deleteAllNotifications(): Promise<void> {
  try {
    await notificationRepository.deleteAllNotifications({
      bearerToken: authStore.getToken!,
      handleBusinessErrors: true,
    });
  } catch {
    // The base repository already reports failed requests.
  }
  allNotifications.value = [];
  total_notifications.value = 0;
}

// Pagination functions
function nextPage(): void {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++;
  }
}

function prevPage(): void {
  if (currentPage.value > 0) {
    currentPage.value--;
  }
}

function goToPage(page: number): void {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page;
  }
}

void fetchAllNotifications();
const upgradeIcons: Record<string, LucideIcon> = {
  major: ArrowUp,
  minor: ArrowUp,
  patch: ArrowUp,
  prerelease: FlaskConical,
  downgrade: ArrowDown,
  same: Equal,
};

// Status colours from the shared set; the label next to them carries the meaning.
const upgradeClasses: Record<string, string> = {
  major: "bg-danger text-danger-foreground",
  minor: "bg-warning-subtle text-warning",
  patch: "bg-neutral-subtle text-neutral",
  prerelease: "bg-neutral-subtle text-neutral",
  downgrade: "bg-neutral-subtle text-neutral",
  same: "bg-neutral-subtle text-neutral",
};

function isProduction(notification: Notification): boolean {
  return notification.content?.dependency_type === "production";
}

function severityClass(severity: string | undefined): string {
  switch (severity) {
    case "CRITICAL":
      return "text-severity-critical bg-severity-critical-bg";
    case "HIGH":
      return "text-severity-high bg-severity-high-bg";
    case "MEDIUM":
      return "text-severity-medium bg-severity-medium-bg";
    case "LOW":
      return "text-severity-low bg-severity-low-bg";
    default:
      return "text-severity-none bg-severity-none-bg";
  }
}

const severityBadges = [
  { key: "CRITICAL", label: "Critical", icon: CircleAlert },
  { key: "HIGH", label: "High", icon: TriangleAlert },
  { key: "MEDIUM", label: "Medium", icon: TriangleAlert },
  { key: "LOW", label: "Low", icon: Info },
] as const;

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
</script>

<template>
  <SidebarMenu v-if="displayNotificationCount > 0">
    <SidebarMenuItem>
      <Dialog>
        <DialogTrigger as-child>
          <SidebarMenuButton tooltip="Notifications">
            <Bell aria-hidden="true" />
            <span>Notifications</span>
          </SidebarMenuButton>
        </DialogTrigger>
        <SidebarMenuBadge
          class="bg-sidebar-primary text-sidebar-primary-foreground"
        >
          {{ displayNotificationCount }}
          <span class="sr-only">notifications</span>
        </SidebarMenuBadge>
        <DialogContent class="flex max-h-[90vh] max-w-4xl flex-col">
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            You have {{ displayNotificationCount }} new notifications
          </DialogDescription>

          <!-- Overview -->
          <div class="grid grid-cols-4 gap-3 rounded-card border bg-muted p-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground-strong">
                {{ notificationCounts.vulnerabilities }}
              </p>
              <p class="text-xs text-muted-foreground">Vulnerabilities</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground-strong">
                {{ notificationCounts.production }}
              </p>
              <p class="text-xs text-muted-foreground">Production updates</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground-strong">
                {{ notificationCounts.development }}
              </p>
              <p class="text-xs text-muted-foreground">Dev updates</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground-strong">
                {{ notificationCounts.other }}
              </p>
              <p class="text-xs text-muted-foreground">Other</p>
            </div>
          </div>

          <!-- Search and filter -->
          <div class="flex items-center gap-3">
            <Input
              v-model="searchQuery"
              placeholder="Search notifications..."
              aria-label="Search notifications"
              class="flex-1"
            />
            <select
              v-model="selectedFilter"
              aria-label="Filter notifications"
              class="h-9 rounded-control border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All ({{ totalFilteredCount }})</option>
              <option value="vulnerabilities">
                Vulnerabilities ({{ notificationCounts.vulnerabilities }})
              </option>
              <option value="production">
                Production ({{ notificationCounts.production }})
              </option>
              <option value="development">
                Development ({{ notificationCounts.development }})
              </option>
              <option value="other">
                Other ({{ notificationCounts.other }})
              </option>
            </select>
          </div>

          <div
            v-if="isLoading"
            class="flex items-center justify-center py-8 text-muted-foreground"
          >
            <LoaderCircle
              class="size-6 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span class="ml-2">Loading notifications...</span>
          </div>

          <div v-else class="flex-1 overflow-y-auto">
            <div
              v-if="paginatedNotifications.length === 0"
              class="py-8 text-center text-muted-foreground"
            >
              <BellOff class="mx-auto mb-2 size-10" aria-hidden="true" />
              <p>No notifications found</p>
              <p class="text-sm">
                Try adjusting your search or filter criteria
              </p>
            </div>
            <ul v-else class="flex flex-col gap-4">
              <li
                v-for="notification in paginatedNotifications"
                :key="notification.id"
                class="border-b pb-4 last:border-b-0"
              >
                <div v-if="notification.content_type === 'new_version'">
                  <p class="font-semibold">
                    {{ notification.content["package"] }} can be upgraded
                  </p>
                  <p>{{ notification.description }}</p>
                  <p>
                    {{ notification.content["package"] }}@{{
                      notification.content["version"]
                    }}
                  </p>
                </div>
                <div v-else-if="notification.content_type === 'fix_available'">
                  <p class="font-semibold">
                    Fix available for {{ notification.content["package"] }}
                  </p>
                  <p>{{ notification.description }}</p>
                  <p>
                    Update to {{ notification.content["fixed_version"] }}
                    (current:
                    {{ notification.content["vulnerable_version"] }})
                  </p>
                </div>
                <div
                  v-else-if="notification.content_type === 'package_update'"
                  class="rounded-card border p-4"
                  :class="
                    isProduction(notification)
                      ? 'bg-warning-subtle'
                      : 'bg-muted'
                  "
                >
                  <div class="mb-3 flex items-start gap-3">
                    <span
                      class="rounded-full bg-background p-2"
                      :class="
                        isProduction(notification)
                          ? 'text-warning'
                          : 'text-neutral'
                      "
                    >
                      <TriangleAlert
                        v-if="isProduction(notification)"
                        class="size-5"
                        aria-hidden="true"
                      />
                      <PackageOpen v-else class="size-5" aria-hidden="true" />
                    </span>
                    <div class="flex-1">
                      <div class="flex items-start gap-2">
                        <h3
                          class="flex-1 text-base font-semibold text-foreground-strong"
                        >
                          {{ notification.title ?? "Package update available" }}
                        </h3>
                        <span
                          v-if="notification.content?.dependency_type"
                          class="rounded-full border bg-background px-2 py-1 text-xs font-medium"
                          :class="
                            isProduction(notification)
                              ? 'text-warning'
                              : 'text-neutral'
                          "
                        >
                          {{
                            isProduction(notification)
                              ? "PRODUCTION"
                              : "DEVELOPMENT"
                          }}
                        </span>
                      </div>
                      <p
                        v-if="notification.content?.project_name"
                        class="mt-0.5 text-sm text-muted-foreground"
                      >
                        Project:
                        <span class="font-medium text-foreground">{{
                          notification.content.project_name
                        }}</span>
                      </p>
                    </div>
                  </div>

                  <p class="mb-3 text-sm leading-relaxed text-muted-foreground">
                    {{ notification.description }}
                  </p>

                  <div
                    v-if="notification.content?.package_name"
                    class="mb-3 rounded-control border bg-background p-3"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="font-medium text-foreground-strong">
                          {{ notification.content.package_name }}
                        </p>
                        <div
                          class="mt-1 flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <span
                            class="rounded bg-muted px-2 py-1 font-mono text-xs"
                            >{{
                              getVersionInfo(notification).fromVersion
                            }}</span
                          >
                          <ArrowRight
                            v-if="getVersionInfo(notification).isUpgrade"
                            class="size-4"
                            aria-label="to"
                          />
                          <ArrowDown
                            v-else
                            class="size-4"
                            aria-label="down to"
                          />
                          <span
                            class="rounded bg-muted px-2 py-1 font-mono text-xs"
                          >
                            {{ getVersionInfo(notification).toVersion }}
                          </span>
                        </div>
                        <div class="mt-1 flex gap-2">
                          <span
                            class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                            :class="
                              upgradeClasses[
                                getVersionInfo(notification).upgradeType
                              ]
                            "
                          >
                            <component
                              :is="
                                upgradeIcons[
                                  getVersionInfo(notification).upgradeType
                                ] ?? ArrowUp
                              "
                              class="size-3.5"
                              aria-hidden="true"
                            />
                            {{
                              capitalise(
                                getVersionInfo(notification).upgradeType,
                              )
                            }}
                          </span>
                          <span
                            v-if="getVersionInfo(notification).isPrerelease"
                            class="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2 py-1 text-xs text-warning"
                          >
                            <FlaskConical class="size-3.5" aria-hidden="true" />
                            Prerelease
                          </span>
                        </div>
                        <div
                          v-if="
                            !getVersionInfo(notification).isUpgrade &&
                            getVersionInfo(notification).upgradeType ===
                              'downgrade'
                          "
                          class="mt-1"
                        >
                          <span
                            class="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2 py-1 text-xs text-warning"
                          >
                            <CircleAlert class="size-3.5" aria-hidden="true" />
                            Potential version data issue detected
                          </span>
                        </div>
                      </div>
                      <a
                        v-if="notification.content.release_notes_url"
                        :href="notification.content.release_notes_url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="ml-3 inline-flex items-center gap-1 text-xs text-foreground underline underline-offset-4 hover:text-brand-link-hover"
                      >
                        <ExternalLink class="size-3.5" aria-hidden="true" />
                        Release notes
                      </a>
                    </div>
                  </div>

                  <div class="flex items-center justify-between border-t pt-3">
                    <span class="text-sm font-medium text-foreground">
                      {{
                        isProduction(notification)
                          ? "Production dependency update, high priority"
                          : notification.content?.dependency_type ===
                              "development"
                            ? "Development dependency update"
                            : "Direct dependency update available"
                      }}
                    </span>
                    <div class="flex items-center gap-2">
                      <RouterLink
                        v-if="
                          notification.content?.analysis_id &&
                          notification.content?.project_id
                        "
                        :to="{
                          name: 'results',
                          query: {
                            analysis_id: notification.content.analysis_id,
                            project_id: notification.content.project_id,
                          },
                        }"
                        class="inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4 hover:text-brand-link-hover"
                      >
                        View analysis
                        <ArrowRight class="size-4" aria-hidden="true" />
                      </RouterLink>
                      <Button
                        variant="destructive"
                        size="sm"
                        @click="deleteNotification(notification.id)"
                      >
                        <X aria-hidden="true" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
                <div
                  v-else-if="
                    notification.content_type === 'vuln_summary' ||
                    notification.content_type === 'vulnerability_summary'
                  "
                  class="rounded-card border bg-muted p-4"
                >
                  <div class="mb-3 flex items-start gap-3">
                    <span
                      class="rounded-full p-2"
                      :class="severityClass(notification.content?.max_severity)"
                    >
                      <ShieldAlert class="size-5" aria-hidden="true" />
                    </span>
                    <div class="flex-1">
                      <h3
                        class="text-base font-semibold text-foreground-strong"
                      >
                        {{ notification.title ?? "Vulnerability summary" }}
                      </h3>
                      <p
                        v-if="notification.content?.project_name"
                        class="mt-0.5 text-sm text-muted-foreground"
                      >
                        Project:
                        <span class="font-medium text-foreground">{{
                          notification.content.project_name
                        }}</span>
                      </p>
                    </div>
                  </div>

                  <p class="mb-3 text-sm leading-relaxed text-muted-foreground">
                    {{ notification.description }}
                  </p>

                  <div
                    v-if="notification.content?.severity_counts"
                    class="mb-3 flex flex-wrap gap-2"
                  >
                    <template v-for="badge in severityBadges" :key="badge.key">
                      <span
                        v-if="
                          (notification.content.severity_counts[badge.key] ??
                            0) > 0
                        "
                        class="flex items-center gap-1 rounded-control px-2.5 py-1 text-sm font-medium"
                        :class="severityClass(badge.key)"
                      >
                        <component
                          :is="badge.icon"
                          class="size-4"
                          aria-hidden="true"
                        />
                        {{ badge.label }}:
                        {{ notification.content.severity_counts[badge.key] }}
                      </span>
                    </template>
                  </div>

                  <div class="flex items-center justify-between border-t pt-3">
                    <span class="text-sm font-medium text-foreground">
                      Total:
                      {{ notification.content?.total ?? 0 }} vulnerabilities
                    </span>
                    <div class="flex items-center gap-2">
                      <RouterLink
                        v-if="
                          notification.content?.analysis_id &&
                          notification.content?.project_id
                        "
                        :to="{
                          name: 'results',
                          query: {
                            analysis_id: notification.content.analysis_id,
                            project_id: notification.content.project_id,
                          },
                        }"
                        class="inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4 hover:text-brand-link-hover"
                      >
                        View details
                        <ArrowRight class="size-4" aria-hidden="true" />
                      </RouterLink>
                      <Button
                        variant="destructive"
                        size="sm"
                        @click="deleteNotification(notification.id)"
                      >
                        <X aria-hidden="true" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
                <div v-else class="flex items-start justify-between">
                  <div>
                    <p class="font-semibold">{{ notification.title }}</p>
                    <p>{{ notification.description }}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    class="ml-4"
                    @click="deleteNotification(notification.id)"
                  >
                    <X aria-hidden="true" />
                    Dismiss
                  </Button>
                </div>
              </li>
            </ul>
          </div>

          <nav
            v-if="totalPages > 1"
            aria-label="Notification pages"
            class="flex items-center justify-between border-t pt-4"
          >
            <p class="text-sm text-muted-foreground">
              Showing {{ currentPage * entriesPerPage + 1 }}-{{
                Math.min((currentPage + 1) * entriesPerPage, totalFilteredCount)
              }}
              of {{ totalFilteredCount }}
            </p>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-label="Previous page"
                :disabled="currentPage === 0"
                @click="prevPage"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button
                v-for="page in Math.min(5, totalPages)"
                :key="page - 1"
                variant="outline"
                size="sm"
                :aria-current="currentPage === page - 1 ? 'page' : undefined"
                :class="{
                  'border-brand-subtle-border bg-brand-subtle text-brand-subtle-foreground':
                    currentPage === page - 1,
                }"
                @click="goToPage(page - 1)"
              >
                {{ page }}
              </Button>
              <span v-if="totalPages > 5" class="px-2 text-muted-foreground"
                >...</span
              >
              <Button
                variant="outline"
                size="sm"
                aria-label="Next page"
                :disabled="currentPage === totalPages - 1"
                @click="nextPage"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </nav>

          <DialogFooter>
            <Button variant="ghost" @click="deleteAllNotifications"
              >Clear all</Button
            >
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
