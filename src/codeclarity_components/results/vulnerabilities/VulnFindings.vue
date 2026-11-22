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
  getActiveState,
} from "@/base_components/filters/filterTypes";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
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
import {
  type HiddenCounts,
  HiddenReason,
  type VulnerabilityMerged,
} from "./VulnStats";
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

const emit = defineEmits<{
  "show-blacklisted-changed": [show: boolean];
}>();

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
        hide_uncorroborated: { title: "Hide uncorroborated", value: false },
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
    HiddenState: {
      name: "Hidden instances",
      type: FilterType.CHECKBOX,
      data: {
        show_contradicted: { title: "Show contradicted", value: false },
        show_retired: { title: "Show retired on all sources", value: false },
      },
    },
  }),
);

// The hidden reasons, their filter option and how the hidden line words them.
const HIDDEN_REASONS = [
  {
    reason: HiddenReason.Contradicted,
    option: "show_contradicted",
    text: "contradicted by another source",
  },
  {
    reason: HiddenReason.RetiredAll,
    option: "show_retired",
    text: "retired on all sources",
  },
] as const;

const findings = ref<VulnerabilityMerged[]>([]);
// How many vulnerabilities each filter would leave, from the API.
const filterCount = ref<Record<string, number>>({});
const total = ref(0);
// False for analyses made before source verdicts, which hide nothing.
const verdictsAvailable = ref(true);
const hiddenCounts = ref<HiddenCounts>({
  [HiddenReason.Contradicted]: 0,
  [HiddenReason.RetiredAll]: 0,
});
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

function hiddenShown(option: string): boolean {
  return (
    filterState.value.filterConfig.HiddenState?.data[option]?.value ?? false
  );
}

function setHiddenShown(option: string, value: boolean): void {
  const state = filterState.value;
  const entry = state.filterConfig.HiddenState?.data[option];
  if (!entry) return;
  entry.value = value;
  state.activeFilters = getActiveState(state.filterConfig);
}

// One line per hidden reason that hid something, with a toggle to show them.
const hiddenLines = computed(() =>
  HIDDEN_REASONS.filter(({ reason }) => hiddenCounts.value[reason] > 0).map(
    ({ reason, option, text }) => {
      const shown = hiddenShown(option);
      return {
        option,
        shown,
        text: `${hiddenCounts.value[reason]} ${shown ? "shown" : "hidden"}: ${text}`,
        action: shown ? `Hide instances ${text}` : `Show instances ${text}`,
      };
    },
  ),
);

// The stats above the list follow the same toggle.
watch(showBlacklisted, (show) => emit("show-blacklisted-changed", show));

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
      show_contradicted: hiddenShown("show_contradicted"),
      show_retired: hiddenShown("show_retired"),
      handleBusinessErrors: true,
    });
    if (request !== latestRequest) return;
    findings.value = res.data;
    filterCount.value = res.filter_count ?? {};
    total.value = res.matching_count ?? res.total_entries;
    verdictsAvailable.value = res.source_verdicts_available !== false;
    hiddenCounts.value = {
      [HiddenReason.Contradicted]:
        res.hidden_counts?.[HiddenReason.Contradicted] ?? 0,
      [HiddenReason.RetiredAll]:
        res.hidden_counts?.[HiddenReason.RetiredAll] ?? 0,
    };
    failed.value = false;
  } catch {
    if (request !== latestRequest) return;
    findings.value = [];
    filterCount.value = {};
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
      <VulnFilters v-model:filter-state="filterState" :counts="filterCount" />
      <div class="ml-auto flex flex-wrap items-center gap-3">
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

    <ul
      v-if="!loading && !failed && hiddenLines.length > 0"
      aria-label="Hidden instances"
      class="-mt-2 flex flex-col gap-1 text-sm text-muted-foreground"
    >
      <li
        v-for="line in hiddenLines"
        :key="line.option"
        class="flex flex-wrap items-center gap-2"
      >
        <span>{{ line.text }}</span>
        <Button
          variant="link"
          size="sm"
          class="h-auto p-0"
          :aria-label="line.action"
          @click="setHiddenShown(line.option, !line.shown)"
        >
          {{ line.shown ? "Hide" : "Show" }}
        </Button>
      </li>
    </ul>

    <p
      v-if="!loading && !failed && !verdictsAvailable && total > 0"
      class="-mt-2 text-sm text-muted-foreground"
    >
      This analysis predates source verdicts, so nothing is hidden. Re-run it to
      explain each vulnerability.
    </p>

    <Alert v-if="failed" variant="destructive">
      <AlertTitle>Could not load the vulnerabilities</AlertTitle>
      <AlertDescription>Reload the page to try again.</AlertDescription>
    </Alert>

    <TabsContent v-if="!failed" value="list" class="mt-0 flex flex-col gap-4">
      <VulnList
        :findings="findings"
        :loading="loading"
        :empty-text="emptyText"
        :analysis-i-d="analysisID"
        :project-i-d="projectID"
        :workspace="workspace"
      />
      <DataTablePagination
        v-if="!loading && total > PAGE_SIZE"
        :page-index="pageIndex"
        :page-size="PAGE_SIZE"
        :total="total"
        @update:page-index="pageIndex = $event"
      />
    </TabsContent>
    <TabsContent v-if="!failed" value="table" class="mt-0">
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
        :workspace="workspace"
        @update:sorting="sorting = $event"
      />
    </TabsContent>
  </Tabs>
</template>
