<script setup lang="ts">
export interface LegendItem {
  label: string;
  color: string;
  count: number;
}

defineProps<{
  items: LegendItem[];
}>();
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      v-for="item in items"
      :key="item.label"
      class="flex items-center gap-2"
    >
      <div
        class="w-3 h-3 rounded-full flex-shrink-0"
        :style="{ backgroundColor: item.color }"
      ></div>
      <span class="text-sm">{{ item.label }}</span>
      <span
        class="ml-auto text-sm font-semibold"
        :style="{ color: item.color }"
      >
        {{ item.count }}
      </span>
    </div>
  </div>
</template>
