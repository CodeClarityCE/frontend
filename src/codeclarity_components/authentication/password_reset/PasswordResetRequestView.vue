<script lang="ts" setup>
import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const PasswordResetRequestForm = defineAsyncComponent({
    loader: () => import('./PasswordResetRequestForm.vue'),
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

state.page = 'password-recovery';
state.publicPage = true;
</script>

<template>
    <main class="p-12">
        <PasswordResetRequestForm></PasswordResetRequestForm>
    </main>
</template>
