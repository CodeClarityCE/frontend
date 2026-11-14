<script setup lang="ts">
import { Search } from "@lucide/vue";
import type { SortingState } from "@tanstack/vue-table";
import { refDebounced } from "@vueuse/core";
import { computed, ref, watch } from "vue";

import DataTablePagination from "@/base_components/data-table/DataTablePagination.vue";
import {
  createNewFilterState,
  type FilterState,
  FilterType,
} from "@/base_components/filters/filterTypes";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Input } from "@/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";

import VulnFilters from "./components/VulnFilters.vue";
import VulnList from "./VulnList.vue";
import type { VulnerabilityMerged } from "./VulnStats";
import VulnTable from "./VulnTable.vue";

const props = withDefaults(
  defineProps<{
    analysisID: string;
    projectID: string;
    workspace?: string;
    ecosystemFilter?: string | null;
  }>(),
  { workspace: ".", ecosystemFilter: null },
);

const PAGE_SIZE = 20;

const userStore = useUserStore();
const authStore = useAuthStore();
const repository = new ResultsRepository();

const view = ref("list");
const search = ref("");
const debouncedSearch = refDebounced(search, 300);
const pageIndex = ref(0);
const sorting = ref<SortingState>([{ id: "severity", desc: true }]);
const filterState = ref<FilterState>(
  createNewFilterState({
    AttributeState: {
      name: "Matching",
      type: FilterType.CHECKBOX,
      data: {
        hide_correct_matching: { title: "Hide correct", value: false },
        hide_possibly_incorrect_matching: {
          title: "Hide possibly incorrect",
          value: false,
        },
        hide_incorrect_matching: { title: "Hide incorrect", value: false },
      },
    },
    BlacklistState: {
      name: "Policy status",
      type: FilterType.CHECKBOX,
      data: {
        show_blacklisted: { title: "Show policy excluded", value: false },
      },
    },
  }),
);

const findings = ref<VulnerabilityMerged[]>([]);
const total = ref(0);
const loading = ref(true);
const failed = ref(false);

// The list's sort choices; the table sorts by its column headers.
const SORT_OPTIONS = [
  { value: "severity:desc", label: "Severity, highest first" },
  { value: "severity:asc", label: "Severity, lowest first" },
  { value: "exploitability:desc", label: "Exploitability, highest first" },
  { value: "cve:asc", label: "CVE, A to Z" },
  { value: "dep_name:asc", label: "Dependency, A to Z" },
];

const sortValue = computed({
  get: () => {
    const first = sorting.value[0];
    return first ? `${first.id}:${first.desc ? "desc" : "asc"}` : "";
  },
  set: (value: string) => {
    const [id = "severity", direction] = value.split(":");
    sorting.value = [{ id, desc: direction === "desc" }];
    pageIndex.value = 0;
  },
});

const filtered = computed(
  () => debouncedSearch.value !== "" || filterState.value.activeFilters.length,
);

const emptyText = computed(() =>
  filtered.value
    ? "No vulnerabilities match the search or filters."
    : "No vulnerabilities found.",
);

const showBlacklisted = computed(
  () =>
    filterState.value.filterConfig.BlacklistState?.data.show_blacklisted
      ?.value ?? false,
);

// Counts requests so an answer for an earlier query is dropped.
let latestRequest = 0;

async function load(): Promise<void> {
  const org = userStore.getDefaultOrg;
  const token = authStore.getToken;
  if (!org || !token || props.analysisID === "" || props.projectID === "")
    return;
  const request = ++latestRequest;
  const sort = sorting.value[0] ?? { id: "severity", desc: true };
  try {
    const res = await repository.getVulnerabilities({
      orgId: org.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: props.workspace,
      bearerToken: token,
      pagination: { page: pageIndex.value, entries_per_page: PAGE_SIZE },
      sort: {
        sortKey: sort.id,
        sortDirection: sort.desc ? SortDirection.DESC : SortDirection.ASC,
      },
      active_filters: filterState.value.toString(),
      search_key: debouncedSearch.value,
      ecosystem_filter: props.ecosystemFilter ?? undefined,
      show_blacklisted: showBlacklisted.value,
      handleBusinessErrors: true,
    });
    if (request !== latestRequest) return;
    findings.value = res.data;
    total.value = res.matching_count ?? res.total_entries;
    failed.value = false;
  } catch {
    if (request !== latestRequest) return;
    findings.value = [];
    total.value = 0;
    failed.value = true;
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

// A new query starts from the first page.
watch(
  [
    debouncedSearch,
    () => filterState.value.toString(),
    () => props.workspace,
    () => props.ecosystemFilter,
  ],
  () => {
    pageIndex.value = 0;
  },
);

watch(
  [
    pageIndex,
    sorting,
    debouncedSearch,
    () => filterState.value.toString(),
    () => props.workspace,
    () => props.ecosystemFilter,
    () => props.analysisID,
    () => props.projectID,
  ],
  () => void load(),
  { immediate: true },
);
</script>

<template>
  <Tabs v-model="view" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative w-full max-w-sm">
        <Search
          aria-hidden="true"
          class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="search"
          type="search"
          aria-label="Search vulnerabilities"
          placeholder="Search by dependency, version or CVE"
          class="pl-9"
        />
      </div>
      <VulnFilters v-model:filter-state="filterState" />
      <div class="ml-auto flex items-center gap-3">
        <Select v-if="view === 'list'" v-model="sortValue">
          <SelectTrigger aria-label="Sort by" class="w-60">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in SORT_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <TabsList aria-label="View">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
      </div>
    </div>

    <p
      v-if="!loading && !failed"
      class="text-sm text-muted-foreground"
      aria-live="polite"
    >
      {{ total }} {{ total === 1 ? "vulnerability" : "vulnerabilities" }}
    </p>

    <Alert v-if="failed" variant="destructive">
      <AlertTitle>Could not load the vulnerabilities</AlertTitle>
      <AlertDescription>Reload the page to try again.</AlertDescription>
    </Alert>

    <TabsContent value="list" class="mt-0 flex flex-col gap-4">
      <VulnList
        :findings="findings"
        :loading="loading"
        :empty-text="emptyText"
        :analysis-i-d="analysisID"
        :project-i-d="projectID"
      />
      <DataTablePagination
        v-if="!loading && total > PAGE_SIZE"
        :page-index="pageIndex"
        :page-size="PAGE_SIZE"
        :total="total"
        @update:page-index="pageIndex = $event"
      />
    </TabsContent>
    <TabsContent value="table" class="mt-0">
      <VulnTable
        v-model:page-index="pageIndex"
        :findings="findings"
        :total="total"
        :loading="loading"
        :empty-text="emptyText"
        :sorting="sorting"
        :page-size="PAGE_SIZE"
        :analysis-i-d="analysisID"
        :project-i-d="projectID"
        @update:sorting="sorting = $event"
      />
    </TabsContent>
  </Tabs>
</template>
