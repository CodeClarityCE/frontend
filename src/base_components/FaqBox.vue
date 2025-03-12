<script lang="ts" setup>
import { Icon } from '@iconify/vue';
import { ref, type Ref } from 'vue';

const show: Ref<boolean> = ref(false);
</script>
<template>
    <div class="bg-gray-100 rounded p-2 flex flex-col gap-2 w-5/12">
        <div class="flex flex-row items-start justify-between">
            <div class="font-medium">
                <slot name="question"></slot>
            </div>
            <div class="p-1 flex flex-row items-center cursor-pointer h-fit hover:rounded-full hover:bg-gray-200"
                v-if="!show" @click="show = true">
                <Icon class="icon" icon="tabler:plus"></Icon>
            </div>
            <div class="p-1 flex flex-row items-center cursor-pointer h-fit hover:rounded-full hover:bg-gray-200"
                v-if="show" @click="show = false">
                <Icon class="icon" icon="tabler:minus"></Icon>
            </div>
        </div>
        <div class="description" v-if="show">
            <slot name="answer"></slot>
        </div>
    </div>
</template>
