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

function toggle() {
    disabled.value = !loading.value;
    loading.value = !loading.value;
}

defineExpose({
    setLoading,
    setDisabled,
    toggle
});
</script>
<template>
    <button type="button" class="cursor-pointer flex flex-row items-center justify-center"
        :class="{ 'submit-button': !props.noStyle }" v-bind:disabled="disabled">
        <div v-if="loading">
            <div class="-my-1 aspect-square rounded spinner"></div>
        </div>

        <slot v-if="!loading"></slot>
    </button>
</template>

<style scoped lang="scss">
.spinner {
    background:
        radial-gradient(farthest-side, #fff 94%, #0000) top/5px 5px no-repeat,
        conic-gradient(#0000 30%, #fff);

    .spinner {
        background:
            radial-gradient(farthest-side, #fff 94%, #0000) top/5px 5px no-repeat,
            conic-gradient(#0000 30%, #fff);
        -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 5px), #000 0);
        mask: radial-gradient(farthest-side, #0000 calc(100% - 5px), #000 0);
    }

    animation: spinner-anim 1s infinite linear;
}
</style>
