<template>
    <div class="flex flex-col gap-2">
        <label class="text-gray-500 mb-1" :for="props.name">
            <slot name="name"></slot>
        </label>
        <SearchBar v-model:searchKey="search" :placeholder="'Search for a license'"></SearchBar>
        <div
            class="border border-solid border-gray-400 rounded shadow-md w-full py-3 px-5 h-72 overflow-y-scroll"
        >
            <div
                v-for="license in licenseList"
                :key="license.id"
                @click="select(license)"
                class="py-2 px-4 cursor-pointer hover:bg-primaryHovered hover:text-white"
                :class="data.has(license._key) ? 'bg-primary text-white' : ''"
            >
                {{ license.name }}
            </div>
        </div>
        <!-- <ErrorMessage class="text-destructive mt-1 block" :name="props.name" /> -->
    </div>
</template>

<script setup lang="ts">
import type { License } from '@/repositories/types/entities/License';
import SearchBar from '../SearchBar.vue';
import { ref, toRef, watch } from 'vue';

const props = defineProps<{
    placeholder: string;
    name: string;
    licenses: Array<License>;
    disabled?: boolean;
}>();

const search = ref('');
const licenseList = ref(new Set<License>());
const licensesRef = toRef(props, 'licenses');

const data = defineModel<Set<String>>('data', { default: new Set<String>() });

watch([search, licensesRef], () => {
    updateList();
});

function updateList() {
    licenseList.value.clear();
    for (let i = 0; i < props.licenses.length; i++) {
        if (props.licenses[i].name.toLowerCase().includes(search.value.toLowerCase())) {
            licenseList.value.add(props.licenses[i]);
        }
    }
}

function select(license: License) {
    const licenseName = Object.values(license)[0];

    if (data.value.has(licenseName)) {
        data.value.delete(licenseName);
    } else {
        data.value.add(licenseName);
    }
}
</script>
