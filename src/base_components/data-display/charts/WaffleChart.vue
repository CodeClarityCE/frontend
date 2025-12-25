<script lang="ts">
/* eslint-disable import/order */
import * as d3 from 'd3';
import { interpolateColors } from '@/base_components/data-display/charts/colors-waffle';
import Button from '@/shadcn/ui/button/Button.vue';
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogScrollContent,
    DialogTitle,
    DialogTrigger
} from '@/shadcn/ui/dialog';
/* eslint-enable import/order */
export interface WaffleChartEntry {
    label: string;
    value: number;
    color?: string;
}

interface WaffleChartEntryNormalized {
    label: string;
    value: number;
    sourceValue: number;
    color: string;
}

interface Square {
    data: WaffleChartEntryNormalized;
    group: string;
}
</script>
<script setup lang="ts">
import { onMounted, onUnmounted, ref, type Ref } from 'vue';
// Props
const props = defineProps<{
    data: WaffleChartEntry[];
    sourcePercentual: boolean;
    outputPercentual: boolean;
    // https://observablehq.com/@d3/color-schemes
    // https://d3js.org/d3-interpolate/color
    colorScale?: (a: number) => string;
}>();

const squares: Ref<Square[]> = ref([]);
const nmbOfSquares = ref(100);
const groupToAnimate: Ref<string | undefined> = ref();
const waffleEntries: Ref<WaffleChartEntryNormalized[]> = ref([]);
const truncatedOthers: Ref<WaffleChartEntryNormalized[]> = ref([]);
const chartContainer: Ref<HTMLElement | null> = ref(null);
const squareSize = ref(25);
const gridCols = ref(10);

/**
 * Check if square size and rows are valid for creating grid
 */
function isValidGridConfiguration(_squareSizeForWidth: number, rows: number, totalSquares: number): boolean {
    if (rows < 5) return false;
    if (totalSquares < 50 || totalSquares > 300) return false;
    return true;
}

/**
 * Calculate responsive dimensions based on container size
 */
function calculateResponsiveDimensions(): void {
    if (!chartContainer.value) return;

    const containerRect = chartContainer.value.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // If we don't have meaningful dimensions, use defaults
    if (containerWidth < 200 || containerHeight < 150) {
        gridCols.value = 10;
        squareSize.value = 25;
        nmbOfSquares.value = 100;
        return;
    }

    // Reserve space for legend (approximately 200px width)
    const chartAreaWidth = Math.max(containerWidth - 200, 200);
    const chartAreaHeight = containerHeight - 10; // Minimal margin to use more space

    // Calculate square size that maximizes chart usage of available space
    const targetSquareSize = 25;
    const padding = 0;

    // Try different column counts to find best fit
    let bestCols = 10;
    let bestRows = 10;
    let bestSquareSize = targetSquareSize;

    for (let cols = 8; cols <= 20; cols++) {
        const squareSizeForWidth = (chartAreaWidth - (cols - 1) * padding) / cols;

        if (squareSizeForWidth >= 15 && squareSizeForWidth <= 40) {
            const rows = Math.floor(chartAreaHeight / squareSizeForWidth);
            const totalSquares = cols * rows;

            if (isValidGridConfiguration(squareSizeForWidth, rows, totalSquares)) {
                bestCols = cols;
                bestRows = rows;
                bestSquareSize = Math.floor(squareSizeForWidth);
            }
        }
    }

    gridCols.value = bestCols;
    squareSize.value = bestSquareSize;
    nmbOfSquares.value = bestCols * bestRows;
}

/**
 * Creates the internal data structure for the waffle chart from the data passed in by the user
 */
