<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import { useStateStore } from "@/stores/state";

const ProjectsList = defineAsyncComponent(
  (() => import("./list/ProjectsList.vue")) as AsyncComponentLoader,
) as Component;
const CreateProject = defineAsyncComponent(
  (() => import("./create/CreateProject.vue")) as AsyncComponentLoader,
) as Component;

const state = useStateStore();
state.$reset();

state.page = "projects";

const props = defineProps<{
  page?: string;
}>();
</script>
<template>
  <div class="flex flex-col gap-8 p-8">
    <CreateProject v-if="props.page === 'add'" />
    <ProjectsList v-else />
  </div>
</template>
