<script lang="ts" setup>
import {
  type AsyncComponentLoader,
  type Component,
  defineAsyncComponent,
} from "vue";

import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";
import type { SocialProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import { useStateStore } from "@/stores/state";

import type OAuth2CallbackComponent from "./OAuth2Callback.vue";

const loader: AsyncComponentLoader<typeof OAuth2CallbackComponent> = async () =>
  (await import("./OAuth2Callback.vue")) as {
    default: typeof OAuth2CallbackComponent;
  };

const OAuth2Callback: Component = defineAsyncComponent({
  loader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const state = useStateStore();
state.$reset();

state.page = "main";

const props = defineProps<{
  provider: SocialProvider;
}>();
</script>

<template>
  <main class="p-12">
    <OAuth2Callback :provider="props.provider" />
  </main>
</template>
