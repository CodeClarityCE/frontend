<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import { type Project } from "@/codeclarity_components/projects/project.entity";

import PatchingContent from "./PatchingContent.vue";

const props = defineProps<{
  analysis: Analysis;
  project: Project;
  runIndex?: number | null;
}>();

// Compute which SBOM plugins were successfully executed
const executedSbomPlugins = computed(() => {
  const plugins: string[] = [];
  for (const step of props.analysis.steps) {
    for (const result of step) {
      if (result.Status === AnalysisStatus.SUCCESS) {
        if (result.Name === "js-sbom" || result.Name === "php-sbom") {
          plugins.push(result.Name);
        }
      }
    }
  }
  return plugins;
});

const details = ref(false);

onMounted(() => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "none";
  }
});
</script>

<template>
  <div v-show="!details" class="flex flex-col gap-14">
    <PatchingContent
      :analysis-i-d="analysis.id"
      :project-i-d="project.id"
      :executed-sbom-plugins="executedSbomPlugins"
    ></PatchingContent>
  </div>
</template>
