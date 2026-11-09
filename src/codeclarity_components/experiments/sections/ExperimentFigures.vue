<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from "vue";

import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { errorToast, successToast } from "@/utils/toasts";

import {
  type FigureCaption,
  gridCoverageOf,
  SNAPSHOT_COVERAGE,
} from "../charts/chart-caption";
import type { ChartData, CsvValue } from "../charts/chart-export";
import {
  formatNumber,
  type GridLineSeries,
  type StepSeries,
} from "../charts/chart-format";
import ChartExport from "../charts/ChartExport.vue";
import FigureBarChart from "../charts/FigureBarChart.vue";
import FigureStepChart from "../charts/FigureStepChart.vue";
import GridLineChart from "../charts/GridLineChart.vue";
import type { GridCoverageRow, PublishedVersion } from "../experiment.entity";
import {
  definitionKey,
  type Figure,
  type FigureCatalog,
  type FigureChartForm,
  type FigureData,
  type FigureDefinition,
  type FigureFilter,
  type FigureMetric,
} from "../experiment-figure.entity";
import { ExperimentsRepository } from "../experiments.repository";

import ExperimentLoadProgress from "./ExperimentLoadProgress.vue";

const props = defineProps<{
  experimentId: string;
  gridCoverage: GridCoverageRow[];
  catalog: FigureCatalog | null;
  publishedVersions: PublishedVersion[];
  /** A definition a result block asked to open */
  openRequest: FigureDefinition | null;
}>();

provide(
  SNAPSHOT_COVERAGE,
  computed(() => gridCoverageOf(props.gridCoverage)),
);

/** A select's value for "nothing chosen": Select items cannot be empty */
const NONE = "none";

/** Severities in colour-slot order, so a class keeps its colour */
/** Series colours defined in experiment-chart.css; more groups reuse them */
const SERIES_TOKENS = 6;

const SEVERITY_SLOTS = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"];

const userStore = useUserStore();
const auth = useAuthStore();
const experimentsRepository = new ExperimentsRepository();

const figures = ref<Figure[]>([]);
const preview = ref<FigureData | null>(null);
const metricId = ref("");
const chartForm = ref("");
const groupBy = ref(NONE);
const filterValues = ref<Record<string, string>>({});
const name = ref("");
/** The saved Figure being edited, null for a new one */
const openFigureId = ref<string | null>(null);
const confirmingDelete = ref<string | null>(null);
const saving = ref(false);
/** The version the selector shows; moving needs the button */
const chosenVersion = ref(NONE);
const moving = ref(false);
/** Only the newest preview request may fill the chart */
let previewRequest = 0;
const previewLoading = ref(false);

const metric = computed<FigureMetric | null>(
  () =>
    props.catalog?.metrics.find((item) => item.id === metricId.value) ?? null,
);

const form = computed<FigureChartForm | null>(
  () =>
    metric.value?.chart_forms.find((item) => item.id === chartForm.value) ??
    null,
);

/** Group-bys valid with the chosen chart form */
const groupOptions = computed(() => {
  const allowed = form.value?.group_by;
  const all = metric.value?.group_by ?? [];
  return allowed ? all.filter((item) => allowed.includes(item.id)) : all;
});

/** Filters valid with the chosen chart form */
const filterOptions = computed<FigureFilter[]>(() => {
  const allowed = form.value?.filters;
  const all = metric.value?.filters ?? [];
  return allowed ? all.filter((item) => allowed.includes(item.id)) : all;
});

function rangeEnd(filterId: string, end: 0 | 1): string {
  return filterValues.value[filterId]?.split("/")[end] ?? "";
}

function setRangeEnd(filterId: string, end: 0 | 1, value: string): void {
  const ends = [rangeEnd(filterId, 0), rangeEnd(filterId, 1)];
  ends[end] = value;
  if (ends[0] || ends[1]) filterValues.value[filterId] = ends.join("/");
  else delete filterValues.value[filterId];
}

function isReversedRange(filter: FigureFilter): boolean {
  if (filter.kind !== "date_range") return false;
  const [from, to] = [rangeEnd(filter.id, 0), rangeEnd(filter.id, 1)];
  return Boolean(from && to && from > to);
}

/** Bars with a 95% band carry error bars, which the note below explains. */
const hasErrorBars = computed(
  () =>
    form.value?.mark === "bar" &&
    (preview.value?.series ?? []).some((series) => series.upper),
);

