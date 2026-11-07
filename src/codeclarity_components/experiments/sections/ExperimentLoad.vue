<script setup lang="ts">
import LoadOverTimeChart from "../charts/LoadOverTimeChart.vue";
import type { LoadRow } from "../experiment.entity";

defineProps<{ rows: LoadRow[] }>();
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
        advisories published after the grid date (HEAD uses the experiment's
        end date). Where the lines meet, the two views agree. Instances whose
        advisory has no readable publication date stay in both and are counted
        as undated.
      </p>
    </div>
    <LoadOverTimeChart
      :rows="rows"
      caption="Vulnerability instances per grid date, hindsight and as-of views"
    />
  </div>
</template>
