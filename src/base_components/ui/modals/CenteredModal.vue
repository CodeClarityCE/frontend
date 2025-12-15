<script lang="ts" setup>
import { ref } from 'vue';

const show_modal = ref<boolean>(false);

function toggle(): void {
    show_modal.value = !show_modal.value;
}

function show(): void {
    show_modal.value = true;
}

function hide(): void {
    show_modal.value = false;
}

defineExpose({
    toggle,
    show,
    hide
});
</script>
<template>
    <Transition>
        <div
            v-if="show_modal"
            class="fixed top-0 left-0 z-50 p-8 w-full h-full flex bg-black bg-opacity-5 justify-center items-center"
        >
            <div class="w-fit bg-white shadow-md rounded-lg">
                <div class="rounded p-5 pb-0 font-semibold text-gray-600 text-lg">
                    <slot name="title"></slot>
                </div>
                <div v-if="$slots.subtitle" class="px-5 py-2 font-normal text-gray-600">
                    <slot name="subtitle"></slot>
                </div>
                <div class="mx-5 h-px bg-gray-200 mt-2"></div>
                <div class="p-5">
                    <slot name="content"></slot>
                </div>
                <div class="flex flex-row justify-end px-4 py-5 border-t border-gray-400 gap-2">
                    <slot name="buttons"></slot>
                </div>
            </div>
        </div>
    </Transition>
</template>
