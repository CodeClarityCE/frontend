<template>
    <div class="border-card-titled" v-if="props.title">
        <div class="title">
            <slot name="title"></slot>
        </div>
        <div class="p-5">
            <slot name="content"></slot>
        </div>
    </div>
    <div
        v-else-if="props.slim"
        :class="{
            'hover:bg-[#f7f7f7]': props.hover,
            'p-5': props.slim,
            'relative w-full flex flex-col items-center justify-center gap-3 cursor-pointer border border-[#e6e5e5] rounded-lg': true
        }"
    >
        <slot name="title"></slot>
    </div>
    <div
        v-else-if="props.cwe"
        class="bg-white text-black py-1 px-2 border-2 border-black text-sm self-center font-semibold rounded"
    >
        <slot name="title"></slot>
    </div>
    <div
        v-else-if="props.integration"
        :class="{
            'hover:bg-[#f7f7f7]': props.hover,
            'relative w-full flex flex-col items-center justify-center gap-3 cursor-pointer border border-[#e6e5e5] rounded-lg p-5 pt-10': true
        }"
    >
        <div
            class="flex flex-row items-center justify-center absolute top-2 right-2 text-[#606060] hover:text-black"
        >
            <slot name="icon"></slot>
        </div>
        <slot name="title"></slot>
        <div>
            <slot name="content"></slot>
        </div>
    </div>
    <div v-else class="border border-[#e6e5e5] rounded-lg">
        <div class="p-5">
            <slot name="content"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    hover: {
        type: Boolean,
        default: false,
        required: false
    },
    slim: {
        type: Boolean,
        default: false,
        required: false
    },
    title: {
        type: Boolean,
        default: false,
        required: false
    },
    integration: {
        type: Boolean,
        default: false,
        required: false
    },
    cwe: {
        type: Boolean,
        default: false,
        required: false
    }
});
</script>

<style scoped lang="scss">
.border-card {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    row-gap: 20px;
    border: 1px solid #e6e5e5;
    min-width: 0px;
    height: 100%;
    text-decoration: none !important;
    color: #606060;
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
}

.border-card-titled {
    width: 100%;
    border: 1px solid #e6e5e5;
    min-width: 0px;
    height: 100%;
    text-decoration: none !important;
    color: #606060;
    background-color: #fff;
    border-radius: 5px;
}

.border-card-titled > .title {
    border-bottom: 1px solid #e6e5e5;
    padding: 20px;
    padding-top: 11px;
    padding-bottom: 11px;
    background-color: #f9f9f9;
    font-weight: 700;
}
</style>
