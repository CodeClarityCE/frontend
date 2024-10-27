<template>
    <Button variant="outline" class="flex justify-center gap-2 items-center">
        <slot name="icon"></slot>
        <slot name="text"></slot>
    </Button>
</template>

<script setup lang="ts">
import { Button } from '@/shadcn/ui/button';
export interface Props {
    active?: boolean;
}

defineProps<Props>();
</script>
