<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import { useStateStore } from "@/stores/state";

const ExperimentsList = defineAsyncComponent(
  (() => import("./sections/ExperimentsList.vue")) as AsyncComponentLoader,
) as Component;
const ExperimentCreate = defineAsyncComponent(
  (() => import("./sections/ExperimentCreate.vue")) as AsyncComponentLoader,
) as Component;
const ExperimentDetail = defineAsyncComponent(
  (() => import("./sections/ExperimentDetail.vue")) as AsyncComponentLoader,
) as Component;

const state = useStateStore();
state.$reset();

state.page = "experiments";

const props = defineProps<{
  page?: string;
}>();
</script>
<template>
  <div class="flex flex-col gap-8 p-8">
    <ExperimentCreate v-if="props.page === 'add'" />
    <ExperimentDetail v-else-if="props.page === 'detail'" />
    <ExperimentsList v-else />
  </div>
</template>
