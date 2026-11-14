<script setup lang="ts">
import { computed } from "vue";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/shadcn/ui/pagination";

const props = defineProps<{
  pageIndex: number;
  pageSize: number;
  total: number;
}>();

const emit = defineEmits<{ "update:pageIndex": [pageIndex: number] }>();

const first = computed(() => props.pageIndex * props.pageSize + 1);
const last = computed(() =>
  Math.min(props.total, (props.pageIndex + 1) * props.pageSize),
);
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <p class="text-sm text-muted-foreground">
      Showing {{ first }} to {{ last }} of {{ total }}
    </p>
    <Pagination
      :page="pageIndex + 1"
      :total="total"
      :items-per-page="pageSize"
      :sibling-count="1"
      show-edges
      aria-label="Pagination"
      class="mx-0 w-auto"
      @update:page="emit('update:pageIndex', $event - 1)"
    >
      <PaginationContent v-slot="{ items }">
        <PaginationPrevious />
        <template v-for="(item, index) in items" :key="index">
          <PaginationItem
            v-if="item.type === 'page'"
            :value="item.value"
            :is-active="item.value === pageIndex + 1"
          >
            {{ item.value }}
          </PaginationItem>
          <PaginationEllipsis v-else :index="index" />
        </template>
        <PaginationNext />
      </PaginationContent>
    </Pagination>
  </div>
</template>
