<script lang="ts" setup>
import { ArrowLeft } from "@lucide/vue";
import { storeToRefs } from "pinia";
import { computed, type Ref, ref, watch } from "vue";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import {
  IntegrationProvider,
  type VCS,
} from "@/codeclarity_components/organizations/integrations/Integrations";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Skeleton } from "@/shadcn/ui/skeleton";
import { useAuthStore } from "@/stores/auth";
import { useStateStore } from "@/stores/state";
import { useUserStore } from "@/stores/user";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

import GithubImportComponent from "./import/GithubImportComponent.vue";
import GitlabImportComponent from "./import/GitlabImportComponent.vue";
import LocalUploadComponent from "./import/LocalUploadComponent.vue";
import PopularGithubImportComponent from "./import/PopularGithubImportComponent.vue";
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
/** True when the selected GitHub VCS serves the "Popular on GitHub" list. */
const popularGithub: Ref<boolean> = ref(false);

// Data setup
const vcsIntegrations: Ref<VCS[]> = ref([]);

// The heading of the chosen import method.
const methodTitle = computed(() => {
  if (showLocalUpload.value) return "Upload an archive";
  if (popularGithub.value) return "Popular on GitHub";
  if (selectedVCS.value?.integration_provider === IntegrationProvider.GITLAB)
    return "GitLab repositories";
  return "GitHub repositories";
});

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
  popularGithub.value = false;
}

function onPopularGithub(vcs: VCS): void {
  selectedVCS.value = vcs;
  popularGithub.value = true;
}

function onLocalUpload(): void {
  showLocalUpload.value = true;
}

function goBackToSelection(): void {
  selectedVCS.value = undefined;
  showLocalUpload.value = false;
  popularGithub.value = false;
}

void fetchVcsIntegrations();
</script>

<template>
  <PageHeading
    description="Import a repository through an integration, or upload an archive."
  >
    Add a <BrandEmphasis>Project</BrandEmphasis>
  </PageHeading>

  <div
    v-if="loading"
    role="status"
    aria-label="Loading the import methods"
    class="grid grid-cols-4 gap-4"
  >
    <Skeleton v-for="i in 4" :key="i" class="h-32 rounded-card" />
  </div>

  <Alert v-else-if="error" variant="destructive">
    <AlertDescription class="flex flex-col gap-3">
      <p>
        The integrations could not be loaded.
        {{
          errorCode
            ? "The server could not process the request."
            : "Check your connection and try again."
        }}
      </p>
      <Button
        variant="outline"
        size="sm"
        class="w-fit"
        @click="fetchVcsIntegrations()"
      >
        Try again
      </Button>
    </AlertDescription>
  </Alert>

  <template v-else-if="!selectedVCS && !showLocalUpload">
    <NoIntegration
      v-if="vcsIntegrations.length === 0"
      :default-org="defaultOrg!"
      @on-refresh="onIntegrationsRefresh"
      @on-local-upload="onLocalUpload"
    />
    <section
      v-else
      aria-labelledby="import-methods-title"
      class="flex flex-col gap-4"
    >
      <h2
        id="import-methods-title"
        class="text-xl font-semibold text-foreground-strong"
      >
        Choose where the project comes from
      </h2>
      <Integrations
        :vcs-integrations="vcsIntegrations"
        @on-selected-v-c-s="onSelectedVCS"
        @on-local-upload="onLocalUpload"
        @on-popular-github="onPopularGithub"
      />
    </section>
  </template>

  <section
    v-else
    aria-labelledby="import-method-title"
    class="flex flex-col gap-6"
  >
    <div class="flex flex-col items-start gap-2">
      <Button
        variant="ghost"
        size="sm"
        class="-ml-3"
        @click="goBackToSelection"
      >
        <ArrowLeft aria-hidden="true" />
        Back to import methods
      </Button>
      <h2
        id="import-method-title"
        class="text-xl font-semibold text-foreground-strong"
      >
        {{ methodTitle }}
      </h2>
      <p v-if="popularGithub" class="text-sm text-muted-foreground">
        The 100 most-starred JavaScript, TypeScript and PHP repositories,
        imported through your GitHub integration.
      </p>
    </div>

    <LocalUploadComponent v-if="showLocalUpload" />
    <PopularGithubImportComponent
      v-else-if="popularGithub && selectedVCS"
      :integration="selectedVCS.id"
    />
    <GithubImportComponent
      v-else-if="
        selectedVCS?.integration_provider === IntegrationProvider.GITHUB
      "
      :integration="selectedVCS.id"
    />
    <GitlabImportComponent
      v-else-if="
        selectedVCS?.integration_provider === IntegrationProvider.GITLAB
      "
      :integration="selectedVCS.id"
    />
  </section>
</template>
