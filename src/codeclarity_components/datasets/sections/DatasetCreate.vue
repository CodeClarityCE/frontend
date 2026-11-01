<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";

import {
  IntegrationProvider,
  type VCS,
} from "@/codeclarity_components/organizations/integrations/Integrations";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { errorToast, successToast } from "@/utils/toasts";

import { DatasetLanguage } from "../dataset.entity";
import { DatasetsRepository } from "../datasets.repository";

/** Bounds enforced by the API (CreateDatasetBody) */
const MAX_LIMIT = 500;
const MAX_PAGES = 10;

const userStore = useUserStore();
const auth = useAuthStore();
const datasetsRepository = new DatasetsRepository();
const integrationsRepository = new IntegrationsRepository();

const name = ref("");
const integrationId = ref("");
const limit = ref<number | string>(100);
const pages = ref<number | string>(3);
const minStars = ref<number | string>(1000);
const languages = ref<Record<DatasetLanguage, boolean>>({
  [DatasetLanguage.JAVASCRIPT]: true,
  [DatasetLanguage.TYPESCRIPT]: true,
});

const integrations = ref<VCS[]>([]);
const loadingIntegrations = ref(true);
const submitting = ref(false);
const submitted = ref(false);

const selectedLanguages = computed(() =>
  Object.values(DatasetLanguage).filter(
    (language) => languages.value[language],
  ),
);

interface FormErrors {
  name?: string;
  integration?: string;
  limit?: string;
  pages?: string;
  minStars?: string;
  languages?: string;
}

function isIntegerBetween(
  value: number | string,
  min: number,
  max: number,
): boolean {
  const number = Number(value);
  return (
    value !== "" && Number.isInteger(number) && number >= min && number <= max
  );
}

const errors = computed(() => {
  const result: FormErrors = {};
  const trimmed = name.value.trim();
  if (trimmed.length === 0) result.name = "A name is required";
  else if (trimmed.length > 100) result.name = "At most 100 characters";
  if (!integrationId.value) result.integration = "Pick a GitHub integration";
  if (!isIntegerBetween(limit.value, 1, MAX_LIMIT)) {
    result.limit = `A whole number between 1 and ${MAX_LIMIT}`;
  }
  if (!isIntegerBetween(pages.value, 1, MAX_PAGES)) {
    result.pages = `A whole number between 1 and ${MAX_PAGES}`;
  }
  if (!isIntegerBetween(minStars.value, 0, Number.MAX_SAFE_INTEGER)) {
    result.minStars = "A whole number, 0 or more";
  }
  if (selectedLanguages.value.length === 0) {
    result.languages = "Pick at least one language";
  }
  return result;
});

const isValid = computed(() => Object.keys(errors.value).length === 0);

/** Shown only once the user tried to submit, so the form starts clean. */
function errorFor(field: keyof FormErrors): string | undefined {
  return submitted.value ? errors.value[field] : undefined;
}

