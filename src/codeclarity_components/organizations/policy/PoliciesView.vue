<script lang="ts" setup>
import ErrorComponent from '@/base_components/ErrorComponent.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const OrgPoliciesList = defineAsyncComponent({
    loader: () => import('./list/PoliciesList.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgPoliciesCreate = defineAsyncComponent({
    loader: () => import('./create/PolicyCreate.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgPoliciesEdit = defineAsyncComponent({
    loader: () => import('./edit/PolicyEdit.vue'),
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
    <OrgPoliciesList v-if="action == 'manage'" :page="page" :org-id="orgId" />
    <OrgPoliciesCreate v-else-if="action == 'add'" :page="page" :org-id="orgId" />
    <OrgPoliciesEdit v-else-if="action == 'edit'" :page="page" :org-id="orgId" />
</template>
