<script setup lang="ts">
import { computed, provide } from "vue";

import StatCard from "@/base_components/ui/cards/StatCard.vue";

import { gridCoverageOf, SNAPSHOT_COVERAGE } from "../charts/chart-caption";
import {
  formatBracketInterval,
  formatInterval,
  formatPValue,
  formatShare,
  formatShareWithInterval,
} from "../charts/chart-format";
import OpenAsFigure from "../charts/OpenAsFigure.vue";
import {
  type BootstrapInterval,
  type ExperimentResults,
  formatExperimentDate,
  SEVERITY_ORDER,
  SweepSubsetLabels,
} from "../experiment.entity";

import ExperimentFixLag from "./ExperimentFixLag.vue";
import ExperimentLoad from "./ExperimentLoad.vue";
import ExperimentProbes from "./ExperimentProbes.vue";
import ExperimentResidence from "./ExperimentResidence.vue";
import ExperimentSurvival from "./ExperimentSurvival.vue";
import ExperimentUpstreamLeverage from "./ExperimentUpstreamLeverage.vue";

const props = defineProps<{ results: ExperimentResults }>();

function count(value: number | null): string {
  return value === null ? "-" : value.toLocaleString("en-US");
}

function decimal(value: number | null, digits = 3): string {
  return value === null ? "-" : value.toFixed(digits);
}

/** Counts most frequent first, with their share of the total */
function tally(
  counts: Record<string, number>,
): { key: string; count: number; share: number | null }[] {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, n]) => ({
      key,
      count: n,
      share: total === 0 ? null : n / total,
    }));
}

const headline = computed(() => props.results.headline);
const bootstrap = computed(() => props.results.bootstrap_intervals ?? null);

/** Interval text for a stat card, empty without one. */
function cardInterval(
  interval: BootstrapInterval | null | undefined,
  format: (value: number) => string,
): string {
  return interval ? `95% CI ${formatBracketInterval(interval, format)}` : "";
}

const fixedThree = (value: number): string => value.toFixed(3);
const fixedFour = (value: number): string => value.toFixed(4);
const whole = (value: number): string => value.toLocaleString("en-US");

function withInterval(subtitle: string, interval: string): string {
  return interval ? `${subtitle}; ${interval}` : subtitle;
}
const coverage = computed(() => props.results.coverage);
const provenance = computed(() => props.results.provenance);

/** Shown only for a grid: a HEAD-only experiment has just the HEAD row. */
const gridCoverage = computed(() =>
  gridCoverageOf(props.results.grid_coverage ?? []),
);
provide(SNAPSHOT_COVERAGE, gridCoverage);
const anyMixedKnowledge = computed(() =>
  gridCoverage.value.some((row) => row.mixed_knowledge),
);

/** Over-time blocks need a grid and an API that computes them. */
const fixLag = computed(() =>
  gridCoverage.value.length > 0 ? (props.results.fix_lag ?? null) : null,
);
const survival = computed(() =>
  gridCoverage.value.length > 0
    ? (props.results.exposure_survival ?? null)
    : null,
);

const loadOverTime = computed(() =>
  gridCoverage.value.length > 0 ? (props.results.load_over_time ?? null) : null,
);

const upstreamLeverage = computed(() =>
  gridCoverage.value.length > 0
    ? (props.results.upstream_leverage ?? null)
    : null,
);

const probes = computed(() =>
  gridCoverage.value.length > 0 ? (props.results.probes ?? null) : null,
);

const residence = computed(() =>
  gridCoverage.value.length > 0 ? (props.results.residence ?? null) : null,
);

const headlineIntervals = computed(
  () => props.results.share_intervals?.headline ?? null,
);

const highCriticalSubtitle = computed(() => {
  const interval = headlineIntervals.value?.high_critical_share;
  const ofClassed = formatShareWithInterval(
    headline.value.high_critical_share_of_classed,
    headlineIntervals.value?.high_critical_share_of_classed,
  );
  return interval
    ? `95% CI ${formatInterval(interval)}; of classed: ${ofClassed}`
    : `of classed: ${ofClassed}`;
});

/** The sweep rows with their intervals, none when the API sent none. */
const sweepRows = computed(() =>
  props.results.sweep.map((row) => ({
    row,
    intervals:
      props.results.share_intervals?.sweep.find(
        (entry) => entry.subset === row.subset,
      ) ?? null,
  })),
);

