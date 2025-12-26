<script setup lang="ts">
import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";
import { type SocialProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import { useStateStore } from "@/stores/state";
import {
  defineAsyncComponent,
  type AsyncComponentLoader,
  type Component,
} from "vue";
import type SignupFormComponent from "./SignupForm.vue";
import type SocialSetupComponent from "./SocialSetup.vue";

const socialSetupLoader: AsyncComponentLoader<
  typeof SocialSetupComponent
> = async () =>
  (await import("./SocialSetup.vue")) as {
    default: typeof SocialSetupComponent;
  };
const signupFormLoader: AsyncComponentLoader<
  typeof SignupFormComponent
> = async () =>
  (await import("./SignupForm.vue")) as { default: typeof SignupFormComponent };

const SocialSetup: Component = defineAsyncComponent({
  loader: socialSetupLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const SignupForm: Component = defineAsyncComponent({
  loader: signupFormLoader,
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
