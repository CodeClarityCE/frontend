<script setup lang="ts">
import { Plus } from "@lucide/vue";
import { RouterLink } from "vue-router";

import {
  FrozenBadge,
  OwlEmptyState,
  StatusBadge,
} from "@/base_components/page";
import {
  type Experiment,
  ExperimentRunStatus,
  ExperimentRunStatusLabels,
  ExperimentRunStatusTones,
  finishedRunCount,
  formatExperimentDate,
} from "@/codeclarity_components/experiments/experiment.entity";
import ExperimentStatusBadge from "@/codeclarity_components/experiments/ExperimentStatusBadge.vue";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { Progress } from "@/shadcn/ui/progress";
import { Skeleton } from "@/shadcn/ui/skeleton";

import { useResearchOverview } from "../composables/useResearchOverview";

const RUN_STATES = [
  ExperimentRunStatus.DONE,
  ExperimentRunStatus.FAILED,
  ExperimentRunStatus.SKIPPED,
] as const;

const {
  loaded,
  hasError,
  hasDatasets,
  inProgress,
  recentlyFinished,
  recentPublished,
  reload,
} = useResearchOverview();

function detailLink(experiment: Experiment): object {
  return {
    name: "experiments",
    params: { page: "detail" },
    query: { id: experiment.id },
  };
}

function progressPercent(experiment: Experiment): number {
  if (experiment.run_count === 0) return 0;
  return Math.round(
    (finishedRunCount(experiment.run_counts) / experiment.run_count) * 100,
  );
}

const linkClass =
  "rounded-sm font-semibold text-foreground-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
</script>

<template>
  <section
    aria-labelledby="dashboard-research-heading"
    class="flex flex-col gap-4"
  >
    <div class="flex items-center justify-between gap-4">
      <h2
        id="dashboard-research-heading"
        class="text-xl font-bold tracking-tight text-foreground-strong"
      >
        Research
      </h2>
      <Button
        v-if="loaded && !hasError && hasDatasets"
        :as="RouterLink"
        :to="{ name: 'experiments', params: { page: 'add' } }"
        variant="outline"
        size="sm"
      >
        <Plus aria-hidden="true" />
        New Experiment
      </Button>
    </div>

    <div
      v-if="!loaded"
      role="status"
      aria-label="Loading Research"
      class="grid gap-6 lg:grid-cols-2"
    >
      <Skeleton class="h-40 rounded-card lg:col-span-2" />
      <Skeleton class="h-56 rounded-card" />
      <Skeleton class="h-56 rounded-card" />
    </div>

    <Alert v-else-if="hasError" variant="destructive">
      <AlertDescription class="flex items-center justify-between gap-4">
        The Research overview could not be loaded.
        <Button variant="outline" size="sm" @click="() => void reload()">
          Try again
        </Button>
      </AlertDescription>
    </Alert>

    <OwlEmptyState
      v-else-if="!hasDatasets"
      title="No Datasets yet"
      description="Research starts with a Dataset: a cohort of GitHub repositories ranked by stars. Build one, then run Experiments on it."
    >
      <Button
        :as="RouterLink"
        :to="{ name: 'datasets', params: { page: 'add' } }"
        arrow
      >
        Create a Dataset
      </Button>
    </OwlEmptyState>

    <div v-else class="grid gap-6 lg:grid-cols-2">
      <Card class="rounded-card shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle id="dashboard-in-progress" class="text-base">
            Experiments in progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            v-if="inProgress.length === 0"
            class="text-sm text-muted-foreground"
          >
            No Experiments are running.
          </p>
          <ul
            v-else
            aria-labelledby="dashboard-in-progress"
            class="flex flex-col divide-y"
          >
            <li
              v-for="experiment in inProgress"
              :key="experiment.id"
              class="flex flex-col gap-3 py-4 first:pt-0 last:pb-0"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex min-w-0 flex-col">
                  <RouterLink :to="detailLink(experiment)" :class="linkClass">
                    {{ experiment.name }}
                  </RouterLink>
                  <span class="text-xs text-muted-foreground">
                    {{ experiment.dataset_name }}
                  </span>
                </div>
                <ExperimentStatusBadge :status="experiment.status" />
              </div>
              <div class="flex flex-col gap-2">
                <div class="flex items-baseline justify-between text-sm">
                  <span :id="`progress-${experiment.id}`">Finished runs</span>
                  <span class="tabular-nums text-foreground">
                    {{ finishedRunCount(experiment.run_counts) }} /
                    {{ experiment.run_count }}
                  </span>
                </div>
                <Progress
                  :model-value="progressPercent(experiment)"
                  :aria-labelledby="`progress-${experiment.id}`"
                />
                <ul
                  aria-label="Runs by state"
                  class="flex flex-wrap gap-x-6 gap-y-2"
                >
                  <li
                    v-for="state in RUN_STATES"
                    :key="state"
                    class="flex items-center gap-2 text-sm"
                  >
                    <StatusBadge
                      :tone="ExperimentRunStatusTones[state]"
                      :label="ExperimentRunStatusLabels[state]"
                    />
                    <span
                      class="font-semibold tabular-nums text-foreground-strong"
                    >
                      {{ experiment.run_counts[state] }}
                    </span>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card class="rounded-card shadow-card">
        <CardHeader>
          <CardTitle id="dashboard-recently-finished" class="text-base">
            Recently finished
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            v-if="recentlyFinished.length === 0"
            class="text-sm text-muted-foreground"
          >
            No Experiments have finished yet.
          </p>
          <ul
            v-else
            aria-labelledby="dashboard-recently-finished"
            class="flex flex-col divide-y"
          >
            <li
              v-for="experiment in recentlyFinished"
              :key="experiment.id"
              class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div class="flex min-w-0 flex-col">
                <RouterLink :to="detailLink(experiment)" :class="linkClass">
                  {{ experiment.name }}
                </RouterLink>
                <span class="text-xs text-muted-foreground">
                  Ended
                  {{
                    formatExperimentDate(
                      experiment.ended_on ?? experiment.created_on,
                      false,
                    )
                  }}
                </span>
              </div>
              <ExperimentStatusBadge :status="experiment.status" />
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card class="rounded-card shadow-card">
        <CardHeader>
          <CardTitle id="dashboard-recent-published" class="text-base">
            Recent Published results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            v-if="recentPublished.length === 0"
            class="text-sm text-muted-foreground"
          >
            Nothing is published yet. Publish an Experiment's results to freeze
            them for citation.
          </p>
          <ul
            v-else
            aria-labelledby="dashboard-recent-published"
            class="flex flex-col divide-y"
          >
            <li
              v-for="item in recentPublished"
              :key="`${item.experiment.id}-${item.version.metric_version}`"
              class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div class="flex min-w-0 flex-col">
                <RouterLink
                  :to="detailLink(item.experiment)"
                  :class="linkClass"
                >
                  {{ item.experiment.name }}
                </RouterLink>
                <span class="text-xs text-muted-foreground">
                  Metric version {{ item.version.metric_version }}, published
                  {{ formatExperimentDate(item.version.published_on, false)
                  }}<template v-if="item.version.published_by_name">
                    by {{ item.version.published_by_name }}</template
                  >
                </span>
              </div>
              <FrozenBadge />
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
