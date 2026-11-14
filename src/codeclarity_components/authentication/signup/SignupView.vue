<script setup lang="ts">
import { type SocialProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import { useStateStore } from "@/stores/state";

import SignupForm from "./SignupForm.vue";
import SocialSetup from "./SocialSetup.vue";

const state = useStateStore();
state.$reset();

state.page = "signup";
state.publicPage = true;

const urlParams = new URLSearchParams(window.location.search);
const _provider = urlParams.get("provider");
let provider: SocialProvider | undefined;
if (_provider !== "") {
  provider = _provider as SocialProvider;
}
</script>

<template>
  <SocialSetup v-if="provider" :provider="provider" />
  <SignupForm v-else />
</template>
