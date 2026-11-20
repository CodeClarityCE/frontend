<script setup lang="ts">
import { computed } from "vue";

import {
  TrendPeriod,
  type VulnerabilityTrend,
  type VulnerabilityTrendFilters,
} from "@/codeclarity_components/vulnerabilities/vulnerability_trend.entity";
import { NativeSelect, NativeSelectOption } from "@/shadcn/ui/native-select";

import type { FilteredDashboardRequest } from "../composables/useDashboardRequest";

// Narrows the project numbers and the trend, which share one request.
const props = defineProps<{
  trend: FilteredDashboardRequest<
    VulnerabilityTrend,
    VulnerabilityTrendFilters
  >;
  projects: { id: string; name: string }[];
}>();

const project = computed({
  get: () => props.trend.filters.project ?? "",
  set: (value: unknown) => {
    const { project: _, ...rest } = props.trend.filters;
    void props.trend.filter(
      typeof value === "string" && value !== ""
        ? { ...rest, project: value }
        : rest,
    );
  },
});
const period = computed({
  get: () => props.trend.filters.period,
  set: (value: unknown) =>
    void props.trend.filter({
      ...props.trend.filters,
      period: value as TrendPeriod,
    }),
});
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <NativeSelect v-model="project" aria-label="Project" class="h-8 text-sm">
      <NativeSelectOption value="">All projects</NativeSelectOption>
      <NativeSelectOption v-for="p in projects" :key="p.id" :value="p.id">
        {{ p.name }}
      </NativeSelectOption>
    </NativeSelect>
    <NativeSelect v-model="period" aria-label="Period" class="h-8 text-sm">
      <NativeSelectOption :value="TrendPeriod.Week">Weekly</NativeSelectOption>
      <NativeSelectOption :value="TrendPeriod.Month"
        >Monthly</NativeSelectOption
      >
    </NativeSelect>
  </div>
</template>
