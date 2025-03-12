<template>
    <div>
        <label class="mb-1" :for="props.name">
            <slot name="name"></slot>
        </label>
        <Field
            class="border border-solid border-gray-400 rounded shadow-md w-full py-3 px-5"
            :placeholder="props.placeholder"
            :type="props.type"
            :name="props.name"
            v-model.trim="model"
            :disabled="props.disabled"
            :class="props.disabled ? 'cursor-not-allowed' : ''"
        />
        <ErrorMessage class="text-destructive mt-1 block" :name="props.name" />
    </div>
</template>

<script setup lang="ts">
import { Field, ErrorMessage } from 'vee-validate';

const model = defineModel();

const props = defineProps<{
    placeholder: string;
    type: string;
    name: string;
    disabled?: boolean;
}>();
</script>