function createData(): void {
    truncatedOthers.value = [];
    squares.value = [];

    const colorScale = props.colorScale ?? d3.interpolateDiscrete([
        '#003532',
        '#1A4876',
        '#008491',
        '#40E0D0',
        '#D3D3D3'
    ]);
    if (props.data.length === 0) return;

    const colorsDefinedInData = props.data.every((entry) => entry.color !== undefined);

    // "Normalize" the data
    // Each group has a value from 0.0 to 1.0
    const normalizedData: WaffleChartEntryNormalized[] = [];
    if (props.sourcePercentual) {
        // In case the data passed in is percentual we divide it by 100
        let i = 0;
        for (const entry of props.data) {
            const color = entry.color;
            normalizedData.push({
                label: entry.label,
                value: entry.value / 100,
                sourceValue: entry.value,
                color: color!
            });
            i++;
        }
    } else {
        // In case the data passed in is not percentual we make it percentual
        let sum = 0;
        for (const entry of props.data) {
            sum += entry.value;
        }
        let i = 0;
        for (const entry of props.data) {
            const color = entry.color;
            normalizedData.push({
                label: entry.label,
                value: entry.value / sum,
                sourceValue: entry.value,
                color: color!
            });
            i++;
        }
    }

    // Sort in descending order, bigger groups should be rendered first
    normalizedData.sort((a, b) => b.value - a.value);
    const [dataForLegend, othersEntries] = createSquares(normalizedData);

    if (!colorsDefinedInData) {
        let colors = interpolateColors(dataForLegend.length, colorScale, {
            colorStart: 0,
            colorEnd: 1.0,
            useEndAsStart: false
        });
        let i = 0;
        for (const entry of [...dataForLegend]) {
            entry.color = colors[i] ?? '#000000';
            i++;
        }

        // Use theme-appropriate colors for "Others" entries, avoiding light colors
        colors = interpolateColors(othersEntries.length, colorScale, {
            colorStart: 0.2,
            colorEnd: 0.8,
            useEndAsStart: false
        });

        for (let i = 0; i < othersEntries.length; i++) {
            const entry = othersEntries[i];
            if (entry) {
                entry.color = colors[i] ?? '#000000';
            }
        }
    }

    truncatedOthers.value = othersEntries;
    waffleEntries.value = dataForLegend;
}

/**
 * Computes the squares from the data
 * @param normalizedData
 */
function createSquares(
    normalizedData: WaffleChartEntryNormalized[]
): [WaffleChartEntryNormalized[], WaffleChartEntryNormalized[]] {
    // Create the squares
    let nmbSquaresCreated = 0;
    const othersData: WaffleChartEntryNormalized = {
        label: 'Others',
        value: 0.0,
        sourceValue: 0.0,
        color: 'teal'
    };
    let othersEntries: WaffleChartEntryNormalized[] = [];

    let indicesToRemove: number[] = [];
    let i = 0;
    for (const entry of normalizedData) {
        // A value less than 1% is not shown in the waffle chart
        // It is shown in the legend though
        if (entry.value < 0.01) {
            othersData.value += entry.value;
            othersData.sourceValue += entry.sourceValue;
            othersEntries.push(entry);
            indicesToRemove.push(i);
        } else {
            for (
                let i = 0;
                i < Math.round(Number.parseFloat(entry.value.toPrecision(2)) * nmbOfSquares.value);
                i++
            ) {
                squares.value.push({ data: entry, group: entry.label });
                nmbSquaresCreated++;
            }
        }
        i++;
    }

    if (othersEntries.length === normalizedData.length) {
        indicesToRemove = [];
        othersEntries = [];
        for (const entry of normalizedData) {
            for (
                let i = 0;
                i < Math.round(Number.parseFloat(entry.value.toPrecision(2)) * nmbOfSquares.value);
                i++
            ) {
                squares.value.push({ data: entry, group: entry.label });
                nmbSquaresCreated++;
            }
        }
    }

    if (othersData) {
        for (let i = nmbOfSquares.value - nmbSquaresCreated; i > 0; i--) {
            squares.value.push({ data: othersData, group: 'Others' });
        }
    }

    const cleanedData = normalizedData.filter((_, index) => {
        return !indicesToRemove.includes(index);
    });

    cleanedData.push(othersData);

    return [cleanedData, othersEntries];
}

