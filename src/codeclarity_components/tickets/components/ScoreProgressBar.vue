<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    value: number;
    max: number;
    label?: string;
    showValue?: boolean;
    size?: 'sm' | 'md';
    colorScheme?: 'severity' | 'percentile' | 'confidence';
}

const props = withDefaults(defineProps<Props>(), {
    label: '',
    showValue: true,
    size: 'md',
    colorScheme: 'severity'
});

const percentage = computed(() => {
    if (props.max === 0) return 0;
    return Math.min(100, Math.max(0, (props.value / props.max) * 100));
});

// Get color based on percentage and color scheme
const barColorClass = computed(() => {
    const pct = percentage.value;

    if (props.colorScheme === 'confidence') {
        // Higher confidence = better (blue scale)
        if (pct >= 80) return 'bg-blue-600';
        if (pct >= 60) return 'bg-blue-500';
        if (pct >= 40) return 'bg-blue-400';
        return 'bg-blue-300';
    }

    if (props.colorScheme === 'percentile') {
        // Higher percentile = worse (more likely to be exploited)
        if (pct >= 90) return 'bg-black';
        if (pct >= 70) return 'bg-red-600';
        if (pct >= 40) return 'bg-amber-500';
        return 'bg-green-500';
    }

    // Default severity scheme (higher = worse)
    if (pct >= 90) return 'bg-black';
    if (pct >= 70) return 'bg-red-600';
    if (pct >= 40) return 'bg-amber-500';
    if (pct >= 10) return 'bg-green-500';
    return 'bg-teal-500';
});

const heightClass = computed(() => {
    return props.size === 'sm' ? 'h-1.5' : 'h-2';
});

const textClass = computed(() => {
    return props.size === 'sm' ? 'text-xs' : 'text-sm';
});
</script>

<template>
    <div class="w-full">
        <!-- Label and value row -->
        <div v-if="label || showValue" class="flex items-center justify-between mb-1">
            <span v-if="label" :class="[textClass, 'text-gray-600']">{{ label }}</span>
            <span v-if="showValue" :class="[textClass, 'font-medium text-gray-900']">
                {{ value.toFixed(1) }}
            </span>
        </div>
        <!-- Progress bar -->
        <div :class="['w-full bg-gray-200 rounded-full overflow-hidden', heightClass]">
            <div
                :class="[
                    'rounded-full transition-all duration-300 ease-out',
                    heightClass,
                    barColorClass
                ]"
                :style="{ width: percentage + '%' }"
            />
        </div>
    </div>
</template>
