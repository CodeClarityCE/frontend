<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    score: number;
    maxScore: number;
    label: string;
    type: 'cvss' | 'epss' | 'vlai';
    size?: 'sm' | 'md' | 'lg';
    sublabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
    size: 'md',
    sublabel: ''
});

const sizeConfig = {
    sm: { width: 70, strokeWidth: 6, fontSize: 'text-lg', labelSize: 'text-[10px]' },
    md: { width: 90, strokeWidth: 7, fontSize: 'text-xl', labelSize: 'text-xs' },
    lg: { width: 110, strokeWidth: 8, fontSize: 'text-2xl', labelSize: 'text-sm' }
};

const config = computed(() => sizeConfig[props.size]);
const radius = computed(() => (config.value.width - config.value.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);

// Calculate percentage (capped at 100%)
const percentage = computed(() => {
    const pct = (props.score / props.maxScore) * 100;
    return Math.min(100, Math.max(0, pct));
});

// Calculate stroke dashoffset for the progress arc
const strokeDashoffset = computed(() => {
    return circumference.value - (percentage.value / 100) * circumference.value;
});

// Get severity level based on score and type
const severityLevel = computed(() => {
    if (props.type === 'cvss') {
        if (props.score >= 9.0) return 'critical';
        if (props.score >= 7.0) return 'high';
        if (props.score >= 4.0) return 'medium';
        if (props.score >= 0.1) return 'low';
        return 'none';
    }
    if (props.type === 'epss') {
        // EPSS: higher percentage = more likely to be exploited
        const pct = props.score; // Already in percentage (0-100)
        if (pct >= 50) return 'critical';
        if (pct >= 20) return 'high';
        if (pct >= 5) return 'medium';
        if (pct >= 0.1) return 'low';
        return 'none';
    }
    if (props.type === 'vlai') {
        // VLAI: score is already a severity level mapped to number
        if (props.score >= 9) return 'critical';
        if (props.score >= 7) return 'high';
        if (props.score >= 4) return 'medium';
        if (props.score >= 1) return 'low';
        return 'none';
    }
    return 'none';
});

// Color classes for each severity level
const strokeColor = computed(() => {
    const colors: Record<string, string> = {
        critical: '#000000',
        high: '#bf1313',
        medium: '#f59e0b',
        low: '#5a9d09',
        none: '#09889d'
    };
    return colors[severityLevel.value] ?? colors['none'];
});

const textColorClass = computed(() => {
    const classes: Record<string, string> = {
        critical: 'text-black',
        high: 'text-red-600',
        medium: 'text-amber-500',
        low: 'text-green-600',
        none: 'text-teal-600'
    };
    return classes[severityLevel.value] ?? classes['none'];
});

// Format display value
const displayValue = computed(() => {
    if (props.type === 'epss') {
        return `${props.score.toFixed(1)}%`;
    }
    if (props.type === 'vlai') {
        return props.sublabel ?? props.score.toFixed(1);
    }
    return props.score.toFixed(1);
});

// Center position
const center = computed(() => config.value.width / 2);
</script>

<template>
    <div class="flex flex-col items-center">
        <!-- SVG Gauge -->
        <div class="relative" :style="{ width: config.width + 'px', height: config.width + 'px' }">
            <svg :width="config.width" :height="config.width" class="transform -rotate-90">
                <!-- Background circle -->
                <circle
                    :cx="center"
                    :cy="center"
                    :r="radius"
                    fill="none"
                    stroke="#e5e7eb"
                    :stroke-width="config.strokeWidth"
                />
                <!-- Progress arc -->
                <circle
                    :cx="center"
                    :cy="center"
                    :r="radius"
                    fill="none"
                    :stroke="strokeColor"
                    :stroke-width="config.strokeWidth"
                    :stroke-dasharray="circumference"
                    :stroke-dashoffset="strokeDashoffset"
                    stroke-linecap="round"
                    class="transition-all duration-500 ease-out"
                />
            </svg>
            <!-- Center content -->
            <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span :class="[config.fontSize, 'font-bold', textColorClass]">
                    {{ displayValue }}
                </span>
            </div>
        </div>
        <!-- Label below -->
        <div class="mt-2 text-center">
            <span :class="[config.labelSize, 'font-medium text-gray-700 uppercase tracking-wide']">
                {{ label }}
            </span>
            <p v-if="sublabel && type !== 'vlai'" :class="[config.labelSize, 'text-gray-500']">
                {{ sublabel }}
            </p>
        </div>
    </div>
</template>
