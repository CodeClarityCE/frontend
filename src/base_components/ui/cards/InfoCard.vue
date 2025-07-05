<template>
    <Card
        :class="[
            'shadow-sm hover:shadow-xl transition-all duration-500 border-l-4 bg-white/70 backdrop-blur-sm hover:-translate-y-1 group',
            cardClasses
        ]"
    >
        <div
            :class="[
                'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                gradientClasses
            ]"
        ></div>
        <CardHeader class="pb-6 relative">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div
                        :class="[
                            'p-2 rounded-lg transition-colors duration-300',
                            iconContainerClasses
                        ]"
                    >
                        <Icon :icon="icon" class="h-6 w-6" :class="iconClasses" />
                    </div>
                    <div>
                        <CardTitle :class="['text-xl font-bold', titleClasses]">
                            {{ title }}
                        </CardTitle>
                        <CardDescription v-if="description" class="text-slate-600 mt-1">
                            {{ description }}
                        </CardDescription>
                    </div>
                </div>
                <div v-if="$slots.actions" class="flex items-center gap-2">
                    <slot name="actions"></slot>
                </div>
            </div>
        </CardHeader>
        <CardContent class="relative">
            <slot></slot>
        </CardContent>
    </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue';
import { computed } from 'vue';

interface Props {
    title: string;
    description?: string;
    icon: string;
    variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    description: undefined
});

const cardClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'border-l-theme-primary';
        case 'danger':
            return 'border-l-red-500';
        case 'success':
            return 'border-l-emerald-500';
        case 'warning':
            return 'border-l-amber-500';
        default:
            return 'border-l-black';
    }
});

const gradientClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'bg-gradient-to-br from-theme-primary/5 to-black/5';
        case 'danger':
            return 'bg-gradient-to-br from-red-500/5 to-black/5';
        case 'success':
            return 'bg-gradient-to-br from-emerald-500/5 to-black/5';
        case 'warning':
            return 'bg-gradient-to-br from-amber-500/5 to-black/5';
        default:
            return 'bg-gradient-to-br from-black/5 to-theme-primary/5';
    }
});

const iconContainerClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'bg-theme-primary/10 group-hover:bg-theme-primary/20';
        case 'danger':
            return 'bg-red-500/10 group-hover:bg-red-500/20';
        case 'success':
            return 'bg-emerald-500/10 group-hover:bg-emerald-500/20';
        case 'warning':
            return 'bg-amber-500/10 group-hover:bg-amber-500/20';
        default:
            return 'bg-black/10 group-hover:bg-black/20';
    }
});

const iconClasses = computed(() => {
    switch (props.variant) {
        case 'primary':
            return 'text-theme-primary';
        case 'danger':
            return 'text-red-500';
        case 'success':
            return 'text-emerald-500';
        case 'warning':
            return 'text-amber-500';
        default:
            return 'text-black';
    }
});

const titleClasses = computed(() => {
    return 'text-black';
});
</script>
