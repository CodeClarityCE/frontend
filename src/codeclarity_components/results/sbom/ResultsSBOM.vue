<script lang="ts" setup>
import { computed } from "vue";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import { type Project } from "@/codeclarity_components/projects/project.entity";

import SbomContent from "./SbomContent.vue";

const props = defineProps<{
  analysis: Analysis;
  project: Project;
  runIndex?: number | null;
}>();

// The SBOM plugins that finished successfully.
const executedSbomPlugins = computed(() =>
  props.analysis.steps.flatMap((step) =>
    step
      .filter(
        (result) =>
          result.Status === AnalysisStatus.SUCCESS &&
          (result.Name === "js-sbom" || result.Name === "php-sbom"),
      )
      .map((result) => result.Name),
  ),
);
</script>

<template>
  <SbomContent
    :analysis-i-d="analysis.id"
    :project-i-d="project.id"
    :project-name="project.name"
    :executed-sbom-plugins="executedSbomPlugins"
  />
</template>
