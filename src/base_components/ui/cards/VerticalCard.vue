<template>
    <!-- Vertical card component with header, content, and footer sections -->
    <Card
        class="h-full flex flex-col border-t-4 shadow-sm hover:shadow-md transition-shadow"
        :class="[borderColor, containerClass]"
    >
        <!-- Header Section -->
        <CardHeader v-if="title || icon || $slots['header']" class="pb-3">
            <div class="flex items-start justify-between">
                <!-- Title and icon -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <Icon v-if="icon" :icon="icon" class="h-5 w-5 text-gray-600 flex-shrink-0" />
                    <div class="min-w-0 flex-1">
                        <CardTitle
                            v-if="title"
                            class="text-lg font-semibold text-theme-black truncate"
                        >
                            {{ title }}
                        </CardTitle>
                        <CardDescription v-if="subtitle" class="text-sm text-theme-gray mt-1">
                            {{ subtitle }}
                        </CardDescription>
                    </div>
                </div>

                <!-- Header actions slot -->
                <div v-if="$slots['actions']" class="flex-shrink-0 ml-2">
                    <slot name="actions"></slot>
                </div>
            </div>

            <!-- Custom header slot -->
            <slot name="header"></slot>
        </CardHeader>

        <!-- Main Content Section -->
        <CardContent class="flex-1 flex flex-col" :class="contentClass">
            <slot></slot>
        </CardContent>

        <!-- Footer Section -->
        <CardContent v-if="$slots['footer']" class="pt-0 mt-auto">
            <slot name="footer"></slot>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue';

/**
 * VerticalCard - A flexible vertical card component with header, content, and footer sections
 *
 * Usage:
 * <VerticalCard
 *   title="Project Name"
 *   subtitle="Organization"
 *   icon="mdi:folder"
 *   variant="primary"
 * >
 *   <template #actions>
 *     <Button>Action</Button>
 *   </template>
 *
 *   <!-- Main content -->
 *   <div>Card content goes here</div>
 *
 *   <template #footer>
 *     <div>Footer content</div>
 *   </template>
 * </VerticalCard>
 */
interface Props {
    title?: string; // Optional: Main card title
    subtitle?: string; // Optional: Subtitle/description
    icon?: string; // Optional: Iconify icon name (e.g., "mdi:folder")
    variant?: 'primary' | 'danger' | 'success' | 'warning' | 'default'; // Optional: Color theme
    containerClass?: string; // Optional: Additional container classes
    contentClass?: string; // Optional: Additional content classes
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    containerClass: '',
    contentClass: ''
});

// Map variant to border color class
const borderColor = {
    primary: 'border-t-theme-primary', // Theme primary for important content
    danger: 'border-t-red-500', // Red for warnings/errors
    success: 'border-t-theme-primary', // Theme primary for success states
    warning: 'border-t-yellow-500', // Yellow for warnings
    default: 'border-t-theme-black' // Black for neutral content
}[props.variant];
</script>
