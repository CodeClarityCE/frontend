<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useId } from "vue";

import { Progress } from "@/shadcn/ui/progress";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

import type { LoadProgress } from "../experiment.entity";
import { ExperimentsRepository } from "../experiments.repository";

const POLL_INTERVAL_MS = 1000;

const props = defineProps<{ experimentId: string }>();

const userStore = useUserStore();
const auth = useAuthStore();
const experimentsRepository = new ExperimentsRepository();

/** The last progress seen; kept once the read ends and statistics start */
const progress = ref<LoadProgress | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;
let stopped = false;
const labelId = useId();

const percent = computed(() =>
  progress.value
    ? Math.round((progress.value.done / progress.value.total) * 100)
    : 0,
);

const message = computed(() => {
  if (!progress.value) return "Preparing the results";
  if (progress.value.done >= progress.value.total) {
    return "Computing the statistics";
  }
  return `Reading stored results: ${progress.value.done} of ${progress.value.total} commits (${percent.value}%)`;
});

async function poll(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken) return;
  try {
    const response = await experimentsRepository.getLoadProgress({
      orgId,
      experimentId: props.experimentId,
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    if (response.data.total > 0) progress.value = response.data;
    else if (progress.value) {
      progress.value = {
        done: progress.value.total,
        total: progress.value.total,
      };
    }
  } catch {
    // Progress is a courtesy: the results request reports real failures
  }
  if (!stopped) timer = setTimeout(() => void poll(), POLL_INTERVAL_MS);
}

onMounted(() => void poll());
onUnmounted(() => {
  stopped = true;
  clearTimeout(timer);
});
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-card border bg-muted p-6 text-sm text-foreground"
    role="status"
  >
    <p :id="labelId">{{ message }}</p>
    <Progress :model-value="percent" :aria-labelledby="labelId" />
  </div>
</template>
