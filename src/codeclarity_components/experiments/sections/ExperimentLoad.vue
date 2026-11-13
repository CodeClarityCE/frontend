<script setup lang="ts">
import { computed } from "vue";

import type { ChartCaption } from "@/base_components/charts/chart-caption";
import ChartExport from "@/base_components/charts/ChartExport.vue";

import { AS_OF_APPROXIMATION, excluded } from "../charts/experiment-caption";
import LoadOverTimeChart from "../charts/LoadOverTimeChart.vue";
import OpenAsFigure from "../charts/OpenAsFigure.vue";
import type { LoadRow } from "../experiment.entity";

const props = defineProps<{ rows: LoadRow[] }>();

const TITLE =
  "Vulnerability instances per grid date, hindsight and as-of views";

const plotted = computed(() => ({
  columns: [
    "grid_date",
    "as_of_date",
    "projects",
    "hindsight",
    "as_of",
    "undated",
  ],
  rows: props.rows.map((r) => [
    r.grid_date ?? "HEAD",
    r.as_of_date,
    r.projects,
    r.hindsight,
    r.as_of,
    r.undated,
  ]),
}));

const figureCaption = computed<ChartCaption>(() => {
  const counts = props.rows
    .filter((r) => r.hindsight !== null)
    .map((r) => r.projects);
  const low = Math.min(...counts, Infinity);
  const high = Math.max(...counts, 0);
  const range =
    low === high || counts.length === 0 ? `${high}` : `${low} to ${high}`;
  return {
    description: TITLE,
    n: `n = ${range} projects with a done snapshot per grid date`,
    exclusions: excluded(
      props.rows.length - counts.length,
      "grid date",
      "grid dates",
      "without a done snapshot",
    ),
    notes: [AS_OF_APPROXIMATION],
  };
});
</script>

<template>
  <div
    class="bg-white rounded-xl border border-gray-200 p-4 space-y-2"
    data-testid="experiment-load"
  >
    <div>
      <h3 class="font-semibold text-gray-900">Load over time</h3>
      <p class="text-sm text-gray-500">
        Vulnerability instances per grid date, summed over the projects with a
        done snapshot. Hindsight counts every advisory known today; as-of drops
        advisories published after the grid date (HEAD uses the experiment's end
        date). Where the lines meet, the two views agree. Instances whose
        advisory has no readable publication date stay in both and are counted
        as undated.
      </p>
    </div>
    <OpenAsFigure
      :definition="{
        metric: 'load_over_time',
        chart_form: 'line',
        group_by: null,
        filters: {},
      }"
    />
    <ChartExport name="load-over-time" :data="plotted" :caption="figureCaption">
      <LoadOverTimeChart :rows="rows" :caption="TITLE" />
    </ChartExport>
  </div>
</template>