const hasReversedRange = computed(() =>
  filterOptions.value.some(isReversedRange),
);

const definition = computed<FigureDefinition | null>(() => {
  if (!metric.value) return null;
  const filters: Record<string, string> = {};
  for (const filter of filterOptions.value) {
    const value = filterValues.value[filter.id];
    if (value && value !== NONE && !isReversedRange(filter)) {
      filters[filter.id] = value;
    }
  }
  return {
    metric: metric.value.id,
    chart_form: chartForm.value,
    group_by: groupBy.value === NONE ? null : groupBy.value,
    filters,
  };
});

const savedFigure = computed(
  () => figures.value.find((item) => item.id === openFigureId.value) ?? null,
);

/** Null once the definition differs from what the version stores. */
const tiedVersion = computed<number | null>(() => {
  const saved = savedFigure.value;
  if (saved?.metric_version == null || !definition.value) return null;
  return definitionKey(saved.definition) === definitionKey(definition.value)
    ? saved.metric_version
    : null;
});

const canSave = computed(
  () =>
    name.value.trim().length > 0 &&
    definition.value !== null &&
    !hasReversedRange.value,
);

/** A severity keeps its colour whichever groups are present. */
function seriesColor(key: string, index: number): string {
  const slot = SEVERITY_SLOTS.indexOf(key);
  return `var(--viz-series-${((slot === -1 ? index : slot) % SERIES_TOKENS) + 1})`;
}

const chartSeries = computed<GridLineSeries[]>(() =>
  (preview.value?.series ?? []).map((series, index) => ({
    ...series,
    color: seriesColor(series.key, index),
  })),
);

/** Only survival Figures carry a censoring date. */
const censoredAt = computed(() => preview.value?.censored_at ?? null);

const stepSeries = computed<StepSeries[]>(() =>
  (preview.value?.series ?? []).map((series, index) => {
    return {
      ...series,
      color: seriesColor(series.key, index),
      lower: series.lower ?? [],
      upper: series.upper ?? [],
      censored: series.censored ?? [],
    };
  }),
);

const yMax = computed(() =>
  Math.max(
    1,
    ...(preview.value?.series ?? []).flatMap((series) =>
      [...series.values, ...(series.upper ?? [])].filter(
        (value) => value !== null,
      ),
    ),
  ),
);

/** Day labels stay numbers, so a negative one is not quoted as a formula. */
function axisValue(label: string): CsvValue {
  const value = Number(label);
  return label.trim() !== "" && Number.isFinite(value) ? value : label;
}

/** Each drawn series as columns, with whichever extras it carries. */
const plotted = computed<ChartData>(() => {
  const data = preview.value;
  if (!data) return { columns: [], rows: [] };
  const columns = data.series.map((series) => [
    { name: series.label, values: series.values },
    ...(series.lower
      ? [{ name: `${series.label} lower 95`, values: series.lower }]
      : []),
    ...(series.upper
      ? [{ name: `${series.label} upper 95`, values: series.upper }]
      : []),
    ...(series.censored
      ? [{ name: `${series.label} censored`, values: series.censored }]
      : []),
  ]);
  const flat = columns.flat();
  return {
    columns: [data.x_title, ...flat.map((column) => column.name)],
    rows: data.labels.map((label, i) => [
      axisValue(label),
      ...flat.map((column) => column.values[i] ?? null),
    ]),
  };
});

/** "View: As-of" for each applied filter, in catalog order. */
const filterPhrases = computed(() =>
  (metric.value?.filters ?? []).flatMap((filter) => {
    const value = definition.value?.filters[filter.id];
    if (!value) return [];
    const option = filter.options.find((item) => item.id === value);
    return [`${filter.label}: ${option?.label ?? value}`];
  }),
);

const groupLabel = computed(
  () =>
    metric.value?.group_by.find((item) => item.id === groupBy.value)?.label ??
    null,
);

const exportName = computed(() => {
  const slug = name.value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || (metric.value?.id ?? "figure");
});

