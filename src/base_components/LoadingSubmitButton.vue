<template>
    <button
        type="submit"
        class="rounded py-3 px-5 text-white shadow-md bg-primary hover:bg-primaryHovered"
        :class="{ 'submit-button': !props.noStyle }"
        v-bind:disabled="disabled"
    >
        <div v-if="loading">
            <div class="spinner"></div>
        </div>

        <slot v-if="!loading"></slot>
    </button>
</template>
<script lang="ts" setup>
import { ref } from 'vue';

// Props
const props = defineProps<{
    noStyle?: boolean;
}>();

const loading = ref(false);
const disabled = ref(false);

function setLoading(_loading: boolean) {
    loading.value = _loading;
}

function setDisabled(_disabled: boolean) {
    disabled.value = _disabled;
}

defineExpose({
    setLoading,
    setDisabled
});
</script>

<style scoped lang="scss">
.spinner {
    margin-top: -4.5px;
    margin-bottom: -4.5px;
    aspect-ratio: 1;
    border-radius: 50%;
    background:
        radial-gradient(farthest-side, #fff 94%, #0000) top/5px 5px no-repeat,
        conic-gradient(#0000 30%, #fff);
    -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 5px), #000 0);
    mask: radial-gradient(farthest-side, #0000 calc(100% - 5px), #000 0);
    animation: spinner-anim 1s infinite linear;
}

@keyframes spinner-anim {
    100% {
        transform: rotate(1turn);
    }
}
</style>
