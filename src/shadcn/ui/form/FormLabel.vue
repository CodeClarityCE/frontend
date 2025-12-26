<script lang="ts" setup>
import { cn } from '@/shadcn/lib/utils';
import { Label } from '@/shadcn/ui/label';
import type { LabelProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { useFormField } from './useFormField';

const props = defineProps<LabelProps & { class?: HTMLAttributes['class'] }>();

const { error, formItemId } = useFormField();
</script>

<template>
    <Label :class="cn(error && 'text-destructive', props.class)" :for="formItemId">
        <slot />
    </Label>
</template>
