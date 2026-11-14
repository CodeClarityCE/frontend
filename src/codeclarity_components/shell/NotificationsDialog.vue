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
  type LucideIcon,
  PackageOpen,
  ShieldAlert,
  TriangleAlert,
  X,
} from "@lucide/vue";
import { computed } from "vue";

import { SeverityBadge } from "@/base_components/page";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shadcn/ui/sidebar";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { type SeverityLevel, severityLevelFromLabel } from "@/utils/severity";

import type { Notification } from "./notification.entity";
import {
  type UpgradeType,
  useNotifications,
  versionInfo,
} from "./useNotifications";

const {
  isLoading,
  searchQuery,
  selectedFilter,
  currentPage,
  counts,
  visibleCount,
  filteredCount,
  totalPages,
  pageItems,
  entriesPerPage,
  nextPage,
  prevPage,
  goToPage,
  dismiss,
  dismissAll,
} = useNotifications();

const entries = computed(() =>
  pageItems.value.map((notification) => ({
    notification,
    version: versionInfo(notification),
  })),
);

const filterOptions = computed(() => [
  { value: "all", label: `All (${filteredCount.value})` },
  {
    value: "vulnerabilities",
    label: `Vulnerabilities (${counts.value.vulnerabilities})`,
  },
  { value: "production", label: `Production (${counts.value.production})` },
  { value: "development", label: `Development (${counts.value.development})` },
  { value: "other", label: `Other (${counts.value.other})` },
]);

const upgradeIcons: Record<UpgradeType, LucideIcon> = {
  major: ArrowUp,
  minor: ArrowUp,
  patch: ArrowUp,
  prerelease: FlaskConical,
  downgrade: ArrowDown,
  same: Equal,
};

// Status colours from the shared set; the label next to them carries the meaning.
const upgradeClasses: Record<UpgradeType, string> = {
  major: "bg-danger text-danger-foreground",
  minor: "bg-warning-subtle text-warning",
  patch: "bg-neutral-subtle text-neutral",
  prerelease: "bg-neutral-subtle text-neutral",
  downgrade: "bg-neutral-subtle text-neutral",
  same: "bg-neutral-subtle text-neutral",
};

const severityKeys = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

// The severities a summary has at least one vulnerability for, most severe first.
function severityCounts(
  notification: Notification,
): { level: SeverityLevel; count: number }[] {
  const found = notification.content.severity_counts ?? {};
  return severityKeys
    .map((key) => ({
      level: severityLevelFromLabel(key),
      count: found[key] ?? 0,
    }))
    .filter(({ count }) => count > 0);
}

function isProduction(notification: Notification): boolean {
  return notification.content?.dependency_type === "production";
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
</script>

<template>
  <SidebarMenu v-if="visibleCount > 0">
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
          {{ visibleCount }}
          <span class="sr-only">notifications</span>
        </SidebarMenuBadge>
        <DialogContent class="flex max-h-[90vh] max-w-4xl flex-col">
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            You have {{ visibleCount }} new notifications
          </DialogDescription>

          <!-- Overview -->
          <div class="grid grid-cols-4 gap-3 rounded-card border bg-card p-4">
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground-strong">
                {{ counts.vulnerabilities }}
              </p>
              <p class="text-xs text-muted-foreground">Vulnerabilities</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground-strong">
                {{ counts.production }}
              </p>
              <p class="text-xs text-muted-foreground">Production updates</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground-strong">
                {{ counts.development }}
              </p>
              <p class="text-xs text-muted-foreground">Dev updates</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-foreground-strong">
                {{ counts.other }}
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
            <Select v-model="selectedFilter">
              <SelectTrigger aria-label="Filter notifications" class="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in filterOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            v-if="isLoading"
            role="status"
            aria-label="Loading notifications"
            class="flex flex-col gap-4"
          >
            <Skeleton v-for="row in 3" :key="row" class="h-24 rounded-card" />
          </div>

          <div v-else class="flex-1 overflow-y-auto">
            <div
              v-if="entries.length === 0"
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
                v-for="{ notification, version } in entries"
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
                    isProduction(notification) ? 'bg-warning-subtle' : 'bg-card'
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
                            >{{ version.fromVersion }}</span
                          >
                          <ArrowRight
                            v-if="version.isUpgrade"
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
                            {{ version.toVersion }}
                          </span>
                        </div>
                        <div class="mt-1 flex gap-2">
                          <span
                            class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
                            :class="upgradeClasses[version.upgradeType]"
                          >
                            <component
                              :is="upgradeIcons[version.upgradeType] ?? ArrowUp"
                              class="size-3.5"
                              aria-hidden="true"
                            />
                            {{ capitalise(version.upgradeType) }}
                          </span>
                          <span
                            v-if="version.isPrerelease"
                            class="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2 py-1 text-xs text-warning"
                          >
                            <FlaskConical class="size-3.5" aria-hidden="true" />
                            Prerelease
                          </span>
                        </div>
                        <div
                          v-if="
                            !version.isUpgrade &&
                            version.upgradeType === 'downgrade'
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
                        @click="dismiss(notification.id)"
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
                  class="rounded-card border bg-card p-4"
                >
                  <div class="mb-3 flex items-start gap-3">
                    <span class="rounded-full bg-background p-2 text-neutral">
                      <ShieldAlert class="size-5" aria-hidden="true" />
                    </span>
                    <div class="flex-1">
                      <div class="flex items-start gap-2">
                        <h3
                          class="flex-1 text-base font-semibold text-foreground-strong"
                        >
                          {{ notification.title ?? "Vulnerability summary" }}
                        </h3>
                        <span
                          v-if="notification.content?.max_severity"
                          class="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          Highest severity
                          <SeverityBadge
                            :level="
                              severityLevelFromLabel(
                                notification.content.max_severity,
                              )
                            "
                          />
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
                    v-if="notification.content?.severity_counts"
                    class="mb-3 flex flex-wrap gap-2"
                  >
                    <span
                      v-for="{ level, count } in severityCounts(notification)"
                      :key="level"
                      class="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums"
                    >
                      <SeverityBadge :level="level" />
                      {{ count }}
                    </span>
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
                        @click="dismiss(notification.id)"
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
                    @click="dismiss(notification.id)"
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
                Math.min((currentPage + 1) * entriesPerPage, filteredCount)
              }}
              of {{ filteredCount }}
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
            <Button variant="ghost" @click="dismissAll">Clear all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
