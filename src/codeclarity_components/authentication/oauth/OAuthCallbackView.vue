<script lang="ts" setup>
import type { SocialProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/base_components/ErrorComponent.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const OAuth2Callback = defineAsyncComponent({
    loader: () => import('./OAuth2Callback.vue'),
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

state.page = 'main';

const props = defineProps<{
    provider: SocialProvider;
}>();
</script>

<template>
    <main class="p-12">
        <OAuth2Callback :provider="props.provider" />
    </main>
</template>
