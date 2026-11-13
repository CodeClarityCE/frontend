<script lang="ts" setup>
import type { SocialProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import { useStateStore } from "@/stores/state";

import OAuth2Callback from "./OAuth2Callback.vue";

const state = useStateStore();
state.$reset();

state.page = "main";

const props = defineProps<{
  provider: SocialProvider;
}>();
</script>

<template>
  <OAuth2Callback :provider="props.provider" />
</template>
