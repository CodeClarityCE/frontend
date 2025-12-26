<script setup lang="ts">
import type { Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import { AnalysisRepository } from "@/codeclarity_components/analyses/analysis.repository";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { formatDate } from "@/utils/dateUtils";
import { Icon } from "@iconify/vue";
import { ref, onMounted } from "vue";

const props = defineProps({
  analysis: {
    type: Object as () => Analysis,
    required: true,
  },
  projectID: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<(e: "close") => void>();

// Repositories
const analysisRepository = new AnalysisRepository();

// Stores
const authStore = useAuthStore();
const userStore = useUserStore();

// State
const loading = ref(true);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runs = ref<any[]>([]);
const selectedRun = ref<number>(0);

// Methods
async function fetchAnalysisRuns(): Promise<void> {
  if (!userStore.getUser?.default_org?.id) return;

  loading.value = true;
  try {
    const response = await analysisRepository.getAnalysisRuns({
      orgId: userStore.getUser.default_org.id,
      projectId: props.projectID,
      analysisId: props.analysis.id,
      bearerToken: authStore.getToken!,
    });
    runs.value = response.data ?? [];
  } catch (error) {
    console.error("Failed to fetch analysis runs:", error);
  } finally {
    loading.value = false;
  }
}

function viewRunResults(runIndex: number): void {
  selectedRun.value = runIndex;
  // For now, navigate to the regular results view
  // In the future, we can add a run_index parameter to filter specific run results
  void router.push({
    name: "results",
    query: {
      analysis_id: props.analysis.id,
      project_id: props.projectID,
      run_index: runIndex,
    },
  });
  void emit("close");
}

onMounted(() => {
  void fetchAnalysisRuns();
});
</script>

<template>
  <Dialog :open="true" @update:open="emit('close')">
    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Icon icon="solar:history-bold" class="h-5 w-5 text-theme-primary" />
          Analysis History
          <span
            v-if="
              props.analysis.schedule_type &&
              props.analysis.schedule_type !== 'once'
            "
            class="text-sm font-normal text-gray-500"
          >
            ({{ props.analysis.schedule_type }})
          </span>
        </DialogTitle>
      </DialogHeader>

      <div class="mt-4">
        <div v-if="loading" class="space-y-3">
          <Skeleton class="h-20 w-full" />
          <Skeleton class="h-20 w-full" />
          <Skeleton class="h-20 w-full" />
        </div>

        <div v-else-if="runs.length === 0" class="text-center py-8">
          <Icon
            icon="solar:document-text-linear"
            class="h-12 w-12 text-gray-300 mx-auto mb-3"
          />
          <p class="text-gray-500">No analysis runs found</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(run, index) in runs"
            :key="index"
            class="border rounded-lg p-4 hover:border-theme-primary/50 transition-colors cursor-pointer"
            :class="{
              'border-theme-primary bg-theme-primary/5': selectedRun === index,
            }"
            @click="selectedRun = index"
          >
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <Icon
                    icon="solar:calendar-bold"
                    class="h-4 w-4 text-theme-primary"
                  />
                  <span class="font-medium">
                    {{ formatDate(run.run_date, "MMM DD, YYYY HH:mm") }}
                  </span>
                  <span
                    v-if="index === 0"
                    class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                  >
                    Latest
                  </span>
                </div>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                  <span class="flex items-center gap-1">
                    <Icon icon="solar:layers-bold" class="h-3.5 w-3.5" />
                    {{ run.plugin_count }}
                    {{ run.plugin_count === 1 ? "plugin" : "plugins" }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon icon="solar:document-bold" class="h-3.5 w-3.5" />
                    {{ run.result_count }}
                    {{ run.result_count === 1 ? "result" : "results" }}
                  </span>
                </div>
                <div
                  v-if="run.plugins && run.plugins.length > 0"
                  class="flex flex-wrap gap-1 mt-2"
                >
                  <span
                    v-for="plugin in run.plugins"
                    :key="plugin"
                    class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                  >
                    {{ plugin }}
                  </span>
                </div>
              </div>
              <Button size="sm" @click.stop="viewRunResults(index)">
                <Icon icon="solar:eye-bold" class="h-4 w-4 mr-1" />
                View Results
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
