<template>
    <Card
        :class="[
            'group relative overflow-hidden border-slate-200 hover:border-theme-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1',
            cardClasses
        ]"
    >
        <div
            :class="[
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                gradientClasses
            ]"
        ></div>
        <CardContent class="p-6 relative">
            <div class="flex items-center justify-between">
                <div class="space-y-2">
                    <p class="text-sm font-semibold uppercase tracking-wide" :class="labelClasses">
                        {{ label }}
                    </p>
                    <p class="text-3xl font-bold text-black">{{ value }}</p>
                    <div v-if="subtitle || $slots.subtitle" class="flex items-center gap-1 text-xs">
                        <Icon
                            v-if="subtitleIcon"
                            :icon="subtitleIcon"
                            class="h-3 w-3"
                            :class="subtitleIconClasses"
                        />
                        <span class="font-medium" :class="subtitleClasses">
                            <slot name="subtitle">{{ subtitle }}</slot>
                        </span>
                    </div>
                </div>
                <div
                    :class="[
                        'p-3 rounded-full transition-colors duration-300',
                        iconContainerClasses
                    ]"
                >
                    <Icon :icon="icon" class="h-8 w-8" :class="iconClasses" />
                </div>
            </div>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

interface Props {
    label: string;
    value: string | number;
    icon: string;
    subtitle?: string;
    subtitleIcon?: string;
    variant?: 'default' | 'primary' | 'danger' | 'success';
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    subtitle: undefined,
    subtitleIcon: undefined
});

const cardClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'bg-gradient-to-br from-theme-primary/10 to-theme-primary/20 border-theme-primary/30';
        case 'danger':
            return 'bg-gradient-to-br from-red-50 to-red-100 border-red-200';
        case 'success':
            return 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200';
        default:
            return 'bg-gradient-to-br from-slate-50 to-slate-100';
    }
});

const gradientClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'bg-gradient-to-br from-theme-primary/5 to-theme-primary/15';
        case 'danger':
            return 'bg-gradient-to-br from-red/5 to-red/15';
        case 'success':
            return 'bg-gradient-to-br from-emerald/5 to-emerald/15';
        default:
            return 'bg-gradient-to-br from-black/5 to-theme-primary/10';
    }
});

const labelClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'text-black';
        case 'danger':
            return 'text-red-700';
        case 'success':
            return 'text-emerald-700';
        default:
            return 'text-slate-600';
    }
});

const subtitleClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'text-theme-primary';
        case 'danger':
            return 'text-red-600';
        case 'success':
            return 'text-emerald-600';
        default:
            return 'text-black';
    }
});

const subtitleIconClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'text-theme-primary';
        case 'danger':
            return 'text-red-600';
        case 'success':
            return 'text-emerald-600';
        default:
            return 'text-black';
    }
});

const iconContainerClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'bg-theme-primary/10 group-hover:bg-theme-primary/20';
        case 'danger':
            return 'bg-red/10 group-hover:bg-red/20';
        case 'success':
            return 'bg-emerald/10 group-hover:bg-emerald/20';
        default:
            return 'bg-black/10 group-hover:bg-black/20';
    }
});

const iconClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'text-theme-primary';
        case 'danger':
            return 'text-red-600';
        case 'success':
            return 'text-emerald-600';
        default:
            return 'text-black';
    }
});
</script>
