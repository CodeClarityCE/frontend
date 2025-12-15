<script lang="ts" setup>
export interface Props {
    dimensions?: {
        width?: string;
        height?: string;
    };
    static?: boolean;
}

withDefaults(defineProps<Props>(), {
    dimensions: () => ({
        width: '4rem',
        height: '4rem'
    })
});
</script>
<template>
    <div
        class="skeleton skeleton-box"
        :class="{ 'skeleton-static': static === true }"
        :style="dimensions"
    ></div>
</template>

<style scoped lang="scss">
.skeleton {
    animation: skeleton-loading 1s linear infinite alternate;
}

@keyframes skeleton-loading {
    0% {
        background-color: hsl(200, 20%, 80%);
    }

    100% {
        background-color: hwb(204 94% 4%);
    }
}

@keyframes skeleton-loading-donut {
    0% {
        border-color: hsl(207, 12%, 86%);
    }

    100% {
        border-color: hsl(200, 20%, 95%);
    }
}

.skeleton-static {
    animation: none;
    background-color: rgb(245, 247, 249);
}

.skeleton-box {
    border-radius: 0.25rem;
}
</style>
