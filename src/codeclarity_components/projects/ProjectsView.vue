<script lang="ts" setup>
import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";
import { useStateStore } from "@/stores/state";
import {
  defineAsyncComponent,
  type AsyncComponentLoader,
  type Component,
} from "vue";

const ProjectsList = defineAsyncComponent({
  loader: (() => import("./list/ProjectsList.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const CreateProject = defineAsyncComponent({
  loader: (() => import("./create/CreateProject.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const state = useStateStore();
state.$reset();

state.page = "projects";

const props = defineProps<{
  page?: string;
}>();
</script>
<template>
  <main class="p-8 space-y-6">
    <CreateProject v-if="props.page === 'add'" />
    <ProjectsList v-else />
  </main>
</template>
