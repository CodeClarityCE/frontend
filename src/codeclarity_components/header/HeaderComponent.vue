<script setup lang="ts">
import { RouterLink } from "vue-router";

import MainNav from "./components/MainNav.vue";
import SearchHeader from "./components/SearchHeader.vue";
import TeamSwitcher from "./components/TeamSwitcher.vue";
import UserNav from "./components/UserNav.vue";
</script>

<template>
  <div class="hidden flex-col md:flex">
    <div
      class="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50"
    >
      <div class="flex h-16 items-center px-6 gap-4">
        <RouterLink
          :to="{ name: 'home' }"
          class="flex gap-2 items-center hover:opacity-80 transition-opacity duration-200"
        >
          <img src="@/assets/images/logos/logo.svg" class="h-8 self-center" />
        </RouterLink>

        <div class="flex items-center gap-1">
          <div class="h-6 w-px bg-gray-300 mx-2"></div>
          <TeamSwitcher />
        </div>

        <MainNav class="mx-8" />

        <div class="ml-auto flex items-center gap-4">
          <SearchHeader />
          <div class="h-6 w-px bg-gray-300"></div>
          <UserNav />
        </div>
      </div>
    </div>
  </div>
</template>
