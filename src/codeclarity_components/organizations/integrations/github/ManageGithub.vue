<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ref } from "vue";
import { useRoute } from "vue-router";

import { GithubTokenType } from "@/codeclarity_components/organizations/integrations/integration_add.http";
import {
  type GithubIntegration,
  IntegrationProvider,
} from "@/codeclarity_components/organizations/integrations/Integrations";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { errorToast, successToast } from "@/utils/toasts";

import OrgIntegrationManageTokenBasedIntegration from "../IntegrationManageTokenBasedIntegration.vue";

const props = defineProps<{ orgId: string }>();

const authStore = useAuthStore();
const integrationRepo = new IntegrationsRepository();
const route = useRoute();

const integrationId =
  typeof route.query.integrationId === "string"
    ? route.query.integrationId
    : undefined;

const integration = ref<GithubIntegration>();
const loading = ref(true);
const error = ref(false);
const errorCode = ref<string>();
const deleting = ref(false);

async function fetchIntegration(): Promise<void> {
  if (!integrationId || !authStore.getToken) return;
  loading.value = true;
  error.value = false;
  errorCode.value = undefined;
  try {
    integration.value = await integrationRepo.getGithubIntegration({
      orgId: props.orgId,
      integrationId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
  } catch (err) {
    error.value = true;
    if (err instanceof BusinessLogicError) errorCode.value = err.error_code;
  } finally {
    loading.value = false;
  }
}

async function deleteIntegration(): Promise<void> {
  if (!integrationId || !authStore.getToken) return;
  deleting.value = true;
  try {
    await integrationRepo.deleteIntegration({
      orgId: props.orgId,
      integrationId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    successToast("Deleted the GitHub integration");
    void router.push({
      name: "orgs",
      params: { orgId: props.orgId, page: "integrations", action: "manage" },
    });
  } catch (err) {
    if (
      err instanceof BusinessLogicError &&
      err.error_code === APIErrors.NotAuthorized
    ) {
      errorToast("You are not authorized to perform this action.");
    } else {
      errorToast("Failed to delete the integration.");
    }
  } finally {
    deleting.value = false;
  }
}

if (integrationId) void fetchIntegration();
else router.back();
</script>
<template>
  <OrgIntegrationManageTokenBasedIntegration
    name="GitHub"
    :integration="integration"
    :loading="loading"
    :error="error"
    :error-code="errorCode"
    :deleting="deleting"
    :update-route="{
      name: 'orgs',
      params: { action: 'add', page: 'integrations', orgId: orgId },
      query: { update: integrationId, provider: IntegrationProvider.GITHUB },
    }"
    @refresh="fetchIntegration()"
    @delete="deleteIntegration()"
  >
    <template #header-integration-icon>
      <Icon icon="devicon:github" aria-hidden="true" class="size-8" />
    </template>
    <template #header-integration-description>
      Your organization imports repositories from GitHub with this token.
    </template>
    <template #token-type>
      <template v-if="integration?.token_type === GithubTokenType.CLASSIC_TOKEN"
        >Classic token</template
      >
      <template v-else>OAuth token</template>
    </template>
  </OrgIntegrationManageTokenBasedIntegration>
</template>
