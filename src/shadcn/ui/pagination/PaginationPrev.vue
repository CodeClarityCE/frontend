<script setup lang="ts">
import { cn } from '@/shadcn/lib/utils';
import { Button } from '@/shadcn/ui/button';
import { ChevronLeft } from 'lucide-vue-next';
import { PaginationPrev, type PaginationPrevProps } from 'reka-ui';
import { computed, type HTMLAttributes } from 'vue';

const props = withDefaults(
    defineProps<PaginationPrevProps & { class?: HTMLAttributes['class'] }>(),
    {
        asChild: true
    }
);

const delegatedProps = computed(() => {
    const { class: _, ...delegated } = props;

    return delegated;
});
</script>

<template>
    <PaginationPrev v-bind="delegatedProps">
        <Button :class="cn('w-9 h-9 p-0', props.class)" variant="outline">
            <slot>
                <ChevronLeft />
            </slot>
        </Button>
    </PaginationPrev>
</template>
