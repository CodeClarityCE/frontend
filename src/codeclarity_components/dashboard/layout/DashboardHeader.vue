<template>
    <!-- Dashboard header with title, description and refresh button -->
    <div class="mb-10">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <!-- Title and description -->
            <div>
                <h1 class="text-4xl font-bold tracking-tight text-gray-900">{{ title }}</h1>
                <p class="text-gray-600 mt-2 text-lg">
                    {{ description }}
                </p>
            </div>

            <!-- Action controls -->
            <div class="flex items-center gap-3">
                <!-- Last updated indicator -->
                <div
                    v-if="showLastUpdated"
                    class="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm"
                >
                    <Icon icon="solar:calendar-linear" class="h-4 w-4 text-blue-500" />
                    <span>Last updated: {{ new Date().toLocaleDateString() }}</span>
                </div>

                <!-- Refresh button -->
                <Button
                    variant="outline"
                    size="sm"
                    class="hidden sm:flex items-center gap-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                    :disabled="isLoading"
                    @click="$emit('refresh')"
                >
                    <Icon
                        :icon="isLoading ? 'solar:loading-linear' : 'solar:refresh-linear'"
                        class="h-4 w-4"
                        :class="{ 'animate-spin': isLoading }"
                    />
                    {{ isLoading ? 'Refreshing...' : 'Refresh' }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import Button from '@/shadcn/ui/button/Button.vue';

/**
 * DashboardHeader - Main dashboard header with title and controls (SIMPLIFIED)
 *
 * Features:
 * - Customizable title and description via props
 * - Last updated timestamp
 * - Refresh button that emits refresh event
 * - Responsive design for mobile/desktop
 */

interface Props {
    title?: string;
    description?: string;
    showLastUpdated?: boolean;
    isLoading?: boolean;
}

withDefaults(defineProps<Props>(), {
    title: 'Security Dashboard',
    description: "Monitor your organization's security posture and vulnerabilities",
    showLastUpdated: true,
    isLoading: false
});

defineEmits<{
    refresh: [];
}>();
</script>
