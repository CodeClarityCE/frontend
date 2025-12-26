<script lang="ts" setup>
export interface Props {
  dimensions?: {
    width?: string;
    height?: string;
  };
}

withDefaults(defineProps<Props>(), {
  dimensions: () => ({
    width: "8rem",
    height: "8rem",
  }),
});
</script>

<template>
  <div class="skeleton-donut" :style="dimensions"></div>
</template>
<style scoped lang="scss">
.skeleton-donut {
  animation: skeleton-loading-donut 1s linear infinite alternate;
  border: 50px solid;
  border-radius: 50%;
}
</style>
