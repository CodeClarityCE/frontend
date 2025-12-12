<script lang="ts" setup>
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    type Organization
} from '@/codeclarity_components/organizations/organization.entity';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import router from '@/router';
import { ref, type Ref } from 'vue';
import OrgIntegrationAddClickUp from './clickup/AddClickUp.vue';
import OrgIntegrationAddGithub from './github/AddGithub.vue';
import OrgIntegrationAddGitlab from './gitlab/AddGitlab.vue';

const provider: Ref<IntegrationProvider> = ref(IntegrationProvider.GITHUB);

// Props
defineProps<{
    orgId: string;
    page: string;
}>();

const orgInfo: Ref<Organization | undefined> = ref();

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
        router.push({ name: 'orgs', params: { page: '', orgId: _orgInfo.id } });
    }
}

const providerQuery = new URLSearchParams(window.location.search).get('provider');
if (providerQuery) {
    provider.value = providerQuery as IntegrationProvider;
}
</script>
<template>
    <div class="flex flex-col gap-8 org-manage-integration-create">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>
        <div class="org-integrations-create-wrapper">
            <OrgIntegrationAddGithub
                v-if="provider === IntegrationProvider.GITHUB"
            ></OrgIntegrationAddGithub>
            <OrgIntegrationAddGitlab
                v-if="provider === IntegrationProvider.GITLAB"
            ></OrgIntegrationAddGitlab>
            <OrgIntegrationAddClickUp
                v-if="provider === IntegrationProvider.CLICKUP"
            ></OrgIntegrationAddClickUp>
        </div>
    </div>
</template>
