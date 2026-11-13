<script lang="ts" setup>
import { computed, onMounted, type Ref, ref } from "vue";

import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Badge } from "@/shadcn/ui/badge";
import { Button } from "@/shadcn/ui/button";
import { RadioGroup, RadioGroupItem } from "@/shadcn/ui/radio-group";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";

import {
  type AnalyzerTemplate,
  AnalyzerTemplatesRepository,
} from "../AnalyzerTemplatesRepository";

const props = defineProps<{
  selectedTemplate?: AnalyzerTemplate | null;
}>();

const emit = defineEmits<{
  "update:selectedTemplate": [template: AnalyzerTemplate | null];
  templateChanged: [template: AnalyzerTemplate];
}>();

// The radio value for "no template".
const CUSTOM = "__custom__";

const templatesRepo = new AnalyzerTemplatesRepository();
const authStore = useAuthStore();
const templates: Ref<AnalyzerTemplate[]> = ref([]);
const loading = ref(true);
const error = ref(false);

const selected = computed({
  get: () => props.selectedTemplate?.name ?? CUSTOM,
  set: (value: string) => {
    const template = templates.value.find((t) => t.name === value) ?? null;
    emit("update:selectedTemplate", template);
    if (template) emit("templateChanged", template);
  },
});

async function loadTemplates(): Promise<void> {
  if (!authStore.getToken) return;
  loading.value = true;
  error.value = false;
  try {
    const response = await templatesRepo.getTemplates({
      bearerToken: authStore.getToken,
    });
    templates.value = response.data;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

const languageNames: Record<string, string> = {
  javascript: "JavaScript",
  php: "PHP",
  python: "Python",
  java: "Java",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
};

function languageName(language: string): string {
  return (
    languageNames[language] ??
    language.charAt(0).toUpperCase() + language.slice(1)
  );
}

onMounted(() => void loadTemplates());
</script>

<template>
  <fieldset class="flex flex-col gap-3">
    <legend class="mb-3 text-sm font-medium leading-none">Template</legend>

    <div
      v-if="loading"
      role="status"
      aria-label="Loading templates"
      class="grid gap-3 md:grid-cols-2"
    >
      <Skeleton v-for="i in 2" :key="i" class="h-20 rounded-card" />
    </div>

    <Alert v-else-if="error" variant="destructive">
      <AlertDescription class="flex flex-wrap items-center gap-3">
        The analyzer templates could not be loaded.
        <Button variant="outline" size="sm" @click="loadTemplates">
          Retry
        </Button>
      </AlertDescription>
    </Alert>

    <RadioGroup v-else v-model="selected" class="grid gap-3 md:grid-cols-2">
      <label
        class="flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors hover:bg-muted has-data-[state=checked]:border-primary has-data-[state=checked]:bg-brand-subtle"
      >
        <RadioGroupItem :value="CUSTOM" class="mt-1" />
        <span class="flex flex-col gap-1">
          <span class="font-semibold text-foreground-strong">Custom</span>
          <span class="text-sm text-muted-foreground">
            Start from the SBOM and vulnerability plugins and build your own
            workflow.
          </span>
        </span>
      </label>
      <label
        v-for="template in templates"
        :key="template.name"
        class="flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors hover:bg-muted has-data-[state=checked]:border-primary has-data-[state=checked]:bg-brand-subtle"
      >
        <RadioGroupItem :value="template.name" class="mt-1" />
        <span class="flex min-w-0 flex-col gap-1">
          <span class="font-semibold text-foreground-strong">
            {{ template.name }}
          </span>
          <span class="line-clamp-2 text-sm text-muted-foreground">
            {{ template.description }}
          </span>
          <span class="flex flex-wrap gap-1">
            <Badge
              v-for="language in template.supported_languages"
              :key="language"
              variant="secondary"
            >
              {{ languageName(language) }}
            </Badge>
          </span>
        </span>
      </label>
    </RadioGroup>
  </fieldset>
</template>
