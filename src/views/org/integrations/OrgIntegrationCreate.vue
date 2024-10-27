<script lang="ts" setup>
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/repositories/types/entities/Organization';
import router from '@/router';
import { ref, type Ref } from 'vue';
import OrgHeaderItem from '@/views/org/subcomponents/OrgHeaderItem.vue';
import { IntegrationProvider } from '@/repositories/types/entities/Integrations';
import OrgIntegrationAddGithub from '@/views/org/integrations/github/OrgIntegrationAddGithub.vue';
import OrgIntegrationAddGitlab from '@/views/org/integrations/gitlab/OrgIntegrationAddGitlab.vue';

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
        <OrgHeaderItem
            v-if="orgId"
            :org-id="orgId"
            @on-org-info="setOrgInfo($event)"
        ></OrgHeaderItem>
        <div class="org-integrations-create-wrapper">
            <OrgIntegrationAddGithub
                v-if="provider == IntegrationProvider.GITHUB"
            ></OrgIntegrationAddGithub>
            <OrgIntegrationAddGitlab
                v-if="provider == IntegrationProvider.GITLAB"
            ></OrgIntegrationAddGitlab>
        </div>
    </div>
</template>
