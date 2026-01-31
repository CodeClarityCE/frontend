<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { type Ref, ref, watch } from "vue";

import { InfoCard, PageHeader } from "@/base_components";
import BoxLoader from "@/base_components/ui/loaders/BoxLoader.vue";
import {
  IntegrationProvider,
  type VCS,
} from "@/codeclarity_components/organizations/integrations/Integrations";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import router from "@/router";
import Button from "@/shadcn/ui/button/Button.vue";
import { useAuthStore } from "@/stores/auth";
import { useStateStore } from "@/stores/state";
import { useUserStore } from "@/stores/user";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

import GithubImportComponent from "./import/GithubImportComponent.vue";
import GitlabImportComponent from "./import/GitlabImportComponent.vue";
import LocalUploadComponent from "./import/LocalUploadComponent.vue";
import Integrations from "./integrations/IntegrationsComponent.vue";
import NoIntegration from "./integrations/NoIntegration.vue";

// Repositories
const integrationRepo: IntegrationsRepository = new IntegrationsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();
const stateStore = useStateStore();

const { defaultOrg } = storeToRefs(userStore);

watch(defaultOrg!, () => {
  void fetchVcsIntegrations(true);
});

stateStore.$reset();
stateStore.page = "projects";

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const selectedVCS: Ref<VCS | undefined> = ref();
const showLocalUpload: Ref<boolean> = ref(false);

// Data setup
const vcsIntegrations: Ref<VCS[]> = ref([]);

// Methods
async function fetchVcsIntegrations(refresh = false): Promise<void> {
  if (!defaultOrg!.value!.id) return;
  if (!(authStore.getAuthenticated && authStore.getToken)) return;

  error.value = false;
  errorCode.value = undefined;
  if (!refresh) loading.value = true;

  try {
    const resp = await integrationRepo.getVCS({
      orgId: defaultOrg!.value!.id,
      bearerToken: authStore.getToken,
      pagination: {
        page: 0,
        entries_per_page: 100,
      },
      handleBusinessErrors: true,
    });
    vcsIntegrations.value = resp.data.filter((vcs) => !vcs.invalid);
    if (vcsIntegrations.value.length === 1) {
      selectedVCS.value = vcsIntegrations.value[0];
    }
  } catch (_err) {
    error.value = true;
    if (_err instanceof BusinessLogicError) {
      errorCode.value = _err.error_code;
    }
  } finally {
    loading.value = false;
  }
}

async function onIntegrationsRefresh(): Promise<void> {
  await fetchVcsIntegrations();
}

async function onSelectedVCS(vcs: VCS): Promise<void> {
  selectedVCS.value = vcs;
}

function onLocalUpload(): void {
  showLocalUpload.value = true;
}

void fetchVcsIntegrations();
</script>

<template>
  <main class="min-h-screen bg-white p-6">
    <!-- Page Header -->
    <PageHeader
      title="Import Project"
      description="Connect your repositories to start security analysis"
      :show-last-updated="false"
      :show-refresh="false"
    />

    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BoxLoader
          v-for="i in 4"
          :key="i"
          :dimensions="{ width: '100%', height: '120px' }"
        />
      </div>
    </div>

    <div v-else class="space-y-8">
      <!-- Error State -->
      <InfoCard
        v-if="error"
        title="Connection Error"
        description="We encountered an issue while fetching your integrations"
        icon="solar:confounded-square-bold"
        variant="danger"
      >
        <div class="space-y-4">
          <div class="p-4 bg-red-50 rounded-lg border border-red-200">
            <div class="flex items-start gap-3">
              <Icon
                icon="solar:danger-triangle-bold"
                class="h-5 w-5 text-red-600 mt-0.5"
              />
              <div>
                <p class="font-medium text-red-800">
                  Failed to fetch VCS integrations
                </p>
                <p class="text-sm text-red-700 mt-1">
                  {{
                    errorCode
                      ? "We encountered an error while processing the request."
                      : "Please check your connection and try again."
                  }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <Button
              class="bg-theme-primary hover:bg-theme-primary/90 text-white"
              @click="fetchVcsIntegrations()"
            >
              <Icon icon="solar:refresh-bold" class="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              class="border-gray-300 text-gray-700 hover:border-theme-primary hover:text-theme-primary"
              @click="router.back()"
            >
              Go Back
            </Button>
          </div>
        </div>
      </InfoCard>

      <!-- Local Upload State -->
      <LocalUploadComponent v-else-if="!error && showLocalUpload" />

      <!-- VCS Selection State -->
      <template v-else-if="!error && !selectedVCS && !showLocalUpload">
        <!-- No Integrations -->
        <div v-if="vcsIntegrations.length === 0">
          <NoIntegration
            :default-org="defaultOrg!"
            @on-refresh="onIntegrationsRefresh"
            @on-local-upload="onLocalUpload"
          />
        </div>

        <!-- Multiple Integrations -->
        <div v-else-if="vcsIntegrations.length > 0">
          <InfoCard
            title="Select Integration"
            description="Choose the version control system or upload a local project"
            icon="solar:code-bold"
            variant="primary"
          >
            <Integrations
              :vcs-integrations="vcsIntegrations"
              @on-selected-v-c-s="onSelectedVCS"
              @on-local-upload="onLocalUpload"
            />
          </InfoCard>
        </div>
      </template>

      <!-- Import Repository State -->
      <div v-else-if="!error && selectedVCS" class="space-y-8">
        <!-- Integration Info -->
        <InfoCard
          title="Repository Import"
          description="Browse and select repositories to import for security analysis"
          icon="solar:folder-bold"
          variant="primary"
        >
          <div
            class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="p-2 bg-theme-primary/10 rounded-lg">
              <Icon
                v-if="
                  selectedVCS.integration_provider ===
                  IntegrationProvider.GITHUB
                "
                icon="simple-icons:github"
                class="h-6 w-6 text-theme-black"
              />
              <Icon
                v-else-if="
                  selectedVCS.integration_provider ===
                  IntegrationProvider.GITLAB
                "
                icon="simple-icons:gitlab"
                class="h-6 w-6 text-theme-black"
              />
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-theme-black">
                {{ selectedVCS.integration_provider }}
              </h4>
              <p class="text-sm text-theme-gray">
                Connected and ready to import
              </p>
            </div>
            <div
              class="px-3 py-1 bg-theme-primary/10 text-theme-primary text-xs font-medium rounded-full"
            >
              Active
            </div>
          </div>
        </InfoCard>

        <!-- Repository Import Component -->
        <GithubImportComponent
          v-if="selectedVCS.integration_provider === IntegrationProvider.GITHUB"
          :integration="selectedVCS.id"
        />
        <GitlabImportComponent
          v-if="selectedVCS.integration_provider === IntegrationProvider.GITLAB"
          :integration="selectedVCS.id"
        />
      </div>
    </div>
  </main>
</template>