function animateGroup(group: string): void {
    groupToAnimate.value = group;
}

function stopAnimateGroup(): void {
    groupToAnimate.value = undefined;
}

function styleSelected(group: string): string {
    if (groupToAnimate.value === undefined) return 'none';
    else {
        if (groupToAnimate.value === group) return 'none';
        else return 'opacity(25%)';
    }
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
    // Small delay to ensure DOM is fully rendered
    setTimeout(() => {
        if (chartContainer.value) {
            calculateResponsiveDimensions();
            createData();

            // Set up resize observer
            resizeObserver = new ResizeObserver(() => {
                calculateResponsiveDimensions();
                createData();
            });
            resizeObserver.observe(chartContainer.value);
        }
    }, 100);
});

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
});

// Initial data creation for cases where container isn't ready yet
createData();
</script>
<template>
    <div ref="chartContainer" class="flex flex-row gap-8 justify-center items-start h-full w-full">
        <!-- Waffle chart -->
        <div class="grid gap-0" :style="{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }">
            <div
                v-for="(square, index) in squares"
                :key="index"
                :style="{
                    width: squareSize + 'px',
                    height: squareSize + 'px',
                    padding: '2.5px',
                    filter: styleSelected(square.group)
                }"
                @mouseover="animateGroup(square.group)"
                @mouseleave="stopAnimateGroup()"
            >
                <div
                    style="background-color: gray; width: 100%; height: 100%; border-radius: 5px"
                    :style="{ backgroundColor: square.data.color }"
                ></div>
            </div>
        </div>
        <!-- Waffle legend -->
        <div class="flex flex-col gap-2 w-fit">
            <div class="font-bold text-xl">Legend</div>
            <div class="flex-column flex-column-10 overflow-y-auto max-h-80">
                <div v-for="(value, index) in waffleEntries" :key="index">
                    <div class="flex flex-row gap-2 items-center">
                        <div
                            style="border-radius: 50%; width: 10px; height: 10px; flex-shrink: 0"
                            :style="{
                                backgroundColor: value.color,
                                filter: styleSelected(value.label)
                            }"
                        ></div>
                        <div
                            class="flex flex-row gap-2 justify-between max-w-52"
                            :style="{ filter: styleSelected(value.label) }"
                        >
                            <div class="text-[#3e3e3e]">{{ value.label }}</div>
                            <div class="font-bold" :style="{ color: value.color }">
                                <template v-if="props.outputPercentual">
                                    {{ (value.value * 100).toFixed(2) }}%
                                </template>
                                <template v-else>
                                    {{ value.value.toFixed(0) }}
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-if="truncatedOthers.length > 0"
                class="flex flex-row"
                style="justify-content: start"
            >
                <Dialog>
                    <DialogTrigger as-child>
                        <Button variant="outline">See others</Button>
                    </DialogTrigger>
                    <DialogScrollContent class="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                            <DialogTitle>Other Licenses</DialogTitle>
                            <DialogDescription>
                                The following list shows those licenses that were grouped under
                                'Others'.
                            </DialogDescription>
                        </DialogHeader>
                        <div class="mt-6 space-y-3">
                            <div v-for="(value, index) in truncatedOthers" :key="index">
                                <div
                                    class="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                >
                                    <div
                                        class="rounded-full w-3 h-3 flex-shrink-0"
                                        :style="{ backgroundColor: value.color }"
                                    ></div>
                                    <div class="flex justify-between items-center w-full">
                                        <div class="text-foreground font-medium">
                                            {{ value.label }}
                                        </div>
                                        <div class="text-sm text-muted-foreground">
                                            {{ (value.value * 100).toFixed(2) }}% ({{
                                                value.sourceValue
                                            }})
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogScrollContent>
                </Dialog>
            </div>
        </div>
    </div>
</template>
