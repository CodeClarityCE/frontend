<script setup lang="ts">
import { type Component, defineAsyncComponent } from "vue";
import { RouterView, useRoute } from "vue-router";

import { usesLoggedOutLayout } from "@/router";
import { Toaster } from "@/shadcn/ui/sonner";
import { useAuthStore } from "@/stores/auth";

import "vue-sonner/style.css";

// Loaded on demand so its entity decorators run after main.ts sets up reflect-metadata.
const AppShell = defineAsyncComponent(
  () => import("@/codeclarity_components/shell/AppShell.vue"),
) as Component;

const authStore = useAuthStore();
const route = useRoute();
</script>

<template>
  <AppShell v-if="authStore.getAuthenticated && !usesLoggedOutLayout(route)">
    <RouterView :key="route.fullPath" />
  </AppShell>
  <RouterView v-else :key="route.fullPath" />
  <Toaster />
</template>
