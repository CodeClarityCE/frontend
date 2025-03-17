<script setup lang="ts">
import BoxLoader from '@/base_components/BoxLoader.vue';
import TextLoader from '@/base_components/TextLoader.vue';
</script>

<template>
    <div style="display: flex; flex-direction: column; row-gap: 10px">
        <BoxLoader :dimensions="{ width: '30%', height: '50px' }" />
        <BoxLoader :dimensions="{ width: '35%', height: '40px' }" />
        <TextLoader style="max-width: 70%" />
        <TextLoader style="max-width: 65%" />
        <div
            v-for="index in 2"
            :key="index"
            style="display: flex; flex-direction: row; justify-content: space-between"
        >
            <BoxLoader
                v-for="i in 2"
                :key="i"
                :dimensions="{ width: '49%', height: '300px' }"
                style="margin-top: 70px"
            />
        </div>
        <BoxLoader :dimensions="{ width: '100%', height: '300px' }" style="margin-top: 70px" />
        <div
            style="
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                margin-top: 70px;
            "
        >
            <BoxLoader
                v-for="index in 4"
                :key="index"
                :dimensions="{ width: '24%', height: '100px' }"
            />
        </div>
    </div>
</template>
