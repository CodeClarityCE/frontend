<script setup lang="ts">
import { ChevronDown, History, Trash2 } from "@lucide/vue";
import type { ColumnDef } from "@tanstack/vue-table";
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";

import { DataTable } from "@/base_components/data-table";
import { StatusBadge } from "@/base_components/page";
import {
  type Analysis,
  stageSkipReason,
} from "@/codeclarity_components/analyses/analysis.entity";
import { AnalysisRepository } from "@/codeclarity_components/analyses/analysis.repository";
import AnalysisFailureReason from "@/codeclarity_components/analyses/AnalysisFailureReason.vue";
import type { Project } from "@/codeclarity_components/projects/project.entity";
import { Button } from "@/shadcn/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shadcn/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { errorToast, successToast } from "@/utils/toasts";

import {
  analysisStatus,
  byNewest,
  formatDateTime,
  isFinished,
  isScheduled,
  scheduleLabel,
  stepDuration,
  stepStatus,
} from "../analysis-status";

import AnalysisRuns from "./AnalysisRuns.vue";

const props = defineProps<{ project: Project }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<(e: "changed") => void>();

const analysisRepository = new AnalysisRepository();
const authStore = useAuthStore();
const userStore = useUserStore();

const analyses = computed(() => byNewest(props.project.analyses));
const toDelete = ref<Analysis | null>(null);
const deleting = ref(false);
const runsOf = ref<Analysis | null>(null);

const columns: ColumnDef<Analysis, unknown>[] = [
  {
    id: "started",
    accessorFn: (analysis) => new Date(analysis.created_on).getTime(),
    header: "Started",
    enableGlobalFilter: false,
  },
  {
    id: "status",
    accessorFn: (analysis) => analysisStatus(analysis).label,
    header: "Status",
  },
  {
    id: "schedule",
    accessorFn: (analysis) => scheduleLabel(analysis),
    header: "Schedule",
  },
  {
    id: "steps",
    header: "Steps",
    enableSorting: false,
    enableGlobalFilter: false,
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableGlobalFilter: false,
  },
];

function stepsOf(analysis: Analysis): Analysis["steps"][number] {
  return (analysis.steps ?? []).flat().filter((stage) => stage.Name);
}

function resultsLink(analysis: Analysis): Record<string, unknown> {
  const query: Record<string, string | number> = {
    analysis_id: analysis.id,
    project_id: props.project.id,
  };
  if (isScheduled(analysis)) query.run_index = 0;
  return { name: "results", query };
}

async function deleteAnalysis(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!toDelete.value || !orgId || !authStore.getToken) return;

  deleting.value = true;
  try {
    await analysisRepository.deleteAnalysis({
      orgId,
      projectId: props.project.id,
      analysisId: toDelete.value.id,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    successToast("Analysis deleted");
    emit("changed");
  } catch {
    errorToast("Failed to delete the analysis");
  } finally {
    deleting.value = false;
    toDelete.value = null;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[85vh] max-w-5xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Analyses of {{ project.name }}</DialogTitle>
        <DialogDescription>
          Every analysis of this project, newest first.
        </DialogDescription>
      </DialogHeader>

      <DataTable
        :columns="columns"
        :data="analyses"
        :row-key="(analysis: Analysis) => analysis.id"
        :page-size="10"
        caption="Analyses"
        empty-text="This project has no analyses yet."
      >
        <template #cell-started="{ row }">
          <span class="whitespace-nowrap">
            {{ formatDateTime(row.created_on) }}
          </span>
        </template>
        <template #cell-status="{ row }">
          <div class="flex max-w-64 flex-col gap-1">
            <StatusBadge
              :tone="analysisStatus(row).tone"
              :label="analysisStatus(row).label"
              :busy="analysisStatus(row).busy"
              class="w-fit"
            />
            <AnalysisFailureReason :analysis="row" />
          </div>
        </template>
        <template #cell-schedule="{ row }">
          <div class="flex flex-col">
            <span>{{ scheduleLabel(row) }}</span>
            <span
              v-if="isScheduled(row) && row.next_scheduled_run"
              class="text-xs text-muted-foreground"
            >
              Next {{ formatDateTime(row.next_scheduled_run) }}
            </span>
          </div>
        </template>
        <template #cell-steps="{ row }">
          <Collapsible v-if="stepsOf(row).length > 0">
            <CollapsibleTrigger as-child>
              <Button variant="ghost" size="sm" class="group -ml-3">
                {{ stepsOf(row).length }} steps
                <ChevronDown
                  aria-hidden="true"
                  class="transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul class="mt-2 flex flex-col gap-1.5 text-xs">
                <li
                  v-for="stage in stepsOf(row)"
                  :key="stage.Name"
                  class="flex flex-wrap items-center gap-2"
                >
                  <span class="font-medium text-foreground">
                    {{ stage.Name }}
                  </span>
                  <StatusBadge
                    :tone="stepStatus(stage).tone"
                    :label="stepStatus(stage).label"
                    :busy="stepStatus(stage).busy"
                  />
                  <span
                    v-if="stageSkipReason(stage)"
                    class="text-muted-foreground"
                  >
                    {{ stageSkipReason(stage) }}
                  </span>
                  <span
                    v-if="stepDuration(stage)"
                    class="text-muted-foreground"
                  >
                    {{ stepDuration(stage) }}
                  </span>
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
          <span v-else class="text-muted-foreground">Not started</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <Button
              v-if="isFinished(row)"
              :as="RouterLink"
              :to="resultsLink(row)"
              variant="outline"
              size="sm"
            >
              Results
            </Button>
            <Button
              v-if="isScheduled(row)"
              variant="ghost"
              size="sm"
              @click="runsOf = row"
            >
              <History aria-hidden="true" />
              Runs
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              :aria-label="`Delete the analysis started ${formatDateTime(row.created_on)}`"
              @click="toDelete = row"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </template>
      </DataTable>
    </DialogContent>
  </Dialog>

  <Dialog
    :open="toDelete !== null"
    @update:open="(value: boolean) => !value && (toDelete = null)"
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete this analysis?</DialogTitle>
        <DialogDescription>
          The analysis started {{ formatDateTime(toDelete?.created_on) }} and
          all its results are deleted. This cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" :disabled="deleting" @click="toDelete = null">
          Cancel
        </Button>
        <Button
          variant="destructive"
          :disabled="deleting"
          @click="deleteAnalysis"
        >
          {{ deleting ? "Deleting" : "Delete analysis" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <AnalysisRuns
    v-if="runsOf"
    :analysis="runsOf"
    :project-i-d="project.id"
    @close="runsOf = null"
  />
</template>
