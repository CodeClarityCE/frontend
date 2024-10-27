<script lang="ts" setup>
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/repositories/types/entities/Organization';
import router from '@/router';
import { ref, type Ref } from 'vue';
import OrgHeaderItem from '@/views/org/subcomponents/OrgHeaderItem.vue';
import OrgIntegrationManageGithub from '@/views/org/integrations/github/OrgIntegrationManageGithub.vue';
import { IntegrationProvider } from '@/repositories/types/entities/Integrations';
import OrgIntegrationManageGitlab from '@/views/org/integrations/gitlab/OrgIntegrationManageGitlab.vue';
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
        <OrgHeaderItem
            v-if="orgId"
            :orgId="orgId"
            @on-org-info="setOrgInfo($event)"
        ></OrgHeaderItem>
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
