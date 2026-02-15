<script setup lang="ts">
import BoxLoader from "@/base_components/ui/loaders/BoxLoader.vue";
import TextLoader from "@/base_components/ui/loaders/TextLoader.vue";
</script>

<template>
  <div class="loader-container">
    <!-- Header skeleton -->
    <div class="loader-header">
      <BoxLoader :dimensions="{ width: '30%', height: '40px' }" />
      <TextLoader style="max-width: 50%" />
    </div>

    <!-- Summary bar skeleton -->
    <BoxLoader :dimensions="{ width: '100%', height: '48px' }" />

    <!-- Tab bar skeleton -->
    <div class="loader-tabs">
      <BoxLoader :dimensions="{ width: '100px', height: '32px' }" />
      <BoxLoader :dimensions="{ width: '140px', height: '32px' }" />
      <BoxLoader :dimensions="{ width: '80px', height: '32px' }" />
    </div>

    <!-- Tab content skeleton -->
    <BoxLoader :dimensions="{ width: '100%', height: '400px' }" />
  </div>
</template>

<style scoped>
.loader-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loader-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.loader-tabs {
  display: flex;
  gap: 0.5rem;
}
</style>
