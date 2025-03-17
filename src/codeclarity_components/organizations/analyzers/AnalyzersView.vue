<script lang="ts" setup>
import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/base_components/ErrorComponent.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const OrgAnalyzersList = defineAsyncComponent({
    loader: () => import('./AnalyzersList.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgAnalyzerEdit = defineAsyncComponent({
    loader: () => import('./AnalyzerEdit.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgAnalyzerCreate = defineAsyncComponent({
    loader: () => import('./AnalyzerCreate.vue'),
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

state.page = 'orgs';

defineProps<{
    page: string;
    orgId: string;
    action?: string;
}>();
</script>
<template>
    <OrgAnalyzersList v-if="action == 'manage'" :page="page" :org-id="orgId" />
    <OrgAnalyzerEdit v-else-if="action == 'edit'" :page="page" :org-id="orgId" />
    <OrgAnalyzerCreate v-else-if="action == 'add'" :page="page" :org-id="orgId" />
</template>