const figureCaption = computed<FigureCaption>(() => {
  const data = preview.value;
  const description = [
    `${metric.value?.label ?? "Figure"}: ${data?.y_title ?? ""} by ${data?.x_title ?? ""}`,
    ...(groupLabel.value ? [`grouped by ${groupLabel.value}`] : []),
    ...filterPhrases.value,
  ].join(", ");
  return {
    description,
    n: data?.caption?.n ?? "Sample size not reported",
    exclusions: data?.caption?.exclusions ?? [],
    asOf:
      definition.value?.filters.view === "as_of" ||
      (data?.series ?? []).some((series) => series.key === "as_of"),
    unpublished: tiedVersion.value === null,
    ...(tiedVersion.value === null ? {} : { metricVersion: tiedVersion.value }),
  };
});

function describePoint(index: number): string {
  const values = (preview.value?.series ?? [])
    .filter((series) => series.values[index] !== null)
    .map((series) => `${series.label} ${formatNumber(series.values[index]!)}`)
    .join(", ");
  return `${preview.value?.labels[index] ?? ""}: ${values}`;
}

function requestContext(): { orgId: string; bearerToken: string } | null {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken) return null;
  return { orgId, bearerToken: auth.getToken };
}

function selectMetric(id: string): void {
  metricId.value = id;
  const selected = props.catalog?.metrics.find((item) => item.id === id);
  chartForm.value = selected?.chart_forms[0]?.id ?? "";
  groupBy.value = NONE;
  filterValues.value = {};
}

function startNew(): void {
  openFigureId.value = null;
  name.value = "";
  chosenVersion.value = NONE;
  selectMetric(props.catalog?.metrics[0]?.id ?? "");
}

function applyDefinition(figureDefinition: FigureDefinition): void {
  metricId.value = figureDefinition.metric;
  chartForm.value = figureDefinition.chart_form;
  groupBy.value = figureDefinition.group_by ?? NONE;
  filterValues.value = { ...figureDefinition.filters };
}

function openFigure(figure: Figure): void {
  openFigureId.value = figure.id;
  name.value = figure.name;
  chosenVersion.value =
    figure.metric_version == null ? NONE : String(figure.metric_version);
  applyDefinition(figure.definition);
}

/** A result block's definition, as a new unsaved Figure. */
function startFromBlock(figureDefinition: FigureDefinition): void {
  openFigureId.value = null;
  name.value = "";
  chosenVersion.value = NONE;
  applyDefinition(figureDefinition);
}

async function refreshPreview(): Promise<void> {
  const context = requestContext();
  if (!context || !definition.value) return;
  const request = ++previewRequest;
  previewLoading.value = true;
  try {
    const scope = {
      ...context,
      experimentId: props.experimentId,
      handleBusinessErrors: true,
    };
    const response =
      tiedVersion.value !== null && openFigureId.value
        ? await experimentsRepository.getFigureData({
            ...scope,
            figureId: openFigureId.value,
          })
        : await experimentsRepository.computeFigureData({
            ...scope,
            data: { definition: definition.value },
          });
    if (request === previewRequest) preview.value = response.data;
  } catch {
    if (request === previewRequest) {
      preview.value = null;
      errorToast("Failed to compute the Figure");
    }
  } finally {
    if (request === previewRequest) previewLoading.value = false;
  }
}

async function loadFigures(): Promise<void> {
  const context = requestContext();
  if (!context) return;
  try {
    const response = await experimentsRepository.getFigures({
      ...context,
      experimentId: props.experimentId,
      handleBusinessErrors: true,
    });
    figures.value = response.data;
  } catch {
    errorToast("Failed to load the Figures");
  }
}

function versionErrorMessage(err: unknown, fallback: string): string {
  return err instanceof BusinessLogicError &&
    err.error_code === APIErrors.FigureVersionNotCurrent
    ? "This version came from older metric code, so this Figure cannot be computed for it"
    : fallback;
}

/** The only way a Figure changes version: the explicit Move button. */
async function moveToChosenVersion(): Promise<void> {
  const context = requestContext();
  if (!context || !openFigureId.value || moving.value) return;
  moving.value = true;
  const version =
    chosenVersion.value === NONE ? null : Number(chosenVersion.value);
  try {
    await experimentsRepository.moveFigureToVersion({
      ...context,
      experimentId: props.experimentId,
      figureId: openFigureId.value,
      data: { metric_version: version },
      handleBusinessErrors: true,
    });
    successToast(
      version === null
        ? "Figure returned to a draft"
        : `Figure moved to version ${version}`,
    );
    await loadFigures();
  } catch (err) {
    errorToast(versionErrorMessage(err, "Failed to move the Figure"));
  } finally {
    moving.value = false;
  }
}

