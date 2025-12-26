<script setup lang="ts">
import { Icon } from '@iconify/vue';

interface ReferenceInfo {
    url: string;
    tags: string[];
}

defineProps<{
    references: ReferenceInfo[];
    referencesLimit: number;
    onToggle: () => void;
}>();

function getFavicon(url: string): string {
    const host = getHost(url);
    return `https://s2.googleusercontent.com/s2/favicons?sz=64&domain=${host}`;
}
function getHost(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}
</script>
<template>
    <div class="references-inner-wrapper">
        <div
            v-for="reference in references.slice(0, referencesLimit)"
            :key="reference.url"
            title="View reference (opens in a new tab)"
        >
            <a :href="reference.url" target="_blank" class="reference p-5 rounded-lg">
                <div class="reference-header">
                    <div
                        class="reference-header-wrapper flex flex-col items-center gap-5 font-medium text-sm"
                    >
                        <img :src="getFavicon(reference.url)" />
                        <div>{{ getHost(reference.url) }}</div>
                    </div>
                    <div>
                        <Icon :icon="'ion:open-outline'" />
                    </div>
                </div>
                <div>{{ reference.url }}</div>
                <div class="vulnerability-references-tags-container">
                    <div v-for="tag in reference.tags" :key="tag" class="reference-tag">
                        {{ tag }}
                    </div>
                </div>
            </a>
        </div>
        <div v-if="references.length > 8" class="references-show-more-wrapper">
            <div @click="onToggle">
                <span v-if="referencesLimit < references.length" class="button">Show more</span>
                <span v-else class="button">Show less</span>
            </div>
        </div>
    </div>
</template>
<style scoped lang="scss">
.references-inner-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}
.reference {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    transition: box-shadow 0.15s ease-in-out;
    &:hover {
        box-shadow:
            0 4px 6px -1px rgb(0 0 0 / 0.1),
            0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
}
.reference-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
}
.reference-header-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}
.reference-tag {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #e5e7eb;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
}
.references-show-more-wrapper {
    text-align: center;
    margin-top: 1rem;
}
.button {
    cursor: pointer;
    padding: 0.5rem 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    transition: background 0.15s ease-in-out;
    &:hover {
        background: #f3f4f6;
    }
}
</style>
