<script lang="ts" setup>
import { useStateStore } from "@/stores/state";

import PasswordResetRequestForm from "./PasswordResetRequestForm.vue";

const state = useStateStore();
state.$reset();

state.page = "password-recovery";
state.publicPage = true;
</script>

<template>
  <PasswordResetRequestForm />
</template>
