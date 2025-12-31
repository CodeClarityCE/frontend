<script setup lang="ts">
import { RouterLink } from "vue-router";

import Button from "@/shadcn/ui/button/Button.vue";
</script>
<template>
  <div class="flex flex-col gap-8">
    <div
      class="flex flex-col gap-5 items-center justify-center"
      style="padding-top: 3rem; padding-bottom: 3rem"
    >
      <div style="font-weight: 900; color: gray; font-size: 1.3rem">
        No Projects yet
      </div>
      <div>
        <RouterLink :to="{ name: 'projects', params: { page: 'add' } }">
          <Button> Add a project </Button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
