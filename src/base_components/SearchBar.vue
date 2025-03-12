<script lang="ts" setup>
// Imports
import { Icon } from '@iconify/vue';

// Props
defineProps<{
    placeholder: string;
}>();

// Models
const searchKey = defineModel<string>('searchKey', { default: '' });
</script>
<template>
    <span
        class="bg-white border border-gray-200 rounded-lg h-10 flex flex-row justify-start gap-2 items-center px-4 w-full">
        <Icon class="w-4 h-4" icon="ion:search-outline" />
        <input type="text" class="appearance-none border-0 outline-none w-full bg-transparent m-0 text-sm"
            v-model="searchKey" :placeholder="placeholder" />
    </span>
</template>
