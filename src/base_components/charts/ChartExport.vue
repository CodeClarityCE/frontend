<script setup lang="ts">
import { computed, inject, nextTick, provide, ref, useId } from "vue";

import { saveBlob } from "@/utils/download";
import { svgToPdf } from "@/utils/svg-pdf";
import { loadPdfFonts } from "@/utils/svg-pdf/load-fonts";
import { errorToast } from "@/utils/toasts";

import {
  captionText,
  type ChartCaption,
  PAGE_EXCLUSIONS,
  RESULT_MARKS,
} from "./chart-caption";
import {
  type ChartData,
  chartDataCsv,
  chartPng,
  EXPORT_PRESETS,
  type ExportPreset,
  type StandaloneChart,
  standaloneChart,
} from "./chart-export";
import { CHART_WIDTH } from "./chart-format";
import { CHART_LAYOUT_WIDTH } from "./chart-layout";

const props = defineProps<{
  /** File name without its extension */
  name: string;
  /** The values drawn in the chart */
  data: ChartData;
  /** What the generated caption states */
  caption: ChartCaption;
}>();

const content = ref<HTMLElement | null>(null);
const captionId = useId();
const preset = ref<ExportPreset>("double");
const pageExclusions = inject(PAGE_EXCLUSIONS, ref([]));
const marks = inject(RESULT_MARKS, ref({}));
const caption = computed(() => ({ ...marks.value, ...props.caption }));
const text = computed(() => captionText(caption.value, pageExclusions.value));

const layoutWidth = ref(CHART_WIDTH);
provide(CHART_LAYOUT_WIDTH, layoutWidth);

/** Redraws the chart at the preset's width, reads it, and puts it back. */
async function assemble(): Promise<StandaloneChart | null> {
  if (!content.value) return null;
  layoutWidth.value = EXPORT_PRESETS[preset.value].layoutWidth;
  await nextTick();
  try {
    return standaloneChart(content.value, preset.value, caption.value);
  } finally {
    layoutWidth.value = CHART_WIDTH;
  }
}

async function downloadSvg(): Promise<void> {
  const chart = await assemble();
  if (!chart) return;
  saveBlob(
    new Blob([chart.svg], { type: "image/svg+xml;charset=utf-8" }),
    `${props.name}.svg`,
  );
}

async function downloadPng(): Promise<void> {
  const chart = await assemble();
  if (!chart) return;
  try {
    saveBlob(await chartPng(chart), `${props.name}.png`);
  } catch {
    errorToast("Could not export the chart as PNG");
  }
}

async function downloadPdf(): Promise<void> {
  const chart = await assemble();
  if (!chart) return;
  try {
    const pdf = await svgToPdf(chart.svg, await loadPdfFonts());
    saveBlob(
      new Blob([pdf as BlobPart], { type: "application/pdf" }),
      `${props.name}.pdf`,
    );
  } catch {
    errorToast("Could not export the chart as PDF");
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

const BUTTON =
  "rounded-sm text-xs text-muted-foreground underline hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
</script>

<template>
  <div>
    <!-- The caption names the chart for screen readers -->
    <figure :aria-labelledby="captionId">
      <div ref="content">
        <slot />
      </div>
      <figcaption
        :id="captionId"
        data-testid="export-caption"
        class="text-xs text-muted-foreground mt-1"
      >
        {{ text }}
      </figcaption>
    </figure>
    <div class="flex flex-wrap items-center gap-2 mt-1">
      <label class="text-xs text-muted-foreground">
        Width
        <select
          v-model="preset"
          data-testid="export-preset"
          class="text-xs border border-input rounded-control bg-background text-foreground"
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
        data-testid="export-pdf"
        :class="BUTTON"
        @click="downloadPdf"
      >
        Download PDF
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
