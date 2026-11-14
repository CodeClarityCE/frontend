<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import { useStateStore } from "@/stores/state";

const MainPage = defineAsyncComponent(
  (() =>
    import("@/codeclarity_components/projects/ProjectsView.vue")) as AsyncComponentLoader,
) as Component;
const CreateAnalysis = defineAsyncComponent(
  (() => import("./create/AnalysisCreate.vue")) as AsyncComponentLoader,
) as Component;

const state = useStateStore();
state.$reset();

state.page = "main";

const props = defineProps<{
  page?: string;
}>();
</script>

<template>
  <div v-if="props.page === 'add'" class="flex flex-col gap-8 p-8">
    <CreateAnalysis />
  </div>
  <MainPage v-else />
</template>
