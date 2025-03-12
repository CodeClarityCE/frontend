<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import Toaster from '@/shadcn/ui/toast/Toaster.vue';

import { useAuthStore } from '@/stores/auth';

import ErrorComponent from '@/base_components/ErrorComponent.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const HeaderComponent = defineAsyncComponent({
    loader: () => import('@/codeclarity_components/header/HeaderComponent.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const authStore = useAuthStore();
const route = useRoute();
</script>

<template>
    <HeaderComponent v-if="authStore.getAuthenticated"></HeaderComponent>
    <div>
        <RouterView :key="route.fullPath" />
    </div>
    <Toaster />
</template>
