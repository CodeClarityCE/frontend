<template>
    <div>
        <label class="text-gray-500 mb-1" :for="props.name">
            <slot name="name"></slot>
        </label>
        <Field v-model.trim="model" :name="props.name" v-slot="{ field }">
            <textarea
                v-bind="field"
                class="border border-solid border-gray-400 rounded shadow-md w-full py-3 px-5"
            ></textarea>
            <p>Hint: Here is an example</p>
            <InfoMarkdown
                class="bg-[#202531] text-white p-7 rounded text-xs overflow-x-scroll"
                :markdown="markdown"
            ></InfoMarkdown>
        </Field>
        <ErrorMessage class="text-destructive mt-1 block" :name="props.name" />
    </div>
</template>

<script setup lang="ts">
import { Field, ErrorMessage } from 'vee-validate';
import InfoMarkdown from '../markdown/InfoMarkdown.vue';

const model = defineModel();

const props = defineProps<{
    name: string;
    markdown: string;
}>();
</script>
