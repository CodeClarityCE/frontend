<script setup lang="ts">
import { ref } from "vue";

import { SidebarInset, SidebarProvider } from "@/shadcn/ui/sidebar";

import AppSidebar from "./AppSidebar.vue";
import CommandPalette from "./CommandPalette.vue";

const paletteOpen = ref(false);
</script>

<template>
  <SidebarProvider>
    <a
      href="#main-content"
      class="sr-only z-50 rounded-control bg-background px-3 py-2 text-sm font-medium text-foreground focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:ring-2 focus:ring-ring"
      >Skip to content</a
    >
    <AppSidebar @open-palette="paletteOpen = true" />
    <SidebarInset id="main-content" tabindex="-1" class="min-w-0 outline-none">
      <slot />
    </SidebarInset>
    <CommandPalette v-model:open="paletteOpen" />
  </SidebarProvider>
</template>
