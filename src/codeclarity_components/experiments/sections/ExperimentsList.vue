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
import { errorToast } from "@/utils/toasts";

import {
  type Experiment,
  ExperimentStatusLabels,
  finishedRunCount,
  formatExperimentDate,
  isExperimentActive,
} from "../experiment.entity";
import { ExperimentsRepository } from "../experiments.repository";
import ExperimentStatusBadge from "../ExperimentStatusBadge.vue";

/** How often the list refreshes while an experiment may still change */
const POLL_INTERVAL_MS = 10_000;
/** The API's largest page; every Experiment is loaded so the table can sort and filter them all */
const FETCH_PAGE_SIZE = 100;

const userStore = useUserStore();
const auth = useAuthStore();
const experimentsRepository = new ExperimentsRepository();

const experiments = ref<Experiment[]>([]);
const loaded = ref(false);
const hasError = ref(false);
let pollTimer: ReturnType<typeof setTimeout> | undefined;

const anyActive = computed(() =>
  experiments.value.some((experiment) => isExperimentActive(experiment)),
);

const createLink = { name: "experiments", params: { page: "add" } };

const columns: ColumnDef<Experiment, unknown>[] = [
  { id: "name", accessorKey: "name", header: "Name" },
  {
    id: "status",
    accessorFn: (experiment) => ExperimentStatusLabels[experiment.status],
    header: "Status",
  },
  { id: "dataset", accessorKey: "dataset_name", header: "Dataset" },
  {
    id: "runs",
    accessorFn: (experiment) => finishedRunCount(experiment.run_counts),
    header: "Finished runs",
    enableGlobalFilter: false,
  },
  {
    id: "created",
    accessorFn: (experiment) => new Date(experiment.created_on).getTime(),
    header: "Created",
    enableGlobalFilter: false,
  },
];

async function fetchAll(orgId: string, token: string): Promise<Experiment[]> {
  const all: Experiment[] = [];
  for (let page = 0; ; page++) {
    const response = await experimentsRepository.getExperiments({
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
    experiments.value = await fetchAll(orgId, auth.getToken);
    hasError.value = false;
  } catch {
    hasError.value = true;
    errorToast("Failed to load the experiments");
  } finally {
    loaded.value = true;
    schedulePoll();
  }
}

function schedulePoll(): void {
  clearTimeout(pollTimer);
  if (anyActive.value) {
    pollTimer = setTimeout(() => void load(), POLL_INTERVAL_MS);
  }
}

onMounted(() => void load());
onUnmounted(() => clearTimeout(pollTimer));
</script>

<template>
  <PageHeading
    description="One analyzer run over every repository of a Dataset, at each date of a snapshot grid."
  >
    <BrandEmphasis>Experiments</BrandEmphasis>
    <template #actions>
      <Button :as="RouterLink" :to="createLink">
        <Plus aria-hidden="true" />
        New Experiment
      </Button>
    </template>
  </PageHeading>

  <Alert v-if="hasError" variant="destructive">
    <AlertDescription>The Experiments could not be loaded.</AlertDescription>
  </Alert>

  <OwlEmptyState
    v-else-if="loaded && experiments.length === 0"
    title="No Experiments yet"
    description="An Experiment runs one analyzer over every repository of a ready Dataset and gathers the results across the whole cohort."
  >
    <Button :as="RouterLink" :to="createLink" arrow>
      Create an Experiment
    </Button>
  </OwlEmptyState>

  <DataTable
    v-else
    :columns="columns"
    :data="experiments"
    :loading="!loaded"
    :row-key="(experiment: Experiment) => experiment.id"
    caption="Experiments"
    filter-label="Filter Experiments"
    empty-text="No Experiments match."
    row-testid="experiment-row"
  >
    <template #cell-name="{ row }">
      <div class="flex flex-col">
        <RouterLink
          :to="{
            name: 'experiments',
            params: { page: 'detail' },
            query: { id: row.id },
          }"
          class="w-fit rounded-sm font-semibold text-foreground-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {{ row.name }}
        </RouterLink>
        <span v-if="row.analyzer_name" class="text-xs text-muted-foreground">
          {{ row.analyzer_name }}
        </span>
      </div>
    </template>
    <template #cell-status="{ row }">
      <ExperimentStatusBadge :status="row.status" />
    </template>
    <template #cell-runs="{ row }">
      <span class="tabular-nums">
        {{ finishedRunCount(row.run_counts) }} / {{ row.run_count }}
      </span>
    </template>
    <template #cell-created="{ row }">
      {{ formatExperimentDate(row.created_on, false) }}
    </template>
  </DataTable>
</template>
