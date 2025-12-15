<script setup lang="ts">
import type { License } from '@/codeclarity_components/results/licenses/License';
import { ref, toRef, watch } from 'vue';
import SearchBar from '../filters/SearchBar.vue';

const props = defineProps<{
    placeholder: string;
    name: string;
    licenses: License[];
    disabled?: boolean;
}>();

const search = ref('');
const licenseList = ref(new Set<License>());
const licensesRef = toRef(props, 'licenses');

const data = defineModel<Set<string>>('data', { default: new Set<string>() });

watch([search, licensesRef], () => {
    updateList();
});

function updateList(): void {
    licenseList.value.clear();
    for (const license of props.licenses) {
        if (license?.name.toLowerCase().includes(search.value.toLowerCase())) {
            licenseList.value.add(license);
        }
    }
}

function select(license: License): void {
    const licenseName = Object.values(license)[0] as string;

    if (data.value.has(licenseName)) {
        data.value.delete(licenseName);
    } else {
        data.value.add(licenseName);
    }
}
</script>
<template>
    <div class="flex flex-col gap-2">
        <label class="text-gray-500 mb-1" :for="props.name">
            <slot name="name"></slot>
        </label>
        <SearchBar v-model:search-key="search" :placeholder="'Search for a license'"></SearchBar>
        <div
            class="border border-solid border-gray-400 rounded shadow-md w-full py-3 px-5 h-72 overflow-y-scroll"
        >
            <div
                v-for="license in licenseList"
                :key="license.id"
                class="py-2 px-4 cursor-pointer hover:bg-primary/90 hover:text-white"
                :class="data.has(license._key) ? 'bg-primary text-white' : ''"
                @click="select(license)"
            >
                {{ license.name }}
            </div>
        </div>
        <!-- <ErrorMessage class="text-destructive mt-1 block" :name="props.name" /> -->
    </div>
</template>
