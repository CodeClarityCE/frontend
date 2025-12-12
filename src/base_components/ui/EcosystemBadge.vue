<script lang="ts" setup>
import type { EcosystemInfo } from '@/utils/packageEcosystem';
import { Icon } from '@iconify/vue';

defineProps<{
    ecosystem: EcosystemInfo;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'minimal' | 'outline';
    showName?: boolean;
}>();
</script>

<template>
    <div
        class="inline-flex items-center gap-1.5 rounded-full transition-all duration-200"
        :class="{
            // Size variants
            'px-1.5 py-0.5 text-xs': size === 'xs',
            'px-2 py-1 text-xs': size === 'sm' || !size,
            'px-3 py-1.5 text-sm': size === 'md',
            'px-4 py-2 text-base': size === 'lg',

            // Style variants
            'bg-white border border-gray-200 text-gray-700 hover:border-gray-300':
                variant === 'default' || !variant,
            'bg-gray-50 border border-gray-100 text-gray-600': variant === 'minimal',
            'bg-transparent border border-gray-300 text-gray-600 hover:border-gray-400':
                variant === 'outline'
        }"
        :title="`${ecosystem.name} (${ecosystem.language})`"
    >
        <Icon
            :icon="ecosystem.icon"
            :class="{
                'h-2.5 w-2.5': size === 'xs',
                'h-3 w-3': size === 'sm' || !size,
                'h-4 w-4': size === 'md',
                'h-5 w-5': size === 'lg'
            }"
            :style="{ color: ecosystem.color }"
        />
        <span v-if="showName !== false" class="font-medium">
            {{ ecosystem.name }}
        </span>
    </div>
</template>
