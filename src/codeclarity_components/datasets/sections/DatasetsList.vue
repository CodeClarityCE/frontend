<script setup lang="ts">
import { Plus } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";

import { DataTable } from "@/base_components/data-table";
import {
  BrandEmphasis,
  OwlEmptyState,
  PageHeading,
} from "@/base_components/page";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { formatShortDate } from "@/utils/dateUtils";
import { errorToast } from "@/utils/toasts";

import { type Dataset, DatasetStatus } from "../dataset.entity";
import { DatasetsRepository } from "../datasets.repository";
import DatasetStatusBadge from "../DatasetStatusBadge.vue";

/** How often the list refreshes while a dataset is building */
const POLL_INTERVAL_MS = 5000;
/** The API's largest page; every Dataset is loaded so the table can sort and filter them all */
const FETCH_PAGE_SIZE = 100;

const userStore = useUserStore();
const auth = useAuthStore();
const datasetsRepository = new DatasetsRepository();

const datasets = ref<Dataset[]>([]);
const loaded = ref(false);
const hasError = ref(false);
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const anyBuilding = computed(() =>
  datasets.value.some((dataset) => dataset.status === DatasetStatus.BUILDING),
);

const columns: ColumnDef<Dataset, unknown>[] = [
  { id: "name", accessorKey: "name", header: "Name" },
  { id: "status", accessorKey: "status", header: "Status" },
  {
    id: "repositories",
    accessorKey: "entry_count",
    header: "Repositories",
    enableGlobalFilter: false,
  },
  {
    id: "languages",
    accessorFn: (dataset) => dataset.params.languages.join(", "),
    header: "Languages",
    enableSorting: false,
  },
  {
    id: "built",
    accessorFn: (dataset) =>
      dataset.built_on ? new Date(dataset.built_on).getTime() : 0,
    header: "Built",
    enableGlobalFilter: false,
  },
];

async function fetchAll(orgId: string, token: string): Promise<Dataset[]> {
  const all: Dataset[] = [];
  for (let page = 0; ; page++) {
    const response = await datasetsRepository.getDatasets({
      orgId,
      pagination: { page, entries_per_page: FETCH_PAGE_SIZE },
      bearerToken: token,
      handleBusinessErrors: true,
    });
    all.push(...response.data);
    if (page + 1 >= response.total_pages) return all;
  }
}

async function load(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken) return;

  try {
    datasets.value = await fetchAll(orgId, auth.getToken);
    hasError.value = false;
  } catch {
    hasError.value = true;
    errorToast("Failed to load the datasets");
  } finally {
    loaded.value = true;
    schedulePoll();
  }
}

function schedulePoll(): void {
  clearTimeout(pollTimer);
  if (anyBuilding.value) {
    pollTimer = setTimeout(() => void load(), POLL_INTERVAL_MS);
  }
}

onMounted(() => void load());
onUnmounted(() => clearTimeout(pollTimer));

defineExpose({ load });
</script>

<template>
  <PageHeading
    description="Reproducible cohorts of the most-starred GitHub projects."
  >
    <BrandEmphasis>Datasets</BrandEmphasis>
    <template #actions>
      <Button
        :as="RouterLink"
        :to="{ name: 'datasets', params: { page: 'add' } }"
      >
        <Plus aria-hidden="true" />
        New Dataset
      </Button>
    </template>
  </PageHeading>

  <Alert v-if="hasError" variant="destructive">
    <AlertDescription>The Datasets could not be loaded.</AlertDescription>
  </Alert>

  <OwlEmptyState
    v-else-if="loaded && datasets.length === 0"
    title="No Datasets yet"
    description="A Dataset ranks GitHub repositories by stars and keeps the ones whose root commits a package.json and a lockfile. Experiments run on it."
  >
    <Button
      :as="RouterLink"
      :to="{ name: 'datasets', params: { page: 'add' } }"
      arrow
    >
      Create a Dataset
    </Button>
  </OwlEmptyState>

  <DataTable
    v-else
    :columns="columns"
    :data="datasets"
    :loading="!loaded"
    :row-key="(dataset: Dataset) => dataset.id"
    caption="Datasets"
    filter-label="Filter Datasets"
    empty-text="No Datasets match."
    row-testid="dataset-row"
  >
    <template #cell-name="{ row }">
      <div class="flex flex-col">
        <RouterLink
          :to="{
            name: 'datasets',
            params: { page: 'detail' },
            query: { id: row.id },
          }"
          class="w-fit rounded-sm font-semibold text-foreground-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {{ row.name }}
        </RouterLink>
        <span v-if="row.created_by_name" class="text-xs text-muted-foreground">
          by {{ row.created_by_name }}
        </span>
      </div>
    </template>
    <template #cell-status="{ row }">
      <DatasetStatusBadge :status="row.status" />
    </template>
    <template #cell-repositories="{ row }">
      <span class="tabular-nums">
        <template v-if="row.status === DatasetStatus.READY">
          {{ row.entry_count }} / {{ row.params.limit }}
        </template>
        <template v-else>Up to {{ row.params.limit }}</template>
      </span>
    </template>
    <template #cell-built="{ row }">
      {{ formatShortDate(row.built_on, { fallback: "Not yet" }) }}
    </template>
  </DataTable>
</template>
