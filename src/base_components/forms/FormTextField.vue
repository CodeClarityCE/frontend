<script setup lang="ts">
import { Field, ErrorMessage } from 'vee-validate';

const model = defineModel<string>();

const props = defineProps<{
    placeholder: string;
    type: string;
    name: string;
    disabled?: boolean;
}>();
</script>
<template>
    <div>
        <label class="mb-1" :for="props.name">
            <slot name="name"></slot>
        </label>
        <Field
            v-model.trim="model"
            class="border border-solid border-slate-300/60 focus:border-theme-primary rounded shadow-md w-full py-3 px-5 focus:ring-2 focus:ring-theme-primary/20 transition-colors"
            :placeholder="props.placeholder"
            :type="props.type"
            :name="props.name"
            :disabled="props.disabled"
            :class="props.disabled ? 'cursor-not-allowed' : ''"
        />
        <ErrorMessage class="text-red-500 mt-1 block" :name="props.name" />
    </div>
</template>
