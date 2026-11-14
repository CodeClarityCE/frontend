<script setup lang="ts">
import { computed, type Ref, ref, watch } from "vue";

import GridLineChart from "@/base_components/charts/GridLineChart.vue";
import { SeverityBadge } from "@/base_components/page";
import { type SeverityInfoByWeek } from "@/codeclarity_components/dashboard/dashboard.entity";
import { DashboardRepository } from "@/codeclarity_components/dashboard/dashboard.repository";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { formatDateRange, getWeekRange } from "@/utils/dateUtils";
import type { SeverityLevel } from "@/utils/severity";

import CardState from "../layout/CardState.vue";

const props = defineProps<{
  integrationIds: string[];
}>();

watch(
  () => props.integrationIds,
  () => void fetch(),
);

const dashboardRepository = new DashboardRepository();
const authStore = useAuthStore();
const userStore = useUserStore();

const data: Ref<SeverityInfoByWeek[]> = ref([]);
const error = ref(false);
const loading = ref(true);

async function fetch(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getAuthenticated || !authStore.getToken) return;

  loading.value = true;
  error.value = false;

  try {
    const resp = await dashboardRepository.getWeeklySeverityInfo({
      orgId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      integrationIds: props.integrationIds,
    });
    data.value = resp.data;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}
void fetch();

function weekLabel(week: SeverityInfoByWeek): string {
  const { start, end } = getWeekRange(
    week.week_number.week,
    week.week_number.year,
  );
  if (start.getFullYear() !== end.getFullYear()) {
    return formatDateRange(start, end, "MMM DD, YY");
  }
  return `${formatDateRange(start, end, "MMM DD")}, ${end.getFullYear()}`;
}

const labels = computed(() => data.value.map(weekLabel));
const summed = computed(() =>
  data.value.map((week) => Math.round(week.summed_severity)),
);
const series = computed(() => [
  {
    key: "summed",
    label: "Summed severity",
    values: summed.value,
    color: "var(--viz-series-1)",
  },
]);

function describe(index: number): string {
  return `${labels.value[index]}: summed severity ${summed.value[index]}`;
}

/** Each week's counts by severity, newest week first. */
const weeks = computed(() =>
  data.value
    .map((week, index) => ({
      label: labels.value[index]!,
      counts: (
        [
          ["critical", week.nmb_critical],
          ["high", week.nmb_high],
          ["medium", week.nmb_medium],
          ["low", week.nmb_low],
          ["none", week.nmb_none],
        ] as [SeverityLevel, number][]
      ).filter(([, count]) => count > 0),
    }))
    .reverse(),
);
</script>

<template>
  <CardState
    label="vulnerability exposure"
    :loading="loading"
    :error="error"
    :empty="data.length === 0"
    @retry="() => void fetch()"
  >
    <div class="grid gap-6 xl:grid-cols-[1fr_auto]">
      <GridLineChart
        :labels="labels"
        :series="series"
        :y-max="Math.max(...summed, 1)"
        :format-y="(value) => String(Math.round(value))"
        :describe="describe"
        caption="Summed severity of vulnerabilities by week"
        x-title="Week"
      />
      <div class="flex flex-col gap-2">
        <h4
          id="dashboard-weekly-exposure"
          class="text-sm font-semibold text-foreground-strong"
        >
          Weekly exposure
        </h4>
        <ul
          aria-labelledby="dashboard-weekly-exposure"
          class="flex flex-col gap-2 text-sm"
        >
          <li
            v-for="week in weeks"
            :key="week.label"
            class="flex flex-col gap-1"
          >
            <span class="text-muted-foreground">{{ week.label }}</span>
            <span v-if="week.counts.length === 0">No vulnerabilities</span>
            <span v-else class="flex flex-wrap items-center gap-2">
              <span
                v-for="[level, count] in week.counts"
                :key="level"
                class="inline-flex items-center gap-1 tabular-nums"
              >
                {{ count }} <SeverityBadge :level="level" />
              </span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </CardState>
</template>
