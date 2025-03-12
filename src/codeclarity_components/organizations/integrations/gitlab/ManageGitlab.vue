<script lang="ts" setup>
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { IntegrationsRepository } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import { IntegrationProvider, GitlabIntegration } from '@/codeclarity_components/organizations/integrations/Integrations';
import { APIErrors } from '@/utils/api/ApiErrors';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { Icon } from '@iconify/vue';
import { ref, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import OrgIntegrationManageTokenBasedIntegration from '../IntegrationManageTokenBasedIntegration.vue';
import { errorToast, successToast } from '@/utils/toasts';
import { GitlabTokenType } from '@/codeclarity_components/organizations/integrations/integration_add.http';

const integration: Ref<GitlabIntegration | undefined> = ref();

// Repositories
const integrationRepo: IntegrationsRepository = new IntegrationsRepository();

// State
const integrationId: Ref<string | undefined> = ref();
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref('');
const loading: Ref<boolean> = ref(false);

const props = defineProps<{
    orgId: string;
}>();

// Stores
const authStore = useAuthStore();

async function fetchIntegration() {
    if (!integrationId.value) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;

    try {
        const _integration = await integrationRepo.getGitlabIntegration({
            orgId: props.orgId,
            integrationId: integrationId.value,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });

        integration.value = _integration;
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        loading.value = false;
    }
}

async function init() {
    const route = useRoute();
    const _integrationId = route.query.integrationId as string;

    if (!_integrationId) {
        router.back();
    }

    integrationId.value = _integrationId;
    await fetchIntegration();
}

async function deleteIntegration() {
    if (!integrationId.value) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    try {
        await integrationRepo.deleteGitlabIntegration({
            orgId: props.orgId,
            integrationId: integrationId.value,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });

        successToast('Succesfully deleted the integration');
        router.push({ name: 'orgManage', params: { page: 'integrations' } });
    } catch (_err) {
        if (_err instanceof BusinessLogicError) {
            if (_err.error_code == APIErrors.NotAuthorized) {
                errorToast('You are not authorized to perform this action.');
            } else if (_err.error_code == APIErrors.EntityNotFound) {
                errorToast('Succesfully deleted the integration');
            } else if (_err.error_code == APIErrors.InternalError) {
                errorToast('Failed to delete the integration.');
            } else {
                errorToast('Failed to delete the integration.');
            }
        } else {
            errorToast('Failed to delete the integration.');
        }
    }
}

init();
</script>
<template>
    <OrgIntegrationManageTokenBasedIntegration
        v-if="!loading && integration != undefined && integration != null"
        :error="error"
        :error-code="errorCode"
        :integration="integration"
        :provider="IntegrationProvider.GITHUB"
        :update-route="{
            name: 'orgs',
            params: { action: 'manage', page: 'integrations', orgId: orgId },
            query: { update: integrationId, provider: IntegrationProvider.GITHUB }
        }"
        @refresh="fetchIntegration()"
        @delete="deleteIntegration()"
    >
        <template #header-integration-icon>
            <Icon icon="devicon:gitlab" class="icon integration-icon"></Icon>
        </template>
        <template #header-integration-name> GitLab </template>
        <template #header-integration-description>
            Your organization is linked to GitLab.
        </template>
        <template #token-type>
            <div v-if="integration.token_type == GitlabTokenType.PERSONAL_ACCESS_TOKEN">
                Personal Access Token
            </div>
            <div v-else-if="integration.token_type == GitlabTokenType.OAUTH_TOKEN">OAuth Token</div>
        </template>
    </OrgIntegrationManageTokenBasedIntegration>
</template>
