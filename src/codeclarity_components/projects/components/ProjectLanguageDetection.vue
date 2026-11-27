<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { computed, type Ref, ref, watch } from "vue";

import {
  byNewest,
  isCancelled,
  isFailed,
  isFinished,
  isRunning,
} from "@/codeclarity_components/projects/list/analysis-status";
import type { Project } from "@/codeclarity_components/projects/project.entity";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import {
  type DetectedLanguage,
  LanguageDetectionService,
} from "@/utils/languageDetection";

// The languages found by the project's latest completed analysis.
const props = defineProps<{ project: Project }>();

const authStore = useAuthStore();
const userStore = useUserStore();
const languageDetectionService = new LanguageDetectionService();

const languages: Ref<DetectedLanguage[]> = ref([]);
const loading = ref(false);
const failed = ref(false);

const analyses = computed(() => byNewest(props.project.analyses));
const completed = computed(() => analyses.value.find(isFinished));

// Why there are no languages yet, when no analysis has completed.
const pending = computed(() => {
  const latest = analyses.value[0];
  if (!latest) return "Not analysed";
  if (isFailed(latest)) return "Analysis failed";
  if (isCancelled(latest)) return "Analysis cancelled";
  if (isRunning(latest)) return "Analysis running";
  return "Analysis queued";
});

async function detectLanguages(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  const recent = completed.value;
  if (!orgId || !authStore.getAuthenticated || !recent) return;

  loading.value = true;
  failed.value = false;
  try {
    languages.value = await languageDetectionService.detectProjectLanguages(
      orgId,
      props.project.id,
      recent,
    );
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

// Detects again only when a newer analysis completes.
watch(
  () => completed.value?.id,
  () => void detectLanguages(),
  { immediate: true },
);
</script>

<template>
  <span v-if="!completed" class="whitespace-nowrap text-muted-foreground">
    {{ pending }}
  </span>
  <span v-else-if="loading" role="status" aria-label="Detecting languages">
    <Skeleton class="h-4 w-20" />
  </span>
  <span v-else-if="failed" class="text-muted-foreground">Unknown</span>
  <span v-else-if="languages.length === 0" class="text-muted-foreground">
    None found
  </span>
  <span v-else class="flex flex-wrap items-center gap-3">
    <span
      v-for="language in languages"
      :key="language.name"
      class="inline-flex items-center gap-1.5"
    >
      <Icon :icon="language.icon" aria-hidden="true" class="size-4" />
      {{ language.name }}
    </span>
  </span>
</template>
