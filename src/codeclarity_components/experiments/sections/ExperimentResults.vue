<script setup lang="ts">
import { TriangleAlert } from "@lucide/vue";
import { computed, provide } from "vue";

import {
  PAGE_EXCLUSIONS,
  RESULT_MARKS,
} from "@/base_components/charts/chart-caption";
import {
  formatBracketInterval,
  formatInterval,
  formatPValue,
  formatShare,
  formatShareWithInterval,
} from "@/base_components/charts/chart-format";
import { StatTile, StatusBadge } from "@/base_components/page";
import { Alert, AlertDescription, AlertTitle } from "@/shadcn/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

import {
  gridCoverageOf,
  snapshotExclusions,
} from "../charts/experiment-caption";
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

/** Classes of a result block and its heading */
const CARD =
  "flex flex-col gap-3 rounded-card border bg-card p-4 text-card-foreground shadow-card";
const HEADING = "font-semibold text-foreground-strong";

const props = defineProps<{
  results: ExperimentResults;
  /** The Published results version shown, null for unpublished results */
  metricVersion: number | null;
}>();

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

/** Each knowledge source with its stamp at the start and end of the run. */
const knowledgeSources = computed(() => {
  const start = provenance.value.knowledge_start?.knowledge_sources ?? {};
  const end = provenance.value.knowledge_end?.knowledge_sources ?? {};
  return [...new Set([...Object.keys(start), ...Object.keys(end)])]
    .sort()
    .map((name) => ({
      name,
      start: start[name] ?? "-",
      end: end[name] ?? "-",
    }));
});

