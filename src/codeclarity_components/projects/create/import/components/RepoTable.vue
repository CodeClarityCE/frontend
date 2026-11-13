<script lang="ts">
import {
  type GetRepositoriesRequestOptions,
  GetRepositoriesSortInterface,
} from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";

/** A server-side filter choice: its option key and its label. */
export interface RepoFilterOption {
  key: string;
  label: string;
}

/** Per-source presentation tweaks; every field falls back to the classic list. */
export interface RepoTableConfig {
  /** Column the server sorts by while every page loads (default: created date). */
  defaultSortKey?: GetRepositoriesSortInterface;
  /** Language choices sent with the filters; the first is the default. */
  languages?: RepoFilterOption[];
  /** Show a Stars column instead of the created date. */
  showStars?: boolean;
}

/** Option keys of the import state filter, as the API expects them. */
export const ONLY_NOT_IMPORTED = "only_non_imported";
export const ALL_REPOSITORIES = "imported_and_non_imported";

export type { GetRepositoriesRequestOptions };
</script>
<script lang="ts" setup>
import { Star } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { computed, type Ref, ref, watch } from "vue";

import { DataTable } from "@/base_components/data-table";
import { StatusBadge } from "@/base_components/page";
import type { Repository } from "@/codeclarity_components/projects/project.entity";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";
import type { PaginatedResponse } from "@/utils/api/responses/PaginatedResponse";

/** The API's largest page; every repository is loaded so the table can sort and filter them all */
const FETCH_PAGE_SIZE = 100;

const props = withDefaults(
  defineProps<{
    integration: string;
    getRepos: (
      options: GetRepositoriesRequestOptions,
    ) => Promise<PaginatedResponse<Repository>>;
    config?: RepoTableConfig;
    /** Freezes the selection, e.g. while the selected repositories import. */
    disabled?: boolean;
  }>(),
  { config: () => ({}), disabled: false },
);

const emit =
  defineEmits<(e: "onSelectedReposChange", selected: Repository[]) => void>();

const authStore = useAuthStore();
const userStore = useUserStore();

const loading = ref(true);
const error = ref(false);
const errorCode: Ref<string | undefined> = ref();
const repos: Ref<Repository[]> = ref([]);
const importFilter = ref(ONLY_NOT_IMPORTED);
const languageFilter = ref(props.config.languages?.[0]?.key);
const selectedIds = ref(new Set<string>());

const activeFilters = computed(() =>
  [importFilter.value, languageFilter.value].filter(
    (filter): filter is string => filter !== undefined,
  ),
);
const selectable = computed(() =>
  repos.value.filter((repo) => !repo.imported_already),
);
const selectedRepos = computed(() =>
  repos.value.filter((repo) => selectedIds.value.has(repo.id)),
);
const allSelected = computed(
  () =>
    selectable.value.length > 0 &&
    selectable.value.every((repo) => selectedIds.value.has(repo.id)),
);
const INVALID_INTEGRATION = new Set<string>([
  APIErrors.IntegrationInvalidToken,
  APIErrors.FailedToRetrieveReposFromProvider,
  APIErrors.IntegrationIntegrationTokenMissingPermissions,
  APIErrors.IntegrationTokenExpired,
  APIErrors.IntegrationTokenRetrievalFailed,
]);
const invalidIntegration = computed(() =>
  INVALID_INTEGRATION.has(errorCode.value ?? ""),
);

const columns: ColumnDef<Repository, unknown>[] = [
  {
    id: "select",
    header: "Select",
    enableSorting: false,
    enableGlobalFilter: false,
  },
  {
    id: "repository",
    accessorKey: "fully_qualified_name",
    header: "Repository",
  },
  {
    id: "imported",
    accessorFn: (repo) => (repo.imported_already ? "Imported" : "Not imported"),
    header: "Import state",
  },
  {
    id: "description",
    accessorFn: (repo) => repo.description ?? "",
    header: "Description",
    enableSorting: false,
  },
  props.config.showStars
    ? {
        id: "stars",
        accessorFn: (repo) => repo.stargazers_count ?? 0,
        header: "Stars",
        enableGlobalFilter: false,
      }
    : {
        id: "created",
        accessorFn: (repo) => new Date(repo.created_at).getTime(),
        header: "Created",
        enableGlobalFilter: false,
      },
];

const initialSorting = [
  { id: props.config.showStars ? "stars" : "created", desc: true },
];

function emitSelection(): void {
  emit("onSelectedReposChange", selectedRepos.value);
}

function toggle(repo: Repository, checked: boolean): void {
  const next = new Set(selectedIds.value);
  if (checked) next.add(repo.id);
  else next.delete(repo.id);
  selectedIds.value = next;
  emitSelection();
}

function selectAll(checked: boolean): void {
  selectedIds.value = new Set(
    checked ? selectable.value.map((repo) => repo.id) : [],
  );
  emitSelection();
}

/** Clears the selection without telling the parent, which asked for it. */
function clearSelection(): void {
  selectedIds.value = new Set();
}

/**
 * Loads every page of repositories for the current filters.
 * @param refresh keeps the table on screen instead of the skeleton
 * @param forceRefresh asks the API to refetch from the VCS provider
 */
