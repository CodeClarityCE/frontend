<script lang="ts" setup>
import { useStateStore } from "@/stores/state";
import { serverFeatures } from "@/utils/server-features";

import PasswordResetRequestForm from "./PasswordResetRequestForm.vue";
import PasswordResetUnavailable from "./PasswordResetUnavailable.vue";

const state = useStateStore();
state.$reset();

state.page = "password-recovery";
state.publicPage = true;
</script>

<template>
  <PasswordResetRequestForm v-if="serverFeatures.passwordReset" />
  <PasswordResetUnavailable v-else />
</template>
