<script lang="ts">
import * as d3 from 'd3';
import { interpolateColors } from '@/utils/colors';
import CenteredModal from '../CenteredModal.vue';
import { Icon } from '@iconify/vue';
import NormalButton from '../buttons/NormalButton.vue';
import BlueButton from '../buttons/BlueButton.vue';

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
import { ref, type Ref } from 'vue';

// Props
const props = defineProps<{
    data: WaffleChartEntry[];
    sourcePercentual: boolean;
    outputPercentual: boolean;
    // https://observablehq.com/@d3/color-schemes
    // https://d3js.org/d3-interpolate/color
    colorScale?: (a: number) => string;
}>();

const squares: Square[] = [];
const nmbOfSquares = 100;
const groupToAnimate: Ref<string | undefined> = ref();
const waffleEntries: Ref<WaffleChartEntryNormalized[]> = ref([]);
const truncatedOthers: Ref<WaffleChartEntryNormalized[]> = ref([]);
const allLicensesModalRef: Ref<typeof CenteredModal> = ref(CenteredModal);

/**
 * Creates the internal data structure for the waffle chart from the data passed in by the user
 */
function createData() {
    truncatedOthers.value = [];

    let colorScale = props.colorScale;
    if (!colorScale)
        colorScale = d3.interpolateDiscrete([
            '#008491',
            '#023f47',
            '#175181',
            '#0b9749',
            '#35cb36',
            '#c3f166',
            '#c2f79a'
        ]);
    if (props.data.length == 0) return;

    const colorsDefinedInData = props.data.every((entry) => entry.color != undefined);

    // "Normalize" the data
    // Each group has a value from 0.0 to 1.0
    let normalizedData: WaffleChartEntryNormalized[] = [];
    if (props.sourcePercentual) {
        // In case the data passed in is percentual we divide it by 100
        let i = 0;
        for (let entry of props.data) {
            let color = entry.color;
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
        for (let entry of props.data) {
            sum += entry.value;
        }
        let i = 0;
        for (let entry of props.data) {
            let color = entry.color;
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
    let [dataForLegend, othersEntries] = createSquares(normalizedData);

    if (!colorsDefinedInData) {
        let colors = interpolateColors(dataForLegend.length, colorScale, {
            colorStart: 0,
            colorEnd: 1.0,
            useEndAsStart: false
        });
        let i = 0;
        for (const entry of [...dataForLegend]) {
            entry.color = colors[i];
            i++;
        }

        colors = interpolateColors(normalizedData.length, d3.interpolateWarm, {
            colorStart: 0.0,
            colorEnd: 1.0,
            useEndAsStart: false
        });

        let baseIndex = dataForLegend.length - 1;
        for (let i = baseIndex; i < normalizedData.length; i++) {
            othersEntries[i - baseIndex].color = colors[i - baseIndex];
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
    let othersData: WaffleChartEntryNormalized = {
        label: 'Others',
        value: 0.0,
        sourceValue: 0.0,
        color: 'teal'
    };
    let othersEntries: WaffleChartEntryNormalized[] = [];

    let indicesToRemove: number[] = [];
    let i = 0;
    for (let entry of normalizedData) {
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
                i < Math.round(Number.parseFloat(entry.value.toPrecision(2)) * nmbOfSquares);
                i++
            ) {
                squares.push({ data: entry, group: entry.label });
                nmbSquaresCreated++;
            }
        }
        i++;
    }

    if (othersEntries.length == normalizedData.length) {
        indicesToRemove = [];
        othersEntries = [];
        for (let entry of normalizedData) {
            for (
                let i = 0;
                i < Math.round(Number.parseFloat(entry.value.toPrecision(2)) * nmbOfSquares);
                i++
            ) {
                squares.push({ data: entry, group: entry.label });
                nmbSquaresCreated++;
            }
        }
    }

    if (othersData) {
        for (let i = nmbOfSquares - nmbSquaresCreated; i > 0; i--) {
            squares.push({ data: othersData, group: 'Others' });
        }
    }

    const cleanedData = normalizedData.filter((val, index) => {
        return !indicesToRemove.includes(index);
    });

    cleanedData.push(othersData);

    return [cleanedData, othersEntries];
}

function animateGroup(group: string) {
    groupToAnimate.value = group;
}

function stopAnimateGroup() {
    groupToAnimate.value = undefined;
}

function styleSelected(group: string) {
    if (groupToAnimate.value == undefined) return 'none';
    else {
        if (groupToAnimate.value == group) return 'none';
        else return 'opacity(25%)';
    }
}

createData();
</script>
<template>
    <!-- Waffle chart -->
    <div class="grid grid-cols-10 gap-0">
        <div
            v-for="(square, index) in squares"
            style="width: 25px; height: 25px; padding: 2.5px"
            @mouseover="animateGroup(square.group)"
            @mouseleave="stopAnimateGroup()"
            :style="{ filter: styleSelected(square.group) }"
            :key="index"
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

        <div v-if="truncatedOthers" class="flex flex-row" style="justify-content: start">
            <NormalButton @click="allLicensesModalRef.toggle()">
                <template #text> See others </template>
            </NormalButton>
        </div>
    </div>
    <!-- Modal that shows licenses grouped under 'others' if any -->
    <CenteredModal ref="allLicensesModalRef">
        <template #title>
            <div
                style="
                    display: flex;
                    flex-direction: row;
                    column-gap: 1em;
                    justify-content: space-between;
                "
            >
                <div>Other Licenses</div>
                <Icon
                    :icon="'ic:round-close'"
                    style="cursor: pointer"
                    title="Close modal"
                    @click="allLicensesModalRef.toggle()"
                >
                    Close
                </Icon>
            </div>
        </template>
        <template #subtitle>
            The following list shows those licenses that were grouped under 'Others'.
        </template>
        <template #content>
            <div style="max-width: 1000px; max-height: 40vh; overflow-y: auto">
                <div style="font-weight: 400; color: #737171">
                    <div
                        style="
                            margin-bottom: 10px;
                            font-size: 1em;
                            display: flex;
                            align-items: center;
                            flex-direction: row;
                            column-gap: 6px;
                        "
                    >
                        <div>Licenses</div>
                    </div>
                    <div v-for="(value, index) in truncatedOthers" :key="index">
                        <div class="flex flex-row gap-2 justify-start items-center">
                            <div
                                style="
                                    border-radius: 50%;
                                    width: 10px;
                                    height: 10px;
                                    flex-shrink: 0;
                                "
                                :style="{
                                    backgroundColor: value.color,
                                    filter: styleSelected(value.label)
                                }"
                            ></div>
                            <div
                                class="flex flex-row gap-2 justify-between max-w-80"
                                :style="{ filter: styleSelected(value.label) }"
                            >
                                <div style="color: #3e3e3e">{{ value.label }}</div>
                                <div style="font-weight: 700" :style="{ color: value.color }">
                                    {{ (value.value * 100).toFixed(5) }}% ({{ value.sourceValue }})
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template #buttons>
            <BlueButton @click="allLicensesModalRef.toggle()">
                <template #text> Close </template>
            </BlueButton>
        </template>
    </CenteredModal>
</template>
