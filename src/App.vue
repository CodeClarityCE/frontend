<script setup lang="ts">
import { type Component, defineAsyncComponent } from "vue";
import { RouterView, useRoute } from "vue-router";

import { usesLoggedOutLayout, viewKey } from "@/router";
import { Toaster } from "@/shadcn/ui/sonner";
import { useAuthStore } from "@/stores/auth";
import { useTheme } from "@/utils/theme";

import "vue-sonner/style.css";

// Loaded on demand so its entity decorators run after main.ts sets up reflect-metadata.
const AppShell = defineAsyncComponent(
  () => import("@/codeclarity_components/shell/AppShell.vue"),
) as Component;

const authStore = useAuthStore();
const route = useRoute();
const { applied } = useTheme();
</script>

<template>
  <AppShell v-if="authStore.getAuthenticated && !usesLoggedOutLayout(route)">
    <RouterView :key="viewKey(route)" />
  </AppShell>
  <RouterView v-else :key="viewKey(route)" />
  <!-- Sonner styles its icons and buttons per theme, so it gets the applied one. -->
  <Toaster :theme="applied" />
</template>
