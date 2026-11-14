<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { onMounted, type Ref, ref } from "vue";

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
const analysed = ref(false);
const failed = ref(false);

async function detectLanguages(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getToken) return;

  const recent = languageDetectionService.getMostRecentCompletedAnalysis(
    props.project.analyses ?? [],
  );
  if (!recent) return;

  analysed.value = true;
  loading.value = true;
  try {
    languages.value = await languageDetectionService.detectProjectLanguages(
      orgId,
      props.project.id,
      recent,
      authStore.getToken,
    );
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => void detectLanguages());
</script>

<template>
  <span v-if="loading" role="status" aria-label="Detecting languages">
    <Skeleton class="h-4 w-20" />
  </span>
  <span v-else-if="failed" class="text-muted-foreground">Unknown</span>
  <span v-else-if="!analysed" class="text-muted-foreground">Not analysed</span>
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
