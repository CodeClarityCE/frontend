<script lang="ts" setup>
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import { useStateStore } from '@/stores/state';
import { defineAsyncComponent } from 'vue';

const ProjectsList = defineAsyncComponent({
    loader: () => import('./list/ProjectsList.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const CreateProject = defineAsyncComponent({
    loader: () => import('./create/CreateProject.vue'),
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

state.page = 'projects';

const props = defineProps<{
    page?: string;
}>();
</script>
<template>
    <main class="p-8 space-y-6">
        <CreateProject v-if="props.page === 'add'" />
        <ProjectsList v-else />
    </main>
</template>
