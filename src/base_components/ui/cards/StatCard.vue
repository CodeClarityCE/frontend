<template>
    <!-- Statistics card with label, value, icon and optional subtitle -->
    <Card class="border shadow-sm hover:shadow-md transition-shadow" :class="borderColor">
        <CardContent class="p-6">
            <!-- Main content: stats on left, icon on right -->
            <div class="flex items-center justify-between">
                <!-- Statistics content -->
                <div class="space-y-2">
                    <!-- Label (required) -->
                    <p class="text-sm font-semibold uppercase tracking-wide text-gray-600">
                        {{ label }}
                    </p>

                    <!-- Value (required) -->
                    <p class="text-3xl font-bold text-gray-900">{{ value }}</p>

                    <!-- Optional subtitle with icon -->
                    <div v-if="subtitle || $slots.subtitle" class="flex items-center gap-1 text-xs">
                        <Icon
                            v-if="subtitleIcon"
                            :icon="subtitleIcon"
                            class="h-3 w-3 text-gray-500"
                        />
                        <span class="font-medium text-gray-600">
                            <slot name="subtitle">{{ subtitle }}</slot>
                        </span>
                    </div>
                </div>

                <!-- Icon container -->
                <div class="p-3 rounded-full bg-gray-100">
                    <Icon :icon="icon" class="h-8 w-8 text-gray-600" />
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue';

/**
 * StatCard - A statistics card component for displaying key metrics
 *
 * Usage:
 * <StatCard
 *   label="Total Users"
 *   value="1,234"
 *   icon="mdi:account-group"
 *   variant="primary"
 *   subtitle="↗ 12% this month"
 *   subtitle-icon="mdi:trending-up"
 * >
 *   <template #subtitle>Custom subtitle content</template>
 * </StatCard>
 */
interface Props {
    label: string; // Required: Stat category/name
    value: string | number; // Required: The main statistic value
    icon: string; // Required: Iconify icon name (e.g., "mdi:chart-line")
    subtitle?: string; // Optional: Additional context (e.g., "↗ 12% increase")
    subtitleIcon?: string; // Optional: Icon for subtitle (e.g., "mdi:trending-up")
    variant?: 'default' | 'primary' | 'danger' | 'success'; // Optional: Color theme
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    subtitle: undefined,
    subtitleIcon: undefined
});

// Map variant to border color - easy to customize for different stat types
const borderColor = {
    primary: 'border-l-4 border-l-blue-500', // Blue for primary metrics
    danger: 'border-l-4 border-l-red-500', // Red for concerning metrics
    success: 'border-l-4 border-l-green-500', // Green for positive metrics
    default: 'border-l-4 border-l-gray-400' // Gray for neutral metrics
}[props.variant];
</script>
