<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import { DataTable } from "@/base_components/data-table";
import type { Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import { AnalysisRepository } from "@/codeclarity_components/analyses/analysis.repository";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { errorToast } from "@/utils/toasts";

import { formatDateTime, scheduleLabel } from "../analysis-status";

// One run of a scheduled analysis, as the runs endpoint returns it.
interface AnalysisRun {
  index: number;
  run_date: string;
  plugin_count: number;
  result_count: number;
  plugins?: string[];
}

const props = defineProps<{ analysis: Analysis; projectID: string }>();
const emit = defineEmits<(e: "close") => void>();

const analysisRepository = new AnalysisRepository();
const authStore = useAuthStore();
const userStore = useUserStore();

const loading = ref(true);
const runs = ref<AnalysisRun[]>([]);

const columns: ColumnDef<AnalysisRun, unknown>[] = [
  {
    id: "date",
    accessorFn: (run) => new Date(run.run_date).getTime(),
    header: "Run",
  },
  { id: "plugins", accessorKey: "plugin_count", header: "Plugins" },
  { id: "results", accessorKey: "result_count", header: "Results" },
  { id: "actions", header: "Actions", enableSorting: false },
];

async function fetchRuns(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getToken) return;

  loading.value = true;
  try {
    const response = await analysisRepository.getAnalysisRuns({
      orgId,
      projectId: props.projectID,
      analysisId: props.analysis.id,
      bearerToken: authStore.getToken,
    });
    const data = (response.data ?? []) as unknown as Omit<
      AnalysisRun,
      "index"
    >[];
    runs.value = data.map((run, index) => ({ ...run, index }));
  } catch {
    errorToast("Failed to load the runs");
  } finally {
    loading.value = false;
  }
}

onMounted(() => void fetchRuns());
</script>

<template>
  <Dialog :open="true" @update:open="emit('close')">
    <DialogContent class="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Runs of this analysis</DialogTitle>
        <DialogDescription>
          {{ scheduleLabel(analysis) }} analysis started
          {{ formatDateTime(analysis.created_on) }}.
        </DialogDescription>
      </DialogHeader>

      <DataTable
        :columns="columns"
        :data="runs"
        :loading="loading"
        :page-size="10"
        caption="Runs"
        empty-text="No runs yet."
      >
        <template #cell-date="{ row }">
          <span class="whitespace-nowrap">
            {{ formatDateTime(row.run_date) }}
          </span>
          <span
            v-if="row.index === 0"
            class="ml-2 text-xs text-muted-foreground"
          >
            Latest
          </span>
        </template>
        <template #cell-plugins="{ row }">
          <div class="flex flex-col">
            <span class="tabular-nums">{{ row.plugin_count }}</span>
            <span
              v-if="row.plugins?.length"
              class="text-xs text-muted-foreground"
            >
              {{ row.plugins.join(", ") }}
            </span>
          </div>
        </template>
        <template #cell-results="{ row }">
          <span class="tabular-nums">{{ row.result_count }}</span>
        </template>
        <template #cell-actions="{ row }">
          <Button
            :as="RouterLink"
            :to="{
              name: 'results',
              query: {
                analysis_id: analysis.id,
                project_id: projectID,
                run_index: row.index,
              },
            }"
            variant="outline"
            size="sm"
          >
            Results
          </Button>
        </template>
      </DataTable>
    </DialogContent>
  </Dialog>
</template>
