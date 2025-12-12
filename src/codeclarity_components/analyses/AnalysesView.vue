<script lang="ts" setup>
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import { useStateStore } from '@/stores/state';
import { defineAsyncComponent } from 'vue';

const MainPage = defineAsyncComponent({
    loader: () => import('@/codeclarity_components/projects/ProjectsView.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const CreateAnalysis = defineAsyncComponent({
    loader: () => import('./create/AnalysisCreate.vue'),
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
    page?: string;
}>();
</script>

<template>
    <main class="p-12">
        <CreateAnalysis v-if="props.page === 'add'" />
        <MainPage v-else />
    </main>
</template>
