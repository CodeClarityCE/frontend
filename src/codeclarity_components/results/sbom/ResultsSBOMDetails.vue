<script lang="ts" setup>
import { useRoute } from "vue-router";

import Details from "./SbomDetails.vue";

const props = defineProps<{
  runIndex?: number | null;
}>();

// The analysis and project come from the query string, as on the results page.
const route = useRoute();
const analysisID = String(route.query.analysis_id ?? "");
const projectID = String(route.query.project_id ?? "");
</script>

<template>
  <Details
    show-back
    :analysis-i-d="analysisID"
    :project-i-d="projectID"
    :run-index="props.runIndex"
  />
</template>
