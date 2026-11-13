<script setup lang="ts">
import BrandHeader from "@/codeclarity_components/authentication/layout/BrandHeader.vue";
import { useAuthStore } from "@/stores/auth";

// Frame for pages open to everyone; signed-in users already have the app shell.
const authStore = useAuthStore();
</script>

<template>
  <div
    v-if="!authStore.getAuthenticated"
    class="flex min-h-svh flex-col bg-background text-foreground"
  >
    <BrandHeader />
    <main class="flex-1 px-8 py-12">
      <slot />
    </main>
  </div>
  <main v-else class="px-8 py-12 text-foreground">
    <slot />
  </main>
</template>
