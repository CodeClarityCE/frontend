<script setup lang="ts">
import { Menu } from "@lucide/vue";
import { RouterLink } from "vue-router";

import logo from "@/assets/images/logos/logo-green.svg";
import { useSidebar } from "@/shadcn/ui/sidebar";

const { openMobile, setOpenMobile } = useSidebar();
</script>

<template>
  <!-- Below the sidebar breakpoint the sidebar is a drawer opened from here. -->
  <header
    class="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4 md:hidden"
  >
    <button
      type="button"
      class="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-foreground outline-hidden hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Open navigation"
      :aria-expanded="openMobile"
      @click="setOpenMobile(true)"
    >
      <Menu class="size-5" aria-hidden="true" />
    </button>
    <RouterLink
      :to="{ name: 'home' }"
      aria-label="CodeClarity, go to the Dashboard"
      class="flex min-w-0 items-center gap-2 rounded-md px-1 text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img :src="logo" alt="" class="h-7 w-auto" />
      <span class="truncate text-lg font-bold">CodeClarity</span>
    </RouterLink>
  </header>
</template>
