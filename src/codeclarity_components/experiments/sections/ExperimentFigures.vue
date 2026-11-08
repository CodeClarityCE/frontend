<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

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
import { errorToast, successToast } from "@/utils/toasts";

import {
  formatNumber,
  type GridLineSeries,
  type StepSeries,
} from "../charts/chart-format";
import FigureStepChart from "../charts/FigureStepChart.vue";
import GridLineChart from "../charts/GridLineChart.vue";
import type {
  Figure,
  FigureCatalog,
  FigureData,
  FigureDefinition,
  FigureMetric,
} from "../experiment-figure.entity";
import { ExperimentsRepository } from "../experiments.repository";

const props = defineProps<{ experimentId: string }>();

/** A select's value for "nothing chosen": Select items cannot be empty */
const NONE = "none";

/** Severities in colour-slot order, so a class keeps its colour */
const SEVERITY_SLOTS = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"];

const userStore = useUserStore();
const auth = useAuthStore();
const experimentsRepository = new ExperimentsRepository();

const catalog = ref<FigureCatalog | null>(null);
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
/** Only the newest preview request may fill the chart */
let previewRequest = 0;

const metric = computed<FigureMetric | null>(
  () =>
    catalog.value?.metrics.find((item) => item.id === metricId.value) ?? null,
);

const definition = computed<FigureDefinition | null>(() => {
  if (!metric.value) return null;
  const filters: Record<string, string> = {};
  for (const filter of metric.value.filters) {
    const value = filterValues.value[filter.id];
    if (value && value !== NONE) filters[filter.id] = value;
  }
  return {
    metric: metric.value.id,
    chart_form: chartForm.value,
    group_by: groupBy.value === NONE ? null : groupBy.value,
    filters,
  };
});

const canSave = computed(
  () => name.value.trim().length > 0 && definition.value !== null,
);

const chartSeries = computed<GridLineSeries[]>(() =>
  (preview.value?.series ?? []).map((series, index) => ({
    ...series,
    color: `var(--viz-series-${index + 1})`,
  })),
);

/** Only survival Figures carry a censoring date. */
const censoredAt = computed(() => preview.value?.censored_at ?? null);

const stepSeries = computed<StepSeries[]>(() =>
  (preview.value?.series ?? []).map((series, index) => {
    const slot = SEVERITY_SLOTS.indexOf(series.key);
    return {
      ...series,
      color: `var(--viz-series-${(slot === -1 ? index : slot) + 1})`,
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
      series.values.filter((value) => value !== null),
    ),
  ),
);

function describePoint(index: number): string {
  const values = (preview.value?.series ?? [])
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
  const selected = catalog.value?.metrics.find((item) => item.id === id);
  chartForm.value = selected?.chart_forms[0]?.id ?? "";
  groupBy.value = NONE;
  filterValues.value = {};
}

function startNew(): void {
  openFigureId.value = null;
  name.value = "";
  selectMetric(catalog.value?.metrics[0]?.id ?? "");
}

function openFigure(figure: Figure): void {
  openFigureId.value = figure.id;
  name.value = figure.name;
  metricId.value = figure.definition.metric;
  chartForm.value = figure.definition.chart_form;
  groupBy.value = figure.definition.group_by ?? NONE;
  filterValues.value = { ...figure.definition.filters };
}

async function refreshPreview(): Promise<void> {
  const context = requestContext();
  if (!context || !definition.value) return;
  const request = ++previewRequest;
  try {
    const response = await experimentsRepository.computeFigureData({
      ...context,
      experimentId: props.experimentId,
      data: { definition: definition.value },
      handleBusinessErrors: true,
    });
    if (request === previewRequest) preview.value = response.data;
  } catch {
    if (request === previewRequest) {
      preview.value = null;
      errorToast("Failed to compute the Figure");
    }
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

async function loadCatalog(): Promise<void> {
  const context = requestContext();
  if (!context) return;
  try {
    const response = await experimentsRepository.getFigureCatalog({
      ...context,
      experimentId: props.experimentId,
      handleBusinessErrors: true,
    });
    catalog.value = response.data;
    startNew();
  } catch {
    errorToast("Failed to load the Figure catalog");
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
  } catch {
    errorToast("Failed to save the Figure");
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

watch(definition, () => void refreshPreview());

onMounted(() => {
  void loadCatalog();
  void loadFigures();
});
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
                    v-for="form in metric.chart_forms"
                    :key="form.id"
                    :value="form.id"
                  >
                    {{ form.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="metric.group_by.length > 0" class="space-y-2">
              <Label>Group by</Label>
              <Select v-model="groupBy" data-testid="figure-group-by">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem :value="NONE">No grouping</SelectItem>
                  <SelectItem
                    v-for="group in metric.group_by"
                    :key="group.id"
                    :value="group.id"
                  >
                    {{ group.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              v-for="filter in metric.filters"
              :key="filter.id"
              class="space-y-2"
            >
              <Label>{{ filter.label }}</Label>
              <Select
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
        <template v-if="censoredAt">
          <FigureStepChart
            :labels="preview.labels"
            :series="stepSeries"
            :caption="`${metric?.label}: ${preview.y_title} by ${preview.x_title}`"
            :x-title="preview.x_title"
          />
          <p class="text-sm text-gray-600 mt-2">
            {{ preview.y_title }}, with 95% confidence bands. Open exposures are
            censored at HEAD ({{ censoredAt }}).
          </p>
        </template>
        <GridLineChart
          v-else
          :labels="preview.labels"
          :series="chartSeries"
          :y-max="yMax"
          :format-y="formatNumber"
          :describe="describePoint"
          :caption="`${metric?.label}: ${preview.y_title} per ${preview.x_title}`"
          :x-title="preview.x_title"
        />
      </template>
      <p v-else class="text-sm text-gray-600">No data to plot yet.</p>
    </div>
  </div>
</template>
