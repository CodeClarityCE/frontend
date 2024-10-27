<script lang="ts" setup>
import { useStateStore } from '@/stores/state';

import ErrorComponent from '@/common_components/ErrorComponent.vue';
import LoadingComponent from '@/common_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const OrgsList = defineAsyncComponent({
    loader: () => import('@/views/org/OrgsList.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const CreateOrg = defineAsyncComponent({
    loader: () => import('@/views/org/OrgCreate.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OrgsManage = defineAsyncComponent({
    loader: () => import('@/views/org/OrgManage.vue'),
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

const props = defineProps<{
    action?: string;
    page?: string;
    orgId?: string;
}>();
</script>
<template>
    <main class="p-12">
        <CreateOrg v-if="props.action == 'add' && !props.orgId" />
        <OrgsList v-else-if="props.action == 'list' && !props.orgId" />
        <OrgsManage v-else :page="props.page" :orgId="props.orgId" :action="props.action" />
    </main>
</template>
