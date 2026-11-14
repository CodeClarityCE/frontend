<script lang="ts" setup>
import type { ColumnDef } from "@tanstack/vue-table";
import { computed, type Ref, ref, watch } from "vue";

import { DataTable } from "@/base_components/data-table";
import { StatTile, StatusBadge } from "@/base_components/page";
import type { License } from "@/codeclarity_components/results/licenses/License";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { SortDirection } from "@/utils/api/PaginatedRequestOptions";

import SelectWorkspace from "../SelectWorkspace.vue";

import { licenseFamily, licenseName, licenseStatus } from "./license-format";
import LicenseComponent from "./LicenseComponent.vue";

const props = withDefaults(
  defineProps<{
    analysisID?: string;
    projectID?: string;
    executedSbomPlugins?: string[];
  }>(),
  { analysisID: "", projectID: "", executedSbomPlugins: () => [] },
);

const resultsRepository = new ResultsRepository();
const userStore = useUserStore();
const authStore = useAuthStore();

const licenses: Ref<License[]> = ref([]);
const loading = ref(true);
const failed = ref(false);
const selected_workspace = ref(".");
const ecosystemFilter: Ref<string | null> = ref(null);

// Counts requests so an answer for an earlier selection is dropped.
let latestRequest = 0;

// Every license of the analysis; the API pages at 100.
async function load(): Promise<void> {
  const org = userStore.getDefaultOrg;
  const token = authStore.getToken;
  if (!org || !token || props.projectID === "" || props.analysisID === "")
    return;
  const request = ++latestRequest;
  const fetchPage = (
    page: number,
  ): ReturnType<typeof resultsRepository.getLicenses> =>
    resultsRepository.getLicenses({
      orgId: org.id,
      projectId: props.projectID,
      analysisId: props.analysisID,
      workspace: selected_workspace.value,
      bearerToken: token,
      pagination: { page, entries_per_page: 100 },
      sort: { sortKey: "type", sortDirection: SortDirection.DESC },
      active_filters: "",
      search_key: "",
      ecosystem_filter: ecosystemFilter.value ?? undefined,
      handleBusinessErrors: true,
    });
  try {
    const first = await fetchPage(0);
    const rest = await Promise.all(
      Array.from(
        { length: Math.max(0, (first.total_pages ?? 1) - 1) },
        (_, i) => fetchPage(i + 1),
      ),
    );
    if (request !== latestRequest) return;
    licenses.value = [first, ...rest].flatMap((page) => page.data ?? []);
    failed.value = false;
  } catch {
    if (request === latestRequest) failed.value = true;
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

watch(
  [
    () => props.projectID,
    () => props.analysisID,
    selected_workspace,
    ecosystemFilter,
  ],
  () => void load(),
  { immediate: true },
);

function count(predicate: (license: License) => boolean): number {
  return licenses.value.filter(predicate).length;
}

const dependencyCount = computed(() =>
  licenses.value.reduce(
    (total, license) => total + (license.deps_using_license?.length ?? 0),
    0,
  ),
);

const columns: ColumnDef<License, unknown>[] = [
  { id: "name", header: "License", accessorFn: (l) => licenseName(l) },
  {
    id: "family",
    header: "Type",
    enableGlobalFilter: false,
    accessorFn: (l) => licenseFamily(l),
  },
  {
    id: "status",
    header: "Status",
    enableGlobalFilter: false,
    accessorFn: (l) => licenseStatus(l).label,
  },
  {
    id: "dependencies",
    header: "Dependencies",
    enableGlobalFilter: false,
    accessorFn: (l) => l.deps_using_license?.length ?? 0,
  },
  {
    id: "details",
    header: "Details",
    enableSorting: false,
    enableGlobalFilter: false,
    accessorFn: () => null,
  },
];

function rowKey(license: License): string {
  return license.id;
}
</script>

<template>
  <section aria-labelledby="licenses-heading" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2
        id="licenses-heading"
        class="text-xl font-semibold tracking-tight text-foreground-strong"
      >
        Licenses
      </h2>
      <SelectWorkspace
        v-model:selected_workspace="selected_workspace"
        :project-i-d="projectID"
        :analysis-i-d="analysisID"
        :executed-sbom-plugins="executedSbomPlugins"
        @ecosystem-filter-changed="ecosystemFilter = $event"
      />
    </div>

    <Alert v-if="failed" variant="destructive">
      <AlertTitle>Could not load the licenses</AlertTitle>
      <AlertDescription>Reload the page to try again.</AlertDescription>
    </Alert>

    <template v-else>
      <ul
        v-if="!loading"
        aria-label="License numbers"
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <StatTile label="Licenses" :value="licenses.length" />
        <StatTile
          label="Dependencies"
          :value="dependencyCount"
          hint="Using these licenses"
        />
        <StatTile
          label="Permissive"
          :value="count((l) => licenseFamily(l) === 'Permissive')"
          hint="MIT, BSD, Apache and similar"
        />
        <StatTile
          label="Copyleft"
          :value="count((l) => licenseFamily(l) === 'Copyleft')"
          hint="GPL, LGPL, MPL and similar"
        />
        <StatTile
          label="Policy violations"
          :value="count((l) => l.license_compliance_violation)"
          :hint="`${count((l) => l.unable_to_infer)} need review`"
        />
      </ul>

      <DataTable
        :columns="columns"
        :data="licenses"
        :loading="loading"
        :row-key="rowKey"
        caption="Licenses"
        filter-label="Search licenses"
        empty-text="No licenses found."
      >
        <template #cell-name="{ row }">
          <span class="font-semibold text-foreground-strong">{{
            licenseName(row)
          }}</span>
          <span
            v-if="row.name && row.name !== row.id"
            class="ml-1 text-muted-foreground"
            >({{ row.id }})</span
          >
        </template>
        <template #cell-status="{ row }">
          <StatusBadge v-bind="licenseStatus(row)" class="whitespace-nowrap" />
        </template>
        <template #cell-details="{ row }">
          <LicenseComponent
            :license="row"
            :analysis-i-d="analysisID"
            :project-i-d="projectID"
          />
        </template>
      </DataTable>
    </template>
  </section>
</template>