async function loadIntegrations(): Promise<void> {
  const orgId = userStore.getDefaultOrg?.id;
  if (!orgId || !auth.getToken) return;
  try {
    const response = await integrationsRepository.getVCS({
      orgId,
      pagination: { page: 0, entries_per_page: 100 },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    // An expired token is not flagged invalid by the API, but GitHub rejects it
    const now = Date.now();
    integrations.value = response.data.filter(
      (integration) =>
        integration.integration_provider === IntegrationProvider.GITHUB &&
        !integration.invalid &&
        !(
          integration.expiry_date &&
          new Date(integration.expiry_date).getTime() <= now
        ),
    );
    const [first] = integrations.value;
    if (integrations.value.length === 1 && first) {
      integrationId.value = first.id;
    }
  } catch {
    errorToast("Failed to load the GitHub integrations");
  } finally {
    loadingIntegrations.value = false;
  }
}

async function submit(): Promise<void> {
  submitted.value = true;
  const orgId = userStore.getDefaultOrg?.id;
  if (!isValid.value || !orgId || !auth.getToken || submitting.value) return;

  submitting.value = true;
  try {
    const created = await datasetsRepository.createDataset({
      orgId,
      data: {
        name: name.value.trim(),
        integration_id: integrationId.value,
        limit: Number(limit.value),
        pages: Number(pages.value),
        min_stars: Number(minStars.value),
        languages: selectedLanguages.value,
      },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
    });
    successToast("Dataset created, building in the background");
    void router.push({
      name: "datasets",
      params: { page: "detail" },
      query: { id: created.id },
    });
  } catch (err) {
    if (
      err instanceof BusinessLogicError &&
      err.error_code === APIErrors.AlreadyExists
    ) {
      errorToast("A dataset with this name already exists");
    } else if (
      err instanceof BusinessLogicError &&
      err.error_code === APIErrors.NotAuthorized
    ) {
      errorToast("Only organization admins can create datasets");
    } else {
      errorToast("Failed to create the dataset");
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(() => void loadIntegrations());
</script>

<template>
  <div class="space-y-8 max-w-3xl">
    <div>
      <RouterLink
        :to="{ name: 'datasets' }"
        class="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
      >
        <Icon icon="solar:arrow-left-linear" class="h-4 w-4" />
        Datasets
      </RouterLink>
      <h1 class="text-4xl font-bold tracking-tight text-gray-900 mt-2">
        New dataset
      </h1>
      <p class="text-gray-600 mt-2 text-lg">
        Rank GitHub repositories by stars and keep the first ones whose root
        commits a <code>package.json</code> and a lockfile
        (<code>package-lock.json</code>, <code>yarn.lock</code>,
        <code>pnpm-lock.yaml</code> or <code>npm-shrinkwrap.json</code>).
      </p>
    </div>

    <form
      class="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
      novalidate
      @submit.prevent="submit"
    >
      <div class="space-y-2">
        <Label for="dataset-name">Name</Label>
        <Input
          id="dataset-name"
          v-model="name"
          placeholder="top100-2026-10"
          data-testid="dataset-name"
        />
        <p v-if="errorFor('name')" class="text-sm text-red-600">
          {{ errorFor("name") }}
        </p>
      </div>

      <div class="space-y-2">
        <Label>GitHub integration</Label>
        <p
          v-if="!loadingIntegrations && integrations.length === 0"
          class="text-sm text-gray-600"
        >
          No valid GitHub integration (an expired token counts as invalid).
          <RouterLink
            :to="{
              name: 'orgs',
              params: {
                action: 'manage',
                page: 'integrations',
                orgId: userStore.getDefaultOrg?.id,
              },
            }"
            class="underline"
          >
            Add one
          </RouterLink>
          to build datasets.
        </p>
        <Select v-else v-model="integrationId">
          <SelectTrigger data-testid="dataset-integration">
            <SelectValue placeholder="Select an integration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="integration in integrations"
              :key="integration.id"
              :value="integration.id"
            >
              {{ integration.service_domain }} (added by
              {{ integration.added_by }})
            </SelectItem>
          </SelectContent>
        </Select>
        <p class="text-sm text-gray-500">
          Its token is used for every GitHub request of the build.
        </p>
        <p v-if="errorFor('integration')" class="text-sm text-red-600">
          {{ errorFor("integration") }}
        </p>
      </div>

      <div class="space-y-2">
        <Label>Languages</Label>
        <div class="flex gap-6">
          <label
            v-for="language in Object.values(DatasetLanguage)"
            :key="language"
            class="flex items-center gap-2 text-sm"
          >
            <Checkbox
              v-model="languages[language]"
              :data-testid="`dataset-language-${language}`"
            />
            {{ language }}
          </label>
        </div>
        <p v-if="errorFor('languages')" class="text-sm text-red-600">
          {{ errorFor("languages") }}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="space-y-2">
          <Label for="dataset-limit">Repositories</Label>
          <Input
            id="dataset-limit"
            v-model="limit"
            type="number"
            min="1"
            :max="MAX_LIMIT"
            data-testid="dataset-limit"
          />
          <p v-if="errorFor('limit')" class="text-sm text-red-600">
            {{ errorFor("limit") }}
          </p>
        </div>
        <div class="space-y-2">
          <Label for="dataset-pages">Search pages per language</Label>
          <Input
            id="dataset-pages"
            v-model="pages"
            type="number"
            min="1"
            :max="MAX_PAGES"
            data-testid="dataset-pages"
          />
          <p class="text-xs text-gray-500">100 candidates per page</p>
          <p v-if="errorFor('pages')" class="text-sm text-red-600">
            {{ errorFor("pages") }}
          </p>
        </div>
        <div class="space-y-2">
          <Label for="dataset-min-stars">Minimum stars</Label>
          <Input
            id="dataset-min-stars"
            v-model="minStars"
            type="number"
            min="0"
            data-testid="dataset-min-stars"
          />
          <p v-if="errorFor('minStars')" class="text-sm text-red-600">
            {{ errorFor("minStars") }}
          </p>
        </div>
      </div>

      <div class="flex justify-end">
        <Button
          type="submit"
          :disabled="submitting"
          data-testid="dataset-submit"
        >
          <Icon
            v-if="submitting"
            icon="solar:loading-linear"
            class="h-4 w-4 mr-2 animate-spin"
          />
          Build dataset
        </Button>
      </div>
    </form>
  </div>
</template>
