<script setup lang="ts">
import { Skeleton } from "@/shadcn/ui/skeleton";
</script>

<template>
  <div
    role="status"
    aria-label="Loading the vulnerability"
    class="flex flex-col gap-8"
  >
    <div class="flex flex-col gap-3">
      <Skeleton class="h-9 w-1/3" />
      <Skeleton class="h-5 w-1/2" />
    </div>
    <div class="grid gap-4 sm:grid-cols-3">
      <Skeleton v-for="i in 3" :key="i" class="h-24 rounded-card" />
    </div>
    <Skeleton class="h-32 rounded-card" />
    <div class="grid gap-6 lg:grid-cols-2">
      <Skeleton class="h-80 rounded-card" />
      <Skeleton class="h-80 rounded-card" />
    </div>
  </div>
</template>