async function fetchRepos(
  refresh = false,
  forceRefresh = false,
): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getAuthenticated || !authStore.getToken) return;

  error.value = false;
  errorCode.value = undefined;
  if (!refresh) loading.value = true;
  try {
    const all: Repository[] = [];
    for (let page = 0; ; page++) {
      const response = await props.getRepos({
        orgId,
        integrationId: props.integration,
        // Refetching from the provider once is enough.
        forceRefresh: forceRefresh && page === 0,
        activeFilters: activeFilters.value,
        pagination: { page, entries_per_page: FETCH_PAGE_SIZE },
        search: { searchKey: "" },
        sort: {
          sortKey:
            props.config.defaultSortKey ?? GetRepositoriesSortInterface.CREATED,
          sortDirection: SortDirection.DESC,
        },
        bearerToken: authStore.getToken,
        handleBusinessErrors: true,
      });
      all.push(...response.data);
      if (page + 1 >= response.total_pages) break;
    }
    repos.value = all;
    // Drop selected repositories the new list no longer has.
    const ids = new Set(all.map((repo) => repo.id));
    const kept = [...selectedIds.value].filter((id) => ids.has(id));
    if (kept.length !== selectedIds.value.size) {
      selectedIds.value = new Set(kept);
      emitSelection();
    }
  } catch (err) {
    error.value = true;
    if (err instanceof BusinessLogicError) errorCode.value = err.error_code;
  } finally {
    loading.value = false;
  }
}

watch(activeFilters, () => void fetchRepos(true));

void fetchRepos();

defineExpose({ fetchRepos, clearSelection });

function formatDay(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<template>
  <Alert v-if="error" variant="destructive">
    <AlertDescription class="flex flex-col gap-3">
      <p>
        The repositories could not be loaded from the integration.
        <template v-if="invalidIntegration">
          The integration is no longer valid; update it in the organisation
          settings.
        </template>
      </p>
      <Button
        variant="outline"
        size="sm"
        class="w-fit"
        @click="fetchRepos(false, true)"
      >
        Try again
      </Button>
    </AlertDescription>
  </Alert>

  <div v-else class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end gap-4">
      <div class="flex flex-col gap-1.5">
        <Label for="repo-import-state">Show</Label>
        <Select v-model="importFilter" :disabled="loading || disabled">
          <SelectTrigger id="repo-import-state" class="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ONLY_NOT_IMPORTED">Not imported yet</SelectItem>
            <SelectItem :value="ALL_REPOSITORIES">All repositories</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div v-if="config.languages?.length" class="flex flex-col gap-1.5">
        <Label for="repo-language">Language</Label>
        <Select v-model="languageFilter" :disabled="loading || disabled">
          <SelectTrigger id="repo-language" class="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="language in config.languages"
              :key="language.key"
              :value="language.key"
            >
              {{ language.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-2 pb-2">
        <Checkbox
          id="repo-select-all"
          :model-value="allSelected"
          :disabled="disabled || selectable.length === 0"
          @update:model-value="
            (value: boolean | 'indeterminate') => selectAll(value === true)
          "
        />
        <Label for="repo-select-all">
          Select every repository not imported yet
        </Label>
      </div>
      <p
        class="ml-auto text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        {{ selectedRepos.length }}
        {{ selectedRepos.length === 1 ? "repository" : "repositories" }}
        selected
      </p>
    </div>

    <DataTable
      :columns="columns"
      :data="repos"
      :loading="loading"
      :initial-sorting="initialSorting"
      :row-key="(repo: Repository) => repo.id"
      caption="Repositories"
      filter-label="Filter repositories"
      :empty-text="
        selectable.length === 0 && repos.length > 0
          ? 'Every repository is already imported.'
          : 'No repositories found.'
      "
      row-testid="repo-row"
    >
      <template #cell-select="{ row }">
        <Checkbox
          :model-value="selectedIds.has(row.id)"
          :disabled="disabled || row.imported_already"
          :aria-label="`Select ${row.fully_qualified_name}`"
          @update:model-value="
            (value: boolean | 'indeterminate') => toggle(row, value === true)
          "
        />
      </template>
      <template #cell-repository="{ row }">
        <div class="flex flex-col">
          <span class="font-semibold text-foreground-strong">
            {{ row.fully_qualified_name }}
          </span>
          <span class="text-xs capitalize text-muted-foreground">
            {{ row.visibility
            }}<template v-if="row.language"> · {{ row.language }}</template>
          </span>
        </div>
      </template>
      <template #cell-imported="{ row }">
        <StatusBadge
          :tone="row.imported_already ? 'success' : 'neutral'"
          :label="row.imported_already ? 'Imported' : 'Not imported'"
        />
      </template>
      <template #cell-description="{ row }">
        <span class="line-clamp-2 max-w-md text-muted-foreground">
          {{ row.description || "No description" }}
        </span>
      </template>
      <template #cell-stars="{ row }">
        <span
          class="inline-flex items-center gap-1 tabular-nums"
          data-testid="repo-stars"
        >
          <Star aria-hidden="true" class="size-4 text-muted-foreground" />
          {{ (row.stargazers_count ?? 0).toLocaleString("en-US") }}
        </span>
      </template>
      <template #cell-created="{ row }">
        <span class="whitespace-nowrap">{{ formatDay(row.created_at) }}</span>
      </template>
    </DataTable>
  </div>
</template>