async function saveFigure(): Promise<void> {
  const context = requestContext();
  if (!context || !definition.value || !canSave.value || saving.value) return;
  saving.value = true;
  const data = { name: name.value.trim(), definition: definition.value };
  try {
    if (openFigureId.value) {
      await experimentsRepository.updateFigure({
        ...context,
        experimentId: props.experimentId,
        figureId: openFigureId.value,
        data,
        handleBusinessErrors: true,
      });
    } else {
      const created = await experimentsRepository.createFigure({
        ...context,
        experimentId: props.experimentId,
        data,
        handleBusinessErrors: true,
      });
      openFigureId.value = created.id;
    }
    successToast("Figure saved");
    await loadFigures();
  } catch (err) {
    errorToast(versionErrorMessage(err, "Failed to save the Figure"));
  } finally {
    saving.value = false;
  }
}

async function deleteFigure(figureId: string): Promise<void> {
  const context = requestContext();
  if (!context) return;
  try {
    await experimentsRepository.deleteFigure({
      ...context,
      experimentId: props.experimentId,
      figureId,
      handleBusinessErrors: true,
    });
    if (openFigureId.value === figureId) startNew();
    successToast("Figure deleted");
    await loadFigures();
  } catch {
    errorToast("Failed to delete the Figure");
  } finally {
    confirmingDelete.value = null;
  }
}

// A choice the new chart form does not allow must not linger
watch(form, () => {
  if (!groupOptions.value.some((item) => item.id === groupBy.value)) {
    groupBy.value = NONE;
  }
  for (const id of Object.keys(filterValues.value)) {
    if (!filterOptions.value.some((item) => item.id === id)) {
      delete filterValues.value[id];
    }
  }
});

watch([definition, tiedVersion], () => void refreshPreview());

// Runs last so the preview watcher sees the first definition
watch(
  () => [props.catalog, props.openRequest] as const,
  ([catalog, request]) => {
    if (!catalog) return;
    if (request) startFromBlock(request);
    else startNew();
  },
  { immediate: true },
);

