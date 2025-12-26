<template>
    <!-- Page header with title, description and refresh button -->
    <div class="mb-10">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <!-- Title and description -->
            <div>
                <h1 class="text-4xl font-bold tracking-tight text-theme-black">{{ title }}</h1>
                <p class="text-theme-gray mt-2 text-lg">
                    {{ description }}
                </p>
            </div>

            <!-- Action controls -->
            <div class="flex items-center gap-3">
                <!-- Last updated indicator -->
                <div
                    v-if="showLastUpdated"
                    class="flex items-center gap-2 text-sm text-theme-gray bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm"
                >
                    <Icon icon="solar:calendar-linear" class="h-4 w-4 text-theme-primary" />
                    <span>Last updated: {{ new Date().toLocaleDateString() }}</span>
                </div>

                <!-- Refresh button -->
                <Button
                    v-if="showRefresh"
                    variant="outline"
                    size="sm"
                    class="hidden sm:flex items-center gap-2 border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
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
import Button from '@/shadcn/ui/button/Button.vue';
import { Icon } from '@iconify/vue';

/**
 * PageHeader - Reusable page header component
 *
 * A flexible header component that displays:
 * - Title and description
 * - Optional last updated timestamp
 * - Optional refresh button with loading state
 *
 * Can be used across different pages for consistent styling
 */

interface Props {
    title?: string;
    description?: string;
    showLastUpdated?: boolean;
    showRefresh?: boolean;
    isLoading?: boolean;
}

withDefaults(defineProps<Props>(), {
    title: 'Page Title',
    description: 'Page description',
    showLastUpdated: true,
    showRefresh: true,
    isLoading: false
});

defineEmits<{
    refresh: [];
}>();
</script>
