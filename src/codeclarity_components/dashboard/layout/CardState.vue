<script setup lang="ts">
import { Button } from "@/shadcn/ui/button";
import { Skeleton } from "@/shadcn/ui/skeleton";

// Loading, failed and empty states of a Dashboard card; the slot is its content.
defineProps<{
  /** What the card shows, for the loading status */
  label: string;
  loading: boolean;
  error: boolean;
  empty: boolean;
  emptyText?: string;
}>();

defineEmits<{ retry: [] }>();
</script>

<template>
  <div
    v-if="loading"
    role="status"
    :aria-label="`Loading ${label}`"
    class="flex flex-col gap-3"
  >
    <Skeleton class="h-6 w-1/2 rounded-control" />
    <Skeleton class="h-40 w-full rounded-control" />
  </div>
  <div
    v-else-if="error"
    role="alert"
    class="flex flex-wrap items-center justify-between gap-3 text-sm"
  >
    <span>The {{ label }} could not be loaded.</span>
    <Button variant="outline" size="sm" @click="$emit('retry')">
      Try again
    </Button>
  </div>
  <p v-else-if="empty" class="text-sm text-muted-foreground">
    {{ emptyText ?? "No data yet." }}
  </p>
  <slot v-else />
</template>
