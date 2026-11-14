<script setup lang="ts">
import { computed, type Ref, ref, watch } from "vue";

import ColumnChart from "@/base_components/charts/ColumnChart.vue";
import { DashboardRepository } from "@/codeclarity_components/dashboard/dashboard.repository";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";

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

/** [license, dependencies], most used first */
const licenses: Ref<[string, number][]> = ref([]);
const error = ref(false);
const loading = ref(true);

async function fetch(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !authStore.getAuthenticated || !authStore.getToken) return;

  loading.value = true;
  error.value = false;

  try {
    const resp = await dashboardRepository.getLicenseDist({
      orgId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      integrationIds: props.integrationIds,
    });
    licenses.value = Object.entries(resp.data)
      .map(([name, count]): [string, number] => [name, count ?? 0])
      .sort((a, b) => b[1] - a[1]);
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}
void fetch();

const total = computed(() =>
  licenses.value.reduce((sum, [, count]) => sum + count, 0),
);
const values = computed(() => licenses.value.map(([, count]) => count));
const series = computed(() => [
  {
    key: "dependencies",
    label: "Dependencies",
    values: values.value,
    color: "var(--viz-series-1)",
  },
]);

function describe(index: number): string {
  const [name, count] = licenses.value[index] ?? ["", 0];
  const share = total.value === 0 ? 0 : Math.round((count / total.value) * 100);
  return `${name}: ${count} ${count === 1 ? "dependency" : "dependencies"} (${share}%)`;
}
</script>

<template>
  <CardState
    label="licenses"
    :loading="loading"
    :error="error"
    :empty="licenses.length === 0"
    @retry="() => void fetch()"
  >
    <ColumnChart
      :labels="licenses.map(([name]) => name)"
      :series="series"
      :y-max="Math.max(...values, 1)"
      :format-y="(value) => String(value)"
      :describe="describe"
      caption="Dependencies by license"
      x-title="License"
      integer
    />
  </CardState>
</template>
