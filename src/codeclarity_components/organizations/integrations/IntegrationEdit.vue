<script lang="ts" setup>
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/codeclarity_components/organizations/organization.entity';
import router from '@/router';
import { ref, type Ref } from 'vue';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import OrgIntegrationManageGithub from './github/ManageGithub.vue';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import OrgIntegrationManageGitlab from './gitlab/ManageGitlab.vue';
import { useRoute } from 'vue-router';

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
        router.push({
            name: 'orgs',
            params: { action: 'manage', page: 'integrations', orgId: _orgInfo.id }
        });
    }
}

const route = useRoute();
provider.value = route.query.provider as IntegrationProvider;
</script>
<template>
    <div class="flex flex-col gap-8 org-manage-integration-create">
        <HeaderItem
            v-if="orgId"
            :orgId="orgId"
            @on-org-info="setOrgInfo($event)"
        ></HeaderItem>
        <div class="org-integrations-create-wrapper">
            <OrgIntegrationManageGithub
                v-if="provider == IntegrationProvider.GITHUB"
                :orgId="orgId"
            />
            <OrgIntegrationManageGitlab
                v-else-if="provider == IntegrationProvider.GITLAB"
                :orgId="orgId"
            />
        </div>
    </div>
</template>
