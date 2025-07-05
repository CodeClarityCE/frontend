<script setup lang="ts">
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import TextLoader from '@/base_components/ui/loaders/TextLoader.vue';
</script>

<template>
    <div style="display: flex; flex-direction: column; row-gap: 10px">
        <BoxLoader :dimensions="{ width: '30%', height: '100px' }" />
        <TextLoader style="max-width: 50%" />
        <TextLoader style="max-width: 50%" />
        <div
            v-for="index in 2"
            :key="index"
            style="
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                margin-top: 100px;
            "
        >
            <BoxLoader v-for="i in 2" :key="i" :dimensions="{ width: '49%', height: '300px' }" />
        </div>
    </div>
</template>
