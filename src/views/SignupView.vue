<script setup lang="ts">
import { SocialProvider } from '@/repositories/types/entities/Integrations';
import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/common_components/ErrorComponent.vue';
import LoadingComponent from '@/common_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const SocialSetup = defineAsyncComponent({
    loader: () => import('@/views/login/SocialSetup.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const SignupForm = defineAsyncComponent({
    loader: () => import('@/views/login/SignupForm.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const state = useStateStore();
state.$reset();

state.page = 'signup';
state.publicPage = true;

const urlParams = new URLSearchParams(window.location.search);
const _provider = urlParams.get('provider');
let provider: SocialProvider | undefined;
if (_provider != '') {
    provider = _provider as SocialProvider;
}
</script>

<template>
    <SocialSetup v-if="provider" :provider="provider" />
    <SignupForm v-else />
</template>
