<script setup lang="ts">
import { computed, inject, nextTick, provide, ref } from "vue";

import { saveBlob } from "@/utils/download";
import { errorToast } from "@/utils/toasts";

import {
  captionText,
  type FigureCaption,
  SNAPSHOT_COVERAGE,
} from "./chart-caption";
import {
  type ChartData,
  chartDataCsv,
  EXPORT_PRESETS,
  type ExportPreset,
  figurePng,
  type StandaloneFigure,
  standaloneFigure,
} from "./chart-export";
import { CHART_WIDTH } from "./chart-format";
import { CHART_LAYOUT_WIDTH } from "./chart-layout";

const props = defineProps<{
  /** File name without its extension */
  name: string;
  /** The values drawn in the chart */
  data: ChartData;
  /** What the generated caption states */
  caption: FigureCaption;
}>();

const content = ref<HTMLElement | null>(null);
const preset = ref<ExportPreset>("double");
const coverage = inject(SNAPSHOT_COVERAGE, ref([]));
const text = computed(() => captionText(props.caption, coverage.value));

const layoutWidth = ref(CHART_WIDTH);
provide(CHART_LAYOUT_WIDTH, layoutWidth);

/** Redraws the chart at the preset's width, reads it, and puts it back. */
async function assemble(): Promise<StandaloneFigure | null> {
  if (!content.value) return null;
  layoutWidth.value = EXPORT_PRESETS[preset.value].layoutWidth;
  await nextTick();
  try {
    return standaloneFigure(content.value, preset.value, props.caption);
  } finally {
    layoutWidth.value = CHART_WIDTH;
  }
}

async function downloadSvg(): Promise<void> {
  const figure = await assemble();
  if (!figure) return;
  saveBlob(
    new Blob([figure.svg], { type: "image/svg+xml;charset=utf-8" }),
    `${props.name}.svg`,
  );
}

async function downloadPng(): Promise<void> {
  const figure = await assemble();
  if (!figure) return;
  try {
    saveBlob(await figurePng(figure), `${props.name}.png`);
  } catch {
    errorToast("Could not export the chart as PNG");
  }
}

function downloadCsv(): void {
  saveBlob(
    new Blob([chartDataCsv(props.data)], { type: "text/csv;charset=utf-8" }),
    `${props.name}.csv`,
  );
}

function downloadCaption(): void {
  saveBlob(
    new Blob([text.value], { type: "text/plain;charset=utf-8" }),
    `${props.name}-caption.txt`,
  );
}

const BUTTON = "text-xs text-gray-500 hover:text-gray-900 underline";
</script>

<template>
  <div>
    <div ref="content">
      <slot />
    </div>
    <p data-testid="export-caption" class="text-xs text-gray-500 mt-1">
      {{ text }}
    </p>
    <div class="flex flex-wrap items-center gap-2 mt-1">
      <label class="text-xs text-gray-500">
        Width
        <select
          v-model="preset"
          data-testid="export-preset"
          class="text-xs border border-gray-200 rounded"
        >
          <option
            v-for="(option, key) in EXPORT_PRESETS"
            :key="key"
            :value="key"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
      <button
        type="button"
        data-testid="export-svg"
        :class="BUTTON"
        @click="downloadSvg"
      >
        Download SVG
      </button>
      <button
        type="button"
        data-testid="export-png"
        :class="BUTTON"
        @click="downloadPng"
      >
        Download PNG (300 dpi)
      </button>
      <button
        type="button"
        data-testid="export-csv"
        :class="BUTTON"
        @click="downloadCsv"
      >
        Download data (CSV)
      </button>
      <button
        type="button"
        data-testid="export-caption-file"
        :class="BUTTON"
        @click="downloadCaption"
      >
        Download caption
      </button>
    </div>
  </div>
</template>
