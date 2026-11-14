<script setup lang="ts">
import { Skeleton } from "@/shadcn/ui/skeleton";
</script>

<template>
  <div
    role="status"
    aria-label="Loading the dependency"
    class="flex flex-col gap-8"
  >
    <div class="flex flex-col gap-3">
      <Skeleton class="h-9 w-1/3" />
      <Skeleton class="h-5 w-1/4" />
    </div>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Skeleton v-for="i in 5" :key="i" class="h-24 rounded-card" />
    </div>
    <div class="grid gap-6 lg:grid-cols-2">
      <Skeleton class="h-56 rounded-card" />
      <Skeleton class="h-56 rounded-card" />
    </div>
    <Skeleton class="h-96 rounded-card" />
  </div>
</template>