onMounted(() => void loadFigures());
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="figures">
    <div class="space-y-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div v-if="catalog" class="space-y-4">
          <div class="space-y-2">
            <Label>Metric</Label>
            <Select
              :model-value="metricId"
              data-testid="figure-metric"
              @update:model-value="selectMetric(String($event))"
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="item in catalog.metrics"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <template v-if="metric">
            <div class="space-y-2">
              <Label>Chart form</Label>
              <Select v-model="chartForm" data-testid="figure-chart-form">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="item in metric.chart_forms"
                    :key="item.id"
                    :value="item.id"
                  >
                    {{ item.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="groupOptions.length > 0" class="space-y-2">
              <Label>Group by</Label>
              <Select v-model="groupBy" data-testid="figure-group-by">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem :value="NONE">No grouping</SelectItem>
                  <SelectItem
                    v-for="group in groupOptions"
                    :key="group.id"
                    :value="group.id"
                  >
                    {{ group.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              v-for="filter in filterOptions"
              :key="filter.id"
              class="space-y-2"
            >
              <Label>{{ filter.label }}</Label>
              <template v-if="filter.kind === 'date_range'">
                <div class="flex gap-2">
                  <Input
                    type="date"
                    aria-label="From"
                    :model-value="rangeEnd(filter.id, 0)"
                    :data-testid="`figure-date-from-${filter.id}`"
                    @update:model-value="
                      setRangeEnd(filter.id, 0, String($event))
                    "
                  />
                  <Input
                    type="date"
                    aria-label="To"
                    :model-value="rangeEnd(filter.id, 1)"
                    :data-testid="`figure-date-to-${filter.id}`"
                    @update:model-value="
                      setRangeEnd(filter.id, 1, String($event))
                    "
                  />
                </div>
                <p
                  v-if="isReversedRange(filter)"
                  class="text-sm text-red-600"
                  data-testid="figure-date-error"
                >
                  The start date must not be after the end date.
                </p>
              </template>
              <Select
                v-else
                :model-value="filterValues[filter.id] ?? NONE"
                :data-testid="`figure-filter-${filter.id}`"
                @update:model-value="filterValues[filter.id] = String($event)"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem :value="NONE">No filter</SelectItem>
                  <SelectItem
                    v-for="option in filter.options"
                    :key="option.id"
                    :value="option.id"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </template>

          <div class="space-y-2">
            <Label for="figure-name">Name</Label>
            <Input
              id="figure-name"
              v-model="name"
              maxlength="100"
              data-testid="figure-name"
            />
          </div>

          <div
            v-if="openFigureId && publishedVersions.length > 0"
            class="space-y-2"
          >
            <Label>Published results version</Label>
            <Select v-model="chosenVersion" data-testid="figure-version">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem :value="NONE">Draft, not tied</SelectItem>
                <SelectItem
                  v-for="version in publishedVersions"
                  :key="version.metric_version"
                  :value="String(version.metric_version)"
                >
                  Version {{ version.metric_version }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              :disabled="moving"
              data-testid="figure-move"
              @click="moveToChosenVersion"
            >
              Move Figure to this version
            </Button>
            <p class="text-xs text-gray-500">
              A tied Figure keeps its numbers until you move it.
            </p>
          </div>

          <div class="flex gap-2">
            <Button
              :disabled="!canSave || saving"
              data-testid="figure-save"
              @click="saveFigure"
            >
              Save
            </Button>
            <Button
              v-if="openFigureId"
              variant="outline"
              data-testid="figure-new"
              @click="startNew"
            >
              New Figure
            </Button>
          </div>
        </div>
      </div>

      <ul class="space-y-2" data-testid="figure-list">
        <li
          v-for="figure in figures"
          :key="figure.id"
          class="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-2"
          data-testid="figure-item"
        >
          <span class="text-sm font-medium text-gray-900 truncate">
            {{ figure.name }}
            <span
              v-if="figure.metric_version != null"
              class="text-xs font-normal text-gray-500"
              data-testid="figure-tied"
            >
              (version {{ figure.metric_version }})
            </span>
          </span>
          <span class="flex gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              data-testid="figure-open"
              @click="openFigure(figure)"
            >
              Open
            </Button>
            <Button
              v-if="confirmingDelete !== figure.id"
              variant="outline"
              size="sm"
              data-testid="figure-delete"
              @click="confirmingDelete = figure.id"
            >
              Delete
            </Button>
            <Button
              v-else
              variant="destructive"
              size="sm"
              data-testid="figure-delete-confirm"
              @click="deleteFigure(figure.id)"
            >
              Confirm
            </Button>
          </span>
        </li>
      </ul>
    </div>

    <div
      class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4"
      data-testid="figure-preview"
    >
      <template v-if="preview && preview.labels.length > 0">
        <h3 class="font-semibold text-gray-900 mb-2">
          {{ metric?.label }}
        </h3>
        <ChartExport
          :name="exportName"
          :data="plotted"
          :caption="figureCaption"
        >
          <FigureStepChart
            v-if="censoredAt"
            :labels="preview.labels"
            :series="stepSeries"
            :caption="`${metric?.label}: ${preview.y_title} by ${preview.x_title}`"
            :x-title="preview.x_title"
          />
          <FigureBarChart
            v-else-if="form?.mark === 'bar'"
            :labels="preview.labels"
            :series="chartSeries"
            :y-max="yMax"
            :format-y="formatNumber"
            :describe="describePoint"
            :caption="`${metric?.label}: ${preview.y_title} per ${preview.x_title}`"
            :x-title="preview.x_title"
          />
          <GridLineChart
            v-else
            :labels="preview.labels"
            :series="chartSeries"
            :y-max="yMax"
            :format-y="formatNumber"
            :describe="describePoint"
            :caption="`${metric?.label}: ${preview.y_title} per ${preview.x_title}`"
            :x-title="preview.x_title"
            :points-only="form?.mark === 'point'"
          />
        </ChartExport>
        <p v-if="censoredAt" class="text-sm text-gray-600 mt-2">
          {{ preview.y_title }}, with 95% confidence bands. Open exposures are
          censored at HEAD ({{ censoredAt }}).
        </p>
        <p v-if="hasErrorBars" class="text-sm text-gray-600 mt-2">
          Error bars show the 95% Wilson interval of each share, in the axis's
          units.
        </p>
      </template>
      <ExperimentLoadProgress
        v-else-if="previewLoading"
        :experiment-id="experimentId"
        data-testid="figure-preview-loading"
      />
      <p v-else class="text-sm text-gray-600">No data to plot yet.</p>
    </div>
  </div>
</template>
