<script setup lang="ts">
import type {
    DoughnutChartData,
    DoughnutChartOptions
} from '@/base_components/charts/doughnutChart';
import DoughnutChart from '@/base_components/charts/DoughnutChart.vue';
import { ref, type Ref } from 'vue';

// Props
const props = defineProps<{
    stats: {
        number_of_critical: number;
        number_of_high: number;
        number_of_medium: number;
        number_of_low: number;
        number_of_none: number;
    };
}>();

const doughnutChartData: DoughnutChartData = [
    {
        label: 'Critical',
        color: '#4b4242',
        count: props.stats.number_of_critical
    },
    {
        label: 'High',
        color: '#ae5e5e',
        count: props.stats.number_of_high
    },
    {
        label: 'Medium',
        color: '#cca067',
        count: props.stats.number_of_medium
    },
    {
        label: 'Low',
        color: '#9dae5e',
        count: props.stats.number_of_low
    },
    {
        label: 'None',
        color: '#397680',
        count: props.stats.number_of_none
    }
];

const doghnutChartOptions: Ref<Partial<DoughnutChartOptions>> = ref({});

</script>
<template>
    <div class="p-2">
        <div class="flex flex-row justify-center items-center">
            <DoughnutChart :id="'ciaImpact'" :data="doughnutChartData" :options="doghnutChartOptions" ></DoughnutChart>
        </div>
    </div>
</template>
