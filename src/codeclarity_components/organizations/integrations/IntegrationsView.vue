<script lang="ts" setup>
import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const OrgIntegrationsList = defineAsyncComponent({
    loader: () => import('./IntegrationsList.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgIntegrationCreate = defineAsyncComponent({
    loader: () => import('./IntegrationCreate.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgIntegrationEdit = defineAsyncComponent({
    loader: () => import('./IntegrationEdit.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

defineProps<{
    page: string;
    orgId: string;
    action?: string;
}>();
</script>
<template>
    <OrgIntegrationsList v-if="action == 'manage'" :page="page" :org-id="orgId" />
    <OrgIntegrationCreate v-else-if="action == 'add'" :page="page" :org-id="orgId" />
    <OrgIntegrationEdit v-else-if="action == 'edit'" :page="page" :org-id="orgId" />
</template>
