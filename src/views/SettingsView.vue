<script setup lang="ts">
import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/common_components/ErrorComponent.vue';
import LoadingComponent from '@/common_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const SettingAccount = defineAsyncComponent({
    loader: () => import('@/views/settings/SettingAccount.vue'),
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
    <main class="p-12">
        <SettingAccount v-if="props.page == 'account'" />
    </main>
</template>
