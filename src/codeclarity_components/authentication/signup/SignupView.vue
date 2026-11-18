<script setup lang="ts">
import { useStateStore } from "@/stores/state";

import SignupForm from "./SignupForm.vue";

const state = useStateStore();
state.$reset();

state.page = "signup";
state.publicPage = true;
</script>

<template>
  <SignupForm />
</template>
