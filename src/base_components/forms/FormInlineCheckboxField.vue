<script setup lang="ts">
import { Field, ErrorMessage } from 'vee-validate';

const props = defineProps<{
    name: string;
}>();

const value = defineModel<Boolean>('value', { default: {} });
</script>
<template>
    <div class="inline-row">
        <div class="flex flex-row gap-2">
            <label :for="props.name" class="text-gray-500 mb-1 block">
                <slot name="name"></slot>
            </label>
            <Field
                class="w-4 cursor-pointer text-primary"
                type="checkbox"
                :name="props.name"
                v-model="value"
                :value="true"
                :unchecked-value="false"
            />
        </div>
        <ErrorMessage class="text-destructive mt-1 block" :name="props.name" />
    </div>
</template>
