<script setup lang="ts">
import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const SettingAccount = defineAsyncComponent({
    loader: () => import('./forms/SettingAccount.vue'),
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

state.page = 'settings';

const props = defineProps<{
    page?: string;
}>();
</script>

<template>
    <main class="min-h-screen bg-white">
        <SettingAccount v-if="props.page == 'account'" />
    </main>
</template>
