<script setup lang="ts">
import { useStateStore } from "@/stores/state";

import SettingAccount from "./forms/SettingAccount.vue";

const state = useStateStore();
state.$reset();

state.page = "settings";

// Account is the only settings page, so every /settings path shows it.
defineProps<{
  page?: string;
}>();
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <SettingAccount />
  </div>
</template>
