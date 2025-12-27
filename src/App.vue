<script setup lang="ts">
import "vue-sonner/style.css";
import {
  defineAsyncComponent,
  type AsyncComponentLoader,
  type Component,
} from "vue";
import { RouterView, useRoute } from "vue-router";
import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";
import { Toaster } from "@/shadcn/ui/sonner";
import { useAuthStore } from "@/stores/auth";

const HeaderComponent = defineAsyncComponent({
  loader: (() =>
    import("@/codeclarity_components/header/HeaderComponent.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const authStore = useAuthStore();
const route = useRoute();
</script>

<template>
  <HeaderComponent v-if="authStore.getAuthenticated"></HeaderComponent>
  <div>
    <RouterView :key="route.fullPath" />
  </div>
  <Toaster />
</template>
