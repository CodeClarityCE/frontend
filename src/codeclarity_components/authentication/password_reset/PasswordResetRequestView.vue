<script lang="ts" setup>
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import { useStateStore } from '@/stores/state';
import { defineAsyncComponent, type AsyncComponentLoader, type Component } from 'vue';
import type PasswordResetRequestFormComponent from './PasswordResetRequestForm.vue';

const loader: AsyncComponentLoader<typeof PasswordResetRequestFormComponent> = async () =>
    await import('./PasswordResetRequestForm.vue');

const PasswordResetRequestForm: Component = defineAsyncComponent({
    loader,
    loadingComponent: LoadingComponent as Component,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent as Component,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
}) as Component;

const state = useStateStore();
state.$reset();

state.page = 'password-recovery';
state.publicPage = true;
</script>

<template>
    <main class="p-12">
        <PasswordResetRequestForm></PasswordResetRequestForm>
    </main>
</template>
