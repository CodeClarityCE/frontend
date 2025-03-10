<template>
    <div class="skeleton skeleton-text" :class="{ 'skeleton-static': props.static == true }"></div>
</template>
<script lang="ts" setup>
// Props
const props = defineProps<{
    static?: boolean;
}>();
</script>

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

.skeleton-text {
    width: 100%;
    height: 0.9rem;
    border-radius: 0.25rem;
    min-width: 50px;
}
</style>