const severityRows = computed(() => {
  const counts = headline.value.sev_counts;
  const total = SEVERITY_ORDER.reduce((sum, sev) => sum + counts[sev], 0);
  return SEVERITY_ORDER.map((severity) => ({
    severity,
    count: counts[severity],
    share: total === 0 ? null : counts[severity] / total,
    interval: props.results.share_intervals?.severity[severity] ?? null,
  }));
});

const failureReasons = computed(() => tally(coverage.value.failure_reasons));
const skipReasons = computed(() => tally(coverage.value.skip_reasons));
const matchFlags = computed(() => tally(props.results.match_flags));
const winningSources = computed(() => tally(props.results.winning_source_head));

const analyzerSteps = computed(() =>
  (provenance.value.analyzer_steps ?? [])
    .map((stage) =>
      stage.map((step) => `${step.name} ${step.version}`).join(", "),
    )
    .filter((stage) => stage.length > 0),
);
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="provenance.knowledge_changed"
      class="bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-yellow-900"
      data-testid="experiment-knowledge-changed"
    >
      <strong>Knowledge changed during the experiment.</strong> The
      vulnerability sources were updated between its start and end, so runs
      analysed early and late were matched against different data.
    </div>

    <div
      v-if="gridCoverage.length > 0"
      class="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto"
    >
      <h3 class="font-semibold text-gray-900 mb-2">Coverage per grid date</h3>
      <p class="text-sm text-gray-500 mb-2">
        Empty runs are done but had no lockfile yet at that date.
      </p>
      <p
        v-if="anyMixedKnowledge"
        class="text-sm text-yellow-800 mb-2"
        data-testid="grid-mixed-knowledge-note"
      >
        Dates marked mixed knowledge had runs matched against different
        vulnerability data: the knowledge was updated while they ran.
      </p>
      <table class="w-full text-sm" data-testid="experiment-grid-coverage">
        <thead class="text-left text-gray-500">
          <tr>
            <th class="font-medium">Grid date</th>
            <th class="font-medium text-right">Done</th>
            <th class="font-medium text-right">Empty</th>
            <th class="font-medium text-right">Failed</th>
            <th class="font-medium text-right">Skipped</th>
            <th class="font-medium text-right">Pending</th>
          </tr>
        </thead>
        <tbody class="text-gray-700">
          <tr
            v-for="row in gridCoverage"
            :key="row.grid_date ?? 'HEAD'"
            data-testid="grid-coverage-row"
          >
            <td class="font-mono">
              {{ row.grid_date ?? "HEAD" }}
              <span
                v-if="row.mixed_knowledge"
                class="ml-2 font-sans text-xs rounded bg-yellow-100 text-yellow-900 px-1.5 py-0.5"
                data-testid="grid-mixed-knowledge"
                >mixed knowledge</span
              >
            </td>
            <td class="text-right">{{ count(row.done) }}</td>
            <td class="text-right">{{ count(row.empty) }}</td>
            <td class="text-right">{{ count(row.failed) }}</td>
            <td class="text-right">{{ count(row.skipped) }}</td>
            <td class="text-right">{{ count(row.pending) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <section class="space-y-4" data-testid="experiment-head-results">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">At HEAD</h3>
        <p class="text-sm text-gray-500">
          The blocks below are computed on the HEAD snapshot of every entry.
        </p>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid="experiment-headline"
      >
        <StatCard
          label="Affected projects"
          :value="`${headline.n_affected} / ${headline.n_projects}`"
          icon="solar:shield-warning-linear"
          :subtitle="
            formatShareWithInterval(
              headline.affected_share,
              headlineIntervals?.affected_share,
            )
          "
        />
        <StatCard
          label="Vulnerability instances"
          :value="count(headline.instances)"
          icon="solar:bug-linear"
        />
        <StatCard
          label="Vulnerable packages"
          :value="count(headline.distinct_vuln_packages)"
          icon="solar:box-linear"
          subtitle="distinct"
        />
        <StatCard
          label="Load per project"
          :value="`${count(headline.load_median)} / ${decimal(headline.load_mean, 1)} / ${count(headline.load_max)}`"
          icon="solar:chart-square-linear"
          :subtitle="
            withInterval(
              'median / mean / max instances',
              bootstrap?.headline.load_median
                ? `median ${cardInterval(bootstrap.headline.load_median, whole)}`
                : '',
            )
          "
        />
        <StatCard
          label="Gini by package"
          :value="decimal(headline.gini_pkg)"
          icon="solar:pie-chart-2-linear"
          :subtitle="
            withInterval(
              `top 10 packages: ${formatShareWithInterval(headline.top10_pkg_share, headlineIntervals?.top10_pkg_share)}`,
              cardInterval(bootstrap?.headline.gini_pkg, fixedThree),
            )
          "
        />
        <StatCard
          label="Gini by project"
          :value="decimal(headline.gini_proj)"
          icon="solar:pie-chart-2-linear"
          :subtitle="
            withInterval(
              `top 10 projects: ${formatShareWithInterval(headline.top10_proj_share, headlineIntervals?.top10_proj_share)}`,
              cardInterval(bootstrap?.headline.gini_proj, fixedThree),
            )
          "
        />
        <StatCard
          label="Packages to clear"
          :value="`${headline.pkgs_clear_50} / ${headline.pkgs_clear_80} / ${headline.pkgs_clear_90}`"
          icon="solar:broom-linear"
          subtitle="50% / 80% / 90% of instances"
        />
        <StatCard
          label="High + critical"
          :value="formatShare(headline.high_critical_share)"
          icon="solar:danger-triangle-linear"
          :subtitle="highCriticalSubtitle"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          class="bg-white rounded-xl border border-gray-200 p-4"
          data-testid="experiment-coverage"
        >
          <h3 class="font-semibold text-gray-900 mb-2">Coverage</h3>
          <p class="text-sm text-gray-700">
            {{ coverage.attempted }} of {{ coverage.runs }} runs attempted:
            {{ coverage.done }} done, {{ coverage.failed }} failed,
            {{ coverage.skipped }} skipped, {{ coverage.pending }} pending.
          </p>
          <template v-if="failureReasons.length > 0">
            <p class="text-sm text-gray-500 mt-3">Failure reasons</p>
            <ul class="text-sm text-gray-700">
              <li v-for="reason in failureReasons" :key="reason.key">
                {{ reason.key }}: <strong>{{ reason.count }}</strong>
              </li>
            </ul>
          </template>
          <template v-if="skipReasons.length > 0">
            <p class="text-sm text-gray-500 mt-3">Skip reasons</p>
            <ul class="text-sm text-gray-700">
              <li v-for="reason in skipReasons" :key="reason.key">
                {{ reason.key }}: <strong>{{ reason.count }}</strong>
              </li>
            </ul>
          </template>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900 mb-2">Severity mix</h3>
          <OpenAsFigure
            :definition="{
              metric: 'severity_mix',
              chart_form: 'bar',
              group_by: null,
              filters: {},
            }"
          />
          <table class="w-full text-sm" data-testid="experiment-severity">
            <thead class="text-left text-gray-500">
              <tr>
                <th class="font-medium">Severity</th>
                <th class="font-medium text-right">Instances</th>
                <th class="font-medium text-right">Share</th>
                <th class="font-medium text-right">95% CI</th>
              </tr>
            </thead>
            <tbody class="text-gray-700">
              <tr v-for="row in severityRows" :key="row.severity">
                <td>{{ row.severity }}</td>
                <td class="text-right">{{ count(row.count) }}</td>
                <td class="text-right">{{ formatShare(row.share) }}</td>
                <td class="text-right">{{ formatInterval(row.interval) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900 mb-2">
            Most widespread packages
          </h3>
          <table class="w-full text-sm" data-testid="experiment-top-packages">
            <thead class="text-left text-gray-500">
              <tr>
                <th class="font-medium">Package</th>
                <th class="font-medium text-right">Projects affected</th>
              </tr>
            </thead>
            <tbody class="text-gray-700">
              <tr v-for="[name, projects] in headline.top_packages" :key="name">
                <td class="font-mono">{{ name }}</td>
                <td class="text-right">{{ projects }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900 mb-2">EPSS</h3>
          <dl
            class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700"
            data-testid="experiment-epss"
          >
            <dt class="text-gray-500">Instances with a score</dt>
            <dd class="text-right">
              {{ formatShare(results.epss.nonnull_share) }}
            </dd>
            <dt class="text-gray-500">Median / p90</dt>
            <dd class="text-right">
              {{ decimal(results.epss.median, 4) }}
              <span v-if="bootstrap?.epss_median" class="text-gray-500">
                {{ formatBracketInterval(bootstrap.epss_median, fixedFour) }}
              </span>
              / {{ decimal(results.epss.p90, 4) }}
            </dd>
            <dt class="text-gray-500">Above 10% / 50%</dt>
            <dd class="text-right">
              {{ count(results.epss.over_10pct) }} /
              {{ count(results.epss.over_50pct) }}
            </dd>
            <dt class="text-gray-500">Missing, CVE / not CVE</dt>
            <dd class="text-right">
              {{ count(results.epss.missing_cve) }} /
              {{ count(results.epss.missing_non_cve) }}
            </dd>
          </dl>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900 mb-2">Match flags</h3>
          <table class="w-full text-sm" data-testid="experiment-match-flags">
            <tbody class="text-gray-700">
              <tr v-for="row in matchFlags" :key="row.key">
                <td class="font-mono">{{ row.key }}</td>
                <td class="text-right">{{ count(row.count) }}</td>
                <td class="text-right">{{ formatShare(row.share) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900 mb-2">Winning source</h3>
          <table class="w-full text-sm" data-testid="experiment-winning-source">
            <tbody class="text-gray-700">
              <tr v-for="row in winningSources" :key="row.key">
                <td>{{ row.key }}</td>
                <td class="text-right">{{ count(row.count) }}</td>
                <td class="text-right">{{ formatShare(row.share) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="bg-white rounded-xl border border-gray-200 p-4"
          data-testid="experiment-rqc"
        >
          <h3 class="font-semibold text-gray-900 mb-2">Stars vs load</h3>
          <OpenAsFigure
            :definition="{
              metric: 'stars_vs_load',
              chart_form: 'scatter',
              group_by: null,
              filters: {},
            }"
          />
          <p class="text-sm text-gray-700">
            Spearman rho between star rank and vulnerability load:
            <strong>{{ decimal(results.rqc.spearman_rho) }}</strong> (two-sided
            {{ formatPValue(results.rqc.p) }}, n = {{ results.rqc.n }}).
          </p>
          <p
            v-if="results.rqc.excluded_zero_dep_projects > 0"
            class="text-sm text-gray-500 mt-1"
          >
            {{ results.rqc.excluded_zero_dep_projects }} projects without
            dependencies left out.
          </p>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900 mb-2">By package manager</h3>
          <table class="w-full text-sm" data-testid="experiment-rqd">
            <thead class="text-left text-gray-500">
              <tr>
                <th class="font-medium">Manager</th>
                <th class="font-medium text-right">Projects</th>
                <th class="font-medium text-right">Median deps</th>
                <th class="font-medium text-right">Median vulns</th>
              </tr>
            </thead>
            <tbody class="text-gray-700">
              <tr v-for="row in results.rqd" :key="row.package_manager">
                <td>{{ row.package_manager }}</td>
                <td class="text-right">{{ row.projects }}</td>
                <td class="text-right">
                  {{ count(row.med_deps) }}
                  <span
                    v-if="bootstrap?.rqd[row.package_manager]?.med_deps"
                    class="text-gray-500"
                  >
                    {{
                      formatBracketInterval(
                        bootstrap.rqd[row.package_manager]?.med_deps,
                        whole,
                      )
                    }}
                  </span>
                </td>
                <td class="text-right">
                  {{ count(row.med_vulns) }}
                  <span
                    v-if="bootstrap?.rqd[row.package_manager]?.med_vulns"
                    class="text-gray-500"
                  >
                    {{
                      formatBracketInterval(
                        bootstrap.rqd[row.package_manager]?.med_vulns,
                        whole,
                      )
                    }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        class="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto"
      >
        <h3 class="font-semibold text-gray-900 mb-2">Sweep</h3>
        <table class="w-full text-sm" data-testid="experiment-sweep">
          <thead class="text-left text-gray-500">
            <tr>
              <th class="font-medium">Subset</th>
              <th class="font-medium text-right">Affected</th>
              <th class="font-medium text-right">Instances</th>
              <th class="font-medium text-right">Packages</th>
              <th class="font-medium text-right">Load median / mean</th>
              <th class="font-medium text-right">High + critical</th>
              <th class="font-medium text-right">Gini pkg / proj</th>
              <th class="font-medium text-right">Clear 50 / 80 / 90</th>
            </tr>
          </thead>
          <tbody class="text-gray-700">
            <tr v-for="{ row, intervals } in sweepRows" :key="row.subset">
              <td>{{ SweepSubsetLabels[row.subset] ?? row.subset }}</td>
              <td class="text-right">
                {{ row.n_affected }} / {{ row.n_projects }}
                <div
                  v-if="intervals?.affected_share"
                  class="text-xs text-gray-500"
                >
                  95% CI {{ formatInterval(intervals.affected_share) }}
                </div>
              </td>
              <td class="text-right">{{ count(row.instances) }}</td>
              <td class="text-right">
                {{ count(row.distinct_vuln_packages) }}
              </td>
              <td class="text-right">
                {{ count(row.load_median) }}
                <span
                  v-if="bootstrap?.sweep[row.subset]?.load_median"
                  class="text-gray-500"
                >
                  {{
                    formatBracketInterval(
                      bootstrap.sweep[row.subset].load_median,
                      whole,
                    )
                  }}
                </span>
                / {{ decimal(row.load_mean, 1) }}
              </td>
              <td class="text-right">
                {{ formatShare(row.high_critical_share) }}
                <div
                  v-if="intervals?.high_critical_share"
                  class="text-xs text-gray-500"
                >
                  95% CI {{ formatInterval(intervals.high_critical_share) }}
                </div>
              </td>
              <td class="text-right">
                {{ decimal(row.gini_pkg) }}
                <span
                  v-if="bootstrap?.sweep[row.subset]?.gini_pkg"
                  class="text-gray-500"
                >
                  {{
                    formatBracketInterval(
                      bootstrap.sweep[row.subset].gini_pkg,
                      fixedThree,
                    )
                  }}
                </span>
                / {{ decimal(row.gini_proj) }}
                <span
                  v-if="bootstrap?.sweep[row.subset]?.gini_proj"
                  class="text-gray-500"
                >
                  {{
                    formatBracketInterval(
                      bootstrap.sweep[row.subset].gini_proj,
                      fixedThree,
                    )
                  }}
                </span>
              </td>
              <td class="text-right">
                {{ row.pkgs_clear_50 }} / {{ row.pkgs_clear_80 }} /
                {{ row.pkgs_clear_90 }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ExperimentFixLag
      v-if="fixLag"
      :fix-lag="fixLag"
      :exposures="results.exposures ?? null"
      :intervals="bootstrap?.fix_lag ?? null"
    />

    <ExperimentProbes
      v-if="probes"
      :probes="probes"
      :exposures="results.exposures ?? null"
    />

    <ExperimentSurvival v-if="survival" :survival="survival" />

    <ExperimentResidence
      v-if="residence"
      :residence="residence"
      :intervals="bootstrap?.residence ?? null"
    />

    <ExperimentUpstreamLeverage
      v-if="upstreamLeverage"
      :leverage="upstreamLeverage"
    />

    <ExperimentLoad v-if="loadOverTime" :rows="loadOverTime" />

    <div
      class="bg-white rounded-xl border border-gray-200 p-4"
      data-testid="experiment-provenance"
    >
      <h3 class="font-semibold text-gray-900 mb-2">Provenance</h3>
      <dl
        class="grid grid-cols-1 sm:grid-cols-[12rem_1fr] gap-x-4 gap-y-1 text-sm text-gray-700"
      >
        <dt class="text-gray-500">Analyzer steps</dt>
        <dd>
          <ol v-if="analyzerSteps.length > 0" class="list-decimal ml-4">
            <li v-for="(stage, index) in analyzerSteps" :key="index">
              {{ stage }}
            </li>
          </ol>
          <span v-else>-</span>
        </dd>
        <dt class="text-gray-500">API version</dt>
        <dd>{{ provenance.api_version ?? "-" }}</dd>
        <dt class="text-gray-500">Created</dt>
        <dd>
          {{ formatExperimentDate(provenance.created_on) }}
          <template v-if="provenance.created_by">
            by {{ provenance.created_by }}</template
          >
        </dd>
        <dt class="text-gray-500">Started / ended</dt>
        <dd>
          {{ formatExperimentDate(provenance.started_on) }} /
          {{ formatExperimentDate(provenance.ended_on) }}
        </dd>
        <dt class="text-gray-500">EPSS rows, start / end</dt>
        <dd>
          {{ count(provenance.knowledge_start?.epss_rows ?? null) }} /
          {{ count(provenance.knowledge_end?.epss_rows ?? null) }}
        </dd>
        <template v-if="provenance.bootstrap">
          <dt class="text-gray-500">Intervals</dt>
          <dd>
            {{ provenance.bootstrap.confidence * 100 }}%
            {{ provenance.bootstrap.method }},
            {{ count(provenance.bootstrap.resamples) }} resamples, seed
            {{ provenance.bootstrap.seed }}
          </dd>
        </template>
      </dl>
    </div>
  </div>
</template>