/** Shown only for a grid: a HEAD-only experiment has just the HEAD row. */
const gridCoverage = computed(() =>
  gridCoverageOf(props.results.grid_coverage ?? []),
);
provide(
  PAGE_EXCLUSIONS,
  computed(() => snapshotExclusions(gridCoverage.value)),
);
provide(
  RESULT_MARKS,
  computed(() =>
    props.metricVersion === null
      ? { unpublished: true }
      : { metricVersion: props.metricVersion },
  ),
);
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
  <div class="flex flex-col gap-6">
    <Alert
      v-if="provenance.knowledge_changed"
      class="border-warning bg-warning-subtle text-warning"
      data-testid="experiment-knowledge-changed"
    >
      <TriangleAlert aria-hidden="true" class="size-4 !text-warning" />
      <AlertTitle>Knowledge changed during the Experiment.</AlertTitle>
      <AlertDescription>
        The vulnerability sources were updated between its start and end, so
        runs analysed early and late were matched against different data.
      </AlertDescription>
    </Alert>

    <section
      v-if="gridCoverage.length > 0"
      :class="CARD"
      aria-labelledby="results-grid-coverage-heading"
    >
      <h3 id="results-grid-coverage-heading" :class="HEADING">
        Coverage per grid date
      </h3>
      <p class="text-sm text-muted-foreground">
        Empty runs are done but had no lockfile yet at that date.
      </p>
      <p
        v-if="anyMixedKnowledge"
        class="text-sm text-warning"
        data-testid="grid-mixed-knowledge-note"
      >
        Dates marked mixed knowledge had runs matched against different
        vulnerability data: the knowledge was updated while they ran.
      </p>
      <Table data-testid="experiment-grid-coverage">
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead>Grid date</TableHead>
            <TableHead class="text-right">Done</TableHead>
            <TableHead class="text-right">Empty</TableHead>
            <TableHead class="text-right">Failed</TableHead>
            <TableHead class="text-right">Skipped</TableHead>
            <TableHead class="text-right">Pending</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="tabular-nums">
          <TableRow
            v-for="row in gridCoverage"
            :key="row.grid_date ?? 'HEAD'"
            data-testid="grid-coverage-row"
          >
            <TableCell class="font-mono">
              {{ row.grid_date ?? "HEAD" }}
              <StatusBadge
                v-if="row.mixed_knowledge"
                class="ml-2 font-sans"
                tone="warning"
                label="mixed knowledge"
                data-testid="grid-mixed-knowledge"
              />
            </TableCell>
            <TableCell class="text-right">{{ count(row.done) }}</TableCell>
            <TableCell class="text-right">{{ count(row.empty) }}</TableCell>
            <TableCell class="text-right">{{ count(row.failed) }}</TableCell>
            <TableCell class="text-right">{{ count(row.skipped) }}</TableCell>
            <TableCell class="text-right">{{ count(row.pending) }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>

    <section
      class="flex flex-col gap-4"
      aria-labelledby="results-head-heading"
      data-testid="experiment-head-results"
    >
      <div>
        <h3
          id="results-head-heading"
          class="text-lg font-semibold text-foreground-strong"
        >
          At HEAD
        </h3>
        <p class="text-sm text-muted-foreground">
          The blocks below are computed on the HEAD snapshot of every entry.
        </p>
      </div>

      <ul
        aria-label="Numbers at HEAD"
        class="grid grid-cols-2 gap-4 xl:grid-cols-4"
        data-testid="experiment-headline"
      >
        <StatTile
          label="Affected projects"
          :value="`${headline.n_affected} / ${headline.n_projects}`"
          :hint="
            formatShareWithInterval(
              headline.affected_share,
              headlineIntervals?.affected_share,
            )
          "
        />
        <StatTile
          label="Vulnerability instances"
          :value="count(headline.instances)"
        />
        <StatTile
          label="Vulnerable packages"
          :value="count(headline.distinct_vuln_packages)"
          hint="distinct"
        />
        <StatTile
          label="Load per project"
          :value="`${count(headline.load_median)} / ${decimal(headline.load_mean, 1)} / ${count(headline.load_max)}`"
          :hint="
            withInterval(
              'median / mean / max instances',
              bootstrap?.headline.load_median
                ? `median ${cardInterval(bootstrap.headline.load_median, whole)}`
                : '',
            )
          "
        />
        <StatTile
          label="Gini by package"
          :value="decimal(headline.gini_pkg)"
          :hint="
            withInterval(
              `top 10 packages: ${formatShareWithInterval(headline.top10_pkg_share, headlineIntervals?.top10_pkg_share)}`,
              cardInterval(bootstrap?.headline.gini_pkg, fixedThree),
            )
          "
        />
        <StatTile
          label="Gini by project"
          :value="decimal(headline.gini_proj)"
          :hint="
            withInterval(
              `top 10 projects: ${formatShareWithInterval(headline.top10_proj_share, headlineIntervals?.top10_proj_share)}`,
              cardInterval(bootstrap?.headline.gini_proj, fixedThree),
            )
          "
        />
        <StatTile
          label="Packages to clear"
          :value="`${headline.pkgs_clear_50} / ${headline.pkgs_clear_80} / ${headline.pkgs_clear_90}`"
          hint="50% / 80% / 90% of instances"
        />
        <StatTile
          label="High + critical"
          :value="formatShare(headline.high_critical_share)"
          :hint="highCriticalSubtitle"
        />
      </ul>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section
          :class="CARD"
          aria-labelledby="results-coverage-heading"
          data-testid="experiment-coverage"
        >
          <h4 id="results-coverage-heading" :class="HEADING">Coverage</h4>
          <p class="text-sm text-foreground">
            {{ coverage.attempted }} of {{ coverage.runs }} runs attempted:
            {{ coverage.done }} done, {{ coverage.failed }} failed,
            {{ coverage.skipped }} skipped, {{ coverage.pending }} pending.
          </p>
          <template v-if="failureReasons.length > 0">
            <p class="text-sm text-muted-foreground">Failure reasons</p>
            <ul class="text-sm text-foreground">
              <li v-for="reason in failureReasons" :key="reason.key">
                {{ reason.key }}: <strong>{{ reason.count }}</strong>
              </li>
            </ul>
          </template>
          <template v-if="skipReasons.length > 0">
            <p class="text-sm text-muted-foreground">Skip reasons</p>
            <ul class="text-sm text-foreground">
              <li v-for="reason in skipReasons" :key="reason.key">
                {{ reason.key }}: <strong>{{ reason.count }}</strong>
              </li>
            </ul>
          </template>
        </section>

        <section :class="CARD" aria-labelledby="results-severity-heading">
          <div class="flex items-center justify-between gap-2">
            <h4 id="results-severity-heading" :class="HEADING">Severity mix</h4>
            <OpenAsFigure
              :definition="{
                metric: 'severity_mix',
                chart_form: 'bar',
                group_by: null,
                filters: {},
              }"
            />
          </div>
          <Table data-testid="experiment-severity">
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead>Severity</TableHead>
                <TableHead class="text-right">Instances</TableHead>
                <TableHead class="text-right">Share</TableHead>
                <TableHead class="text-right">95% CI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody class="tabular-nums">
              <TableRow v-for="row in severityRows" :key="row.severity">
                <TableCell>{{ row.severity }}</TableCell>
                <TableCell class="text-right">{{ count(row.count) }}</TableCell>
                <TableCell class="text-right">{{
                  formatShare(row.share)
                }}</TableCell>
                <TableCell class="text-right">{{
                  formatInterval(row.interval)
                }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section :class="CARD" aria-labelledby="results-packages-heading">
          <h4 id="results-packages-heading" :class="HEADING">
            Most widespread packages
          </h4>
          <Table data-testid="experiment-top-packages">
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead>Package</TableHead>
                <TableHead class="text-right">Projects affected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody class="tabular-nums">
              <TableRow
                v-for="[name, projects] in headline.top_packages"
                :key="name"
              >
                <TableCell class="font-mono">{{ name }}</TableCell>
                <TableCell class="text-right">{{ projects }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section :class="CARD" aria-labelledby="results-epss-heading">
          <h4 id="results-epss-heading" :class="HEADING">EPSS</h4>
          <dl
            class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-foreground"
            data-testid="experiment-epss"
          >
            <dt class="text-muted-foreground">Instances with a score</dt>
            <dd class="text-right">
              {{
                formatShareWithInterval(
                  results.epss.nonnull_share,
                  results.share_intervals?.epss_nonnull,
                )
              }}
            </dd>
            <dt class="text-muted-foreground">Median / p90</dt>
            <dd class="text-right">
              {{ decimal(results.epss.median, 4) }}
              <span v-if="bootstrap?.epss_median" class="text-muted-foreground">
                {{ formatBracketInterval(bootstrap.epss_median, fixedFour) }}
              </span>
              / {{ decimal(results.epss.p90, 4) }}
            </dd>
            <dt class="text-muted-foreground">Above 10% / 50%</dt>
            <dd class="text-right">
              {{ count(results.epss.over_10pct) }} /
              {{ count(results.epss.over_50pct) }}
            </dd>
            <dt class="text-muted-foreground">Missing, CVE / not CVE</dt>
            <dd class="text-right">
              {{ count(results.epss.missing_cve) }} /
              {{ count(results.epss.missing_non_cve) }}
            </dd>
          </dl>
        </section>

        <section :class="CARD" aria-labelledby="results-match-flags-heading">
          <h4 id="results-match-flags-heading" :class="HEADING">Match flags</h4>
          <Table data-testid="experiment-match-flags">
            <TableHeader class="sr-only">
              <TableRow>
                <TableHead>Flag</TableHead>
                <TableHead>Instances</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody class="tabular-nums">
              <TableRow v-for="row in matchFlags" :key="row.key">
                <TableCell class="font-mono">{{ row.key }}</TableCell>
                <TableCell class="text-right">{{ count(row.count) }}</TableCell>
                <TableCell class="text-right">{{
                  formatShare(row.share)
                }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section :class="CARD" aria-labelledby="results-winning-source-heading">
          <h4 id="results-winning-source-heading" :class="HEADING">
            Winning source
          </h4>
          <Table data-testid="experiment-winning-source">
            <TableHeader class="sr-only">
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Instances</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody class="tabular-nums">
              <TableRow v-for="row in winningSources" :key="row.key">
                <TableCell>{{ row.key }}</TableCell>
                <TableCell class="text-right">{{ count(row.count) }}</TableCell>
                <TableCell class="text-right">{{
                  formatShare(row.share)
                }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <section
          :class="CARD"
          aria-labelledby="results-rqc-heading"
          data-testid="experiment-rqc"
        >
          <div class="flex items-center justify-between gap-2">
            <h4 id="results-rqc-heading" :class="HEADING">Stars vs load</h4>
            <OpenAsFigure
              :definition="{
                metric: 'stars_vs_load',
                chart_form: 'scatter',
                group_by: null,
                filters: {},
              }"
            />
          </div>
          <p class="text-sm text-foreground">
            Spearman rho between star rank and vulnerability load:
            <strong>{{ decimal(results.rqc.spearman_rho) }}</strong> (two-sided
            {{ formatPValue(results.rqc.p) }}, n = {{ results.rqc.n }}).
          </p>
          <p
            v-if="results.rqc.excluded_zero_dep_projects > 0"
            class="text-sm text-muted-foreground"
          >
            {{ results.rqc.excluded_zero_dep_projects }} projects without
            dependencies left out.
          </p>
        </section>

        <section :class="CARD" aria-labelledby="results-rqd-heading">
          <h4 id="results-rqd-heading" :class="HEADING">By package manager</h4>
          <Table data-testid="experiment-rqd">
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead>Manager</TableHead>
                <TableHead class="text-right">Projects</TableHead>
                <TableHead class="text-right">Median deps</TableHead>
                <TableHead class="text-right">Median vulns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody class="tabular-nums">
              <TableRow v-for="row in results.rqd" :key="row.package_manager">
                <TableCell>{{ row.package_manager }}</TableCell>
                <TableCell class="text-right">{{ row.projects }}</TableCell>
                <TableCell class="text-right">
                  {{ count(row.med_deps) }}
                  <span
                    v-if="bootstrap?.rqd[row.package_manager]?.med_deps"
                    class="text-muted-foreground"
                  >
                    {{
                      formatBracketInterval(
                        bootstrap.rqd[row.package_manager]?.med_deps,
                        whole,
                      )
                    }}
                  </span>
                </TableCell>
                <TableCell class="text-right">
                  {{ count(row.med_vulns) }}
                  <span
                    v-if="bootstrap?.rqd[row.package_manager]?.med_vulns"
                    class="text-muted-foreground"
                  >
                    {{
                      formatBracketInterval(
                        bootstrap.rqd[row.package_manager]?.med_vulns,
                        whole,
                      )
                    }}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>
      </div>

      <section :class="CARD" aria-labelledby="results-sweep-heading">
        <h4 id="results-sweep-heading" :class="HEADING">Sweep</h4>
        <Table data-testid="experiment-sweep">
          <TableHeader>
            <TableRow class="hover:bg-transparent">
              <TableHead>Subset</TableHead>
              <TableHead class="text-right">Affected</TableHead>
              <TableHead class="text-right">Instances</TableHead>
              <TableHead class="text-right">Packages</TableHead>
              <TableHead class="text-right">Load median / mean</TableHead>
              <TableHead class="text-right">High + critical</TableHead>
              <TableHead class="text-right">Gini pkg / proj</TableHead>
              <TableHead class="text-right">Clear 50 / 80 / 90</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody class="tabular-nums">
            <TableRow v-for="{ row, intervals } in sweepRows" :key="row.subset">
              <TableCell>{{
                SweepSubsetLabels[row.subset] ?? row.subset
              }}</TableCell>
              <TableCell class="text-right">
                {{ row.n_affected }} / {{ row.n_projects }}
                <div
                  v-if="intervals?.affected_share"
                  class="text-xs text-muted-foreground"
                >
                  95% CI {{ formatInterval(intervals.affected_share) }}
                </div>
              </TableCell>
              <TableCell class="text-right">{{
                count(row.instances)
              }}</TableCell>
              <TableCell class="text-right">
                {{ count(row.distinct_vuln_packages) }}
              </TableCell>
              <TableCell class="text-right">
                {{ count(row.load_median) }}
                <span
                  v-if="bootstrap?.sweep[row.subset]?.load_median"
                  class="text-muted-foreground"
                >
                  {{
                    formatBracketInterval(
                      bootstrap.sweep[row.subset].load_median,
                      whole,
                    )
                  }}
                </span>
                / {{ decimal(row.load_mean, 1) }}
              </TableCell>
              <TableCell class="text-right">
                {{ formatShare(row.high_critical_share) }}
                <div
                  v-if="intervals?.high_critical_share"
                  class="text-xs text-muted-foreground"
                >
                  95% CI {{ formatInterval(intervals.high_critical_share) }}
                </div>
              </TableCell>
              <TableCell class="text-right">
                {{ decimal(row.gini_pkg) }}
                <span
                  v-if="bootstrap?.sweep[row.subset]?.gini_pkg"
                  class="text-muted-foreground"
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
                  class="text-muted-foreground"
                >
                  {{
                    formatBracketInterval(
                      bootstrap.sweep[row.subset].gini_proj,
                      fixedThree,
                    )
                  }}
                </span>
              </TableCell>
              <TableCell class="text-right">
                {{ row.pkgs_clear_50 }} / {{ row.pkgs_clear_80 }} /
                {{ row.pkgs_clear_90 }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </section>

    <ExperimentFixLag
      v-if="fixLag"
      :fix-lag="fixLag"
      :exposures="results.exposures ?? null"
      :intervals="bootstrap?.fix_lag ?? null"
      :snapshot-interval="results.share_intervals?.fix_snapshot_precision"
    />

    <ExperimentProbes
      v-if="probes"
      :probes="probes"
      :exposures="results.exposures ?? null"
    />

    <ExperimentSurvival
      v-if="survival"
      :survival="survival"
      :snapshot-interval="results.share_intervals?.fix_snapshot_precision"
    />

    <ExperimentResidence
      v-if="residence"
      :residence="residence"
      :intervals="bootstrap?.residence ?? null"
      :snapshot-interval="
        results.share_intervals?.introduction_snapshot_precision
      "
    />

    <ExperimentUpstreamLeverage
      v-if="upstreamLeverage"
      :leverage="upstreamLeverage"
      :share-intervals="results.share_intervals?.removed_transitive"
      :snapshot-interval="results.share_intervals?.fix_snapshot_precision"
    />

    <ExperimentLoad v-if="loadOverTime" :rows="loadOverTime" />

    <section
      :class="CARD"
      aria-labelledby="results-provenance-heading"
      data-testid="experiment-provenance"
    >
      <h3 id="results-provenance-heading" :class="HEADING">Provenance</h3>
      <dl
        class="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-1 text-sm text-foreground"
      >
        <dt class="text-muted-foreground">Analyzer steps</dt>
        <dd>
          <ol v-if="analyzerSteps.length > 0" class="ml-4 list-decimal">
            <li v-for="(stage, index) in analyzerSteps" :key="index">
              {{ stage }}
            </li>
          </ol>
          <span v-else>-</span>
        </dd>
        <dt class="text-muted-foreground">API version</dt>
        <dd>{{ provenance.api_version ?? "-" }}</dd>
        <dt class="text-muted-foreground">Created</dt>
        <dd>
          {{ formatExperimentDate(provenance.created_on) }}
          <template v-if="provenance.created_by">
            by {{ provenance.created_by }}</template
          >
        </dd>
        <dt class="text-muted-foreground">Started / ended</dt>
        <dd>
          {{ formatExperimentDate(provenance.started_on) }} /
          {{ formatExperimentDate(provenance.ended_on) }}
        </dd>
        <dt class="text-muted-foreground">Knowledge sources, start / end</dt>
        <dd>
          <ul v-if="knowledgeSources.length > 0">
            <li
              v-for="source in knowledgeSources"
              :key="source.name"
              data-testid="experiment-knowledge-source"
            >
              {{ source.name }}: {{ source.start }} / {{ source.end }}
            </li>
          </ul>
          <span v-else>-</span>
        </dd>
        <dt class="text-muted-foreground">EPSS rows, start / end</dt>
        <dd>
          {{ count(provenance.knowledge_start?.epss_rows ?? null) }} /
          {{ count(provenance.knowledge_end?.epss_rows ?? null) }}
        </dd>
        <template v-if="provenance.bootstrap">
          <dt class="text-muted-foreground">Intervals</dt>
          <dd>
            {{ provenance.bootstrap.confidence * 100 }}%
            {{ provenance.bootstrap.method }},
            {{ count(provenance.bootstrap.resamples) }} resamples, seed
            {{ provenance.bootstrap.seed }}
          </dd>
        </template>
      </dl>
    </section>
  </div>
</template>
