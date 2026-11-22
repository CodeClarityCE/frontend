<script lang="ts" setup>
import { computed, ref } from "vue";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import { type Project } from "@/codeclarity_components/projects/project.entity";

import KnowledgeStatusNotice from "./components/KnowledgeStatusNotice.vue";
import MaliciousPackageAdvisories from "./components/MaliciousPackageAdvisories.vue";
import SourceVerdictExportMenu from "./components/SourceVerdictExportMenu.vue";
import VulnContent from "./VulnContent.vue";
import VulnFindings from "./VulnFindings.vue";

const props = defineProps<{
  analysis: Analysis;
  project: Project;
  runIndex?: number | null;
}>();

// The SBOM plugins that ran, which decide the language filter.
const executedSbomPlugins = computed(() =>
  props.analysis.steps
    .flat()
    .filter(
      (result) =>
        result.Status === AnalysisStatus.SUCCESS &&
        (result.Name === "js-sbom" || result.Name === "php-sbom"),
    )
    .map((result) => result.Name),
);

const selectedWorkspace = ref(".");
const ecosystemFilter = ref<string | null>(null);
const showBlacklisted = ref(false);
</script>

<template>
  <div class="flex w-full flex-col gap-8">
    <KnowledgeStatusNotice
      :analysis-i-d="analysis.id"
      :project-i-d="project.id"
    />

    <MaliciousPackageAdvisories
      :analysis-i-d="analysis.id"
      :project-i-d="project.id"
      :workspace="selectedWorkspace"
    />

    <VulnContent
      v-model:selected_workspace="selectedWorkspace"
      :analysis-i-d="analysis.id"
      :project-i-d="project.id"
      :executed-sbom-plugins="executedSbomPlugins"
      :show-blacklisted="showBlacklisted"
      @ecosystem-filter-changed="ecosystemFilter = $event"
    />

    <section
      aria-labelledby="vuln-findings-heading"
      class="flex flex-col gap-4"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="vuln-findings-heading"
            class="text-xl font-semibold tracking-tight text-foreground-strong"
          >
            Vulnerabilities
          </h2>
          <p class="text-sm text-muted-foreground">
            Security vulnerabilities found in your project dependencies
          </p>
        </div>
        <SourceVerdictExportMenu
          :analysis-i-d="analysis.id"
          :project-i-d="project.id"
        />
      </div>
      <VulnFindings
        :analysis-i-d="analysis.id"
        :project-i-d="project.id"
        :workspace="selectedWorkspace"
        :ecosystem-filter="ecosystemFilter"
        @show-blacklisted-changed="showBlacklisted = $event"
      />
    </section>
  </div>
</template>
