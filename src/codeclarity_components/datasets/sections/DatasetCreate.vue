<script setup lang="ts">
import { ArrowLeft, LoaderCircle } from "@lucide/vue";
import { computed, onMounted, ref } from "vue";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import TextLink from "@/codeclarity_components/authentication/layout/TextLink.vue";
import {
  IntegrationProvider,
  type VCS,
} from "@/codeclarity_components/organizations/integrations/Integrations";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import { Card, CardContent } from "@/shadcn/ui/card";
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

/** Links a field to its hint and its error, so screen readers announce both. */
function describedBy(field: keyof FormErrors, hint?: string): string {
  return [hint, errorFor(field) ? `dataset-${field}-error` : undefined]
    .filter(Boolean)
    .join(" ");
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
  <div class="flex max-w-3xl flex-col gap-8">
    <div class="flex flex-col gap-3">
      <RouterLink
        :to="{ name: 'datasets' }"
        class="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft aria-hidden="true" class="size-4" />
        Datasets
      </RouterLink>
      <PageHeading>
        New <BrandEmphasis>Dataset</BrandEmphasis>
        <template #description>
          Rank GitHub repositories by stars and keep the first ones whose root
          commits a <code class="font-mono text-sm">package.json</code> and a
          lockfile (<code class="font-mono text-sm">package-lock.json</code>,
          <code class="font-mono text-sm">yarn.lock</code>,
          <code class="font-mono text-sm">pnpm-lock.yaml</code> or
          <code class="font-mono text-sm">npm-shrinkwrap.json</code>).
        </template>
      </PageHeading>
    </div>

    <Card class="rounded-card shadow-card">
      <CardContent class="pt-6">
        <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
          <div class="flex flex-col gap-2">
            <Label for="dataset-name">Name</Label>
            <Input
              id="dataset-name"
              v-model="name"
              placeholder="top100-2026-10"
              data-testid="dataset-name"
              :aria-invalid="errorFor('name') ? true : undefined"
              :aria-describedby="describedBy('name') || undefined"
            />
            <p
              v-if="errorFor('name')"
              id="dataset-name-error"
              class="text-sm text-destructive"
            >
              {{ errorFor("name") }}
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <Label for="dataset-integration">GitHub integration</Label>
            <p
              v-if="!loadingIntegrations && integrations.length === 0"
              class="text-sm text-muted-foreground"
            >
              No valid GitHub integration (an expired token counts as invalid).
              <TextLink
                :to="{
                  name: 'orgs',
                  params: {
                    action: 'manage',
                    page: 'integrations',
                    orgId: userStore.getDefaultOrg?.id,
                  },
                }"
              >
                Add one
              </TextLink>
              to build Datasets.
            </p>
            <Select v-else v-model="integrationId">
              <SelectTrigger
                id="dataset-integration"
                data-testid="dataset-integration"
                :aria-invalid="errorFor('integration') ? true : undefined"
                :aria-describedby="
                  describedBy('integration', 'dataset-integration-hint')
                "
              >
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
            <p
              id="dataset-integration-hint"
              class="text-sm text-muted-foreground"
            >
              Its token is used for every GitHub request of the build.
            </p>
            <p
              v-if="errorFor('integration')"
              id="dataset-integration-error"
              class="text-sm text-destructive"
            >
              {{ errorFor("integration") }}
            </p>
          </div>

          <fieldset
            class="flex flex-col gap-2"
            :aria-describedby="describedBy('languages') || undefined"
          >
            <legend class="mb-2 text-sm font-medium leading-none">
              Languages
            </legend>
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
            <p
              v-if="errorFor('languages')"
              id="dataset-languages-error"
              class="text-sm text-destructive"
            >
              {{ errorFor("languages") }}
            </p>
          </fieldset>

          <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col gap-2">
              <Label for="dataset-limit">Repositories</Label>
              <Input
                id="dataset-limit"
                v-model="limit"
                type="number"
                min="1"
                :max="MAX_LIMIT"
                data-testid="dataset-limit"
                :aria-invalid="errorFor('limit') ? true : undefined"
                :aria-describedby="describedBy('limit') || undefined"
              />
              <p
                v-if="errorFor('limit')"
                id="dataset-limit-error"
                class="text-sm text-destructive"
              >
                {{ errorFor("limit") }}
              </p>
            </div>
            <div class="flex flex-col gap-2">
              <Label for="dataset-pages">Search pages per language</Label>
              <Input
                id="dataset-pages"
                v-model="pages"
                type="number"
                min="1"
                :max="MAX_PAGES"
                data-testid="dataset-pages"
                :aria-invalid="errorFor('pages') ? true : undefined"
                :aria-describedby="describedBy('pages', 'dataset-pages-hint')"
              />
              <p id="dataset-pages-hint" class="text-xs text-muted-foreground">
                100 candidates per page
              </p>
              <p
                v-if="errorFor('pages')"
                id="dataset-pages-error"
                class="text-sm text-destructive"
              >
                {{ errorFor("pages") }}
              </p>
            </div>
            <div class="flex flex-col gap-2">
              <Label for="dataset-min-stars">Minimum stars</Label>
              <Input
                id="dataset-min-stars"
                v-model="minStars"
                type="number"
                min="0"
                data-testid="dataset-min-stars"
                :aria-invalid="errorFor('minStars') ? true : undefined"
                :aria-describedby="describedBy('minStars') || undefined"
              />
              <p
                v-if="errorFor('minStars')"
                id="dataset-minStars-error"
                class="text-sm text-destructive"
              >
                {{ errorFor("minStars") }}
              </p>
            </div>
          </div>

          <div class="flex justify-end">
            <Button
              type="submit"
              :disabled="submitting"
              data-testid="dataset-submit"
              arrow
            >
              <LoaderCircle
                v-if="submitting"
                aria-hidden="true"
                class="animate-spin motion-reduce:animate-none"
              />
              Build Dataset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
