<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import { useStateStore } from "@/stores/state";

const DatasetsList = defineAsyncComponent(
  (() => import("./sections/DatasetsList.vue")) as AsyncComponentLoader,
) as Component;
const DatasetCreate = defineAsyncComponent(
  (() => import("./sections/DatasetCreate.vue")) as AsyncComponentLoader,
) as Component;
const DatasetDetail = defineAsyncComponent(
  (() => import("./sections/DatasetDetail.vue")) as AsyncComponentLoader,
) as Component;

const state = useStateStore();
state.$reset();

state.page = "datasets";

const props = defineProps<{
  page?: string;
}>();
</script>
<template>
  <div class="flex flex-col gap-8 p-8">
    <DatasetCreate v-if="props.page === 'add'" />
    <DatasetDetail v-else-if="props.page === 'detail'" />
    <DatasetsList v-else />
  </div>
</template>
