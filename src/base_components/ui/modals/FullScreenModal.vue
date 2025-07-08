<script lang="ts" setup>
import { ref } from 'vue';

const show_modal: any = ref(false);

function toggle() {
    show_modal.value = !show_modal.value;
}

function show() {
    show_modal.value = true;
}

function hide() {
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
            class="fixed inset-0 z-50 w-full h-full flex bg-black bg-opacity-75 justify-center items-center"
        >
            <div class="w-full h-full bg-white shadow-md flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <div class="font-semibold text-gray-900 text-xl">
                            <slot name="title"></slot>
                        </div>
                        <div v-if="$slots.subtitle" class="text-gray-600 mt-1">
                            <slot name="subtitle"></slot>
                        </div>
                    </div>
                    <button
                        class="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close modal"
                        @click="hide"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                            ></path>
                        </svg>
                    </button>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-auto p-6">
                    <slot name="content"></slot>
                </div>

                <!-- Footer -->
                <div
                    v-if="$slots.buttons"
                    class="flex flex-row justify-end px-6 py-4 border-t border-gray-200 gap-2"
                >
                    <slot name="buttons"></slot>
                </div>
            </div>
        </div>
    </Transition>
</template>
