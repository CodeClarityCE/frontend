<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ExternalLink } from "@lucide/vue";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import * as z from "zod";

import { GitlabTokenType } from "@/codeclarity_components/organizations/integrations/integration_add.http";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shadcn/ui/radio-group";
import { useAuthStore } from "@/stores/auth";
import { successToast } from "@/utils/toasts";

import { tokenIntegrationError } from "../integration-errors";
import TokenIntegrationForm from "../TokenIntegrationForm.vue";

const GITLAB_COM = "https://gitlab.com";
// The longest instance URL the API stores.
const MAX_URL_LENGTH = 255;
const gitlabPersonalAccessTokenRegex = /glpat-[0-9a-zA-Z\-_]{20}/;
const SCOPES = ["read_api", "read_user", "read_repository", "self_rotate"];
// Comma between scopes, full stop after the last one.
function scopeSeparator(index: number): string {
  return index < SCOPES.length - 1 ? ", " : ".";
}

const authStore = useAuthStore();
const integrationRepo = new IntegrationsRepository();
const route = useRoute();

const orgId = typeof route.params.orgId === "string" ? route.params.orgId : "";
const updateId =
  typeof route.query.update === "string" ? route.query.update : undefined;
const updating = updateId !== undefined;
// A replaced token keeps the integration's instance, loaded from the server.
const storedUrl = ref<string>();

const token = ref("");
const instance = ref<"cloud" | "self-hosted">("cloud");
const selfHostedUrl = ref("");
const busy = ref(false);
const apiError = ref<string>();

const instanceUrl = computed(() => {
  if (updating) return storedUrl.value ?? "";
  const url = instance.value === "cloud" ? GITLAB_COM : selfHostedUrl.value;
  return url.endsWith("/") ? url.slice(0, -1) : url;
});

// Checked on the URL as sent, without its trailing slash.
const urlError = computed(() => {
  if (updating) {
    return storedUrl.value ? undefined : "The GitLab instance is still loading";
  }
  if (instance.value === "cloud") return undefined;
  const result = z
    .string()
    .min(1, "Enter the URL of your GitLab instance")
    .check(z.url("Enter a full URL, such as https://gitlab.example.com"))
    .max(MAX_URL_LENGTH, `Enter a URL of at most ${MAX_URL_LENGTH} characters`)
    .safeParse(instanceUrl.value);
  return result.success ? undefined : result.error.issues[0]?.message;
});

const tokenPage = computed(
  () =>
    `${instanceUrl.value || GITLAB_COM}/-/user_settings/personal_access_tokens`,
);

function validate(value: string): string | undefined {
  if (value.length === 0) return "Enter a GitLab personal access token";
  if (!gitlabPersonalAccessTokenRegex.test(value)) {
    return "A personal access token starts with glpat- followed by at least 20 characters";
  }
  return undefined;
}

async function submit(): Promise<void> {
  if (!orgId || !authStore.getToken) return;
  busy.value = true;
  apiError.value = undefined;
  const data = {
    token: token.value,
    token_type: GitlabTokenType.PERSONAL_ACCESS_TOKEN,
    gitlab_instance_url: instanceUrl.value,
  };
  try {
    if (updateId) {
      await integrationRepo.updateGitlabIntegration({
        orgId,
        integrationId: updateId,
        bearerToken: authStore.getToken,
        data,
        handleBusinessErrors: true,
        handleHTTPErrors: true,
      });
      successToast("Updated the GitLab integration");
    } else {
      await integrationRepo.addGitlabIntegration({
        orgId,
        bearerToken: authStore.getToken,
        data,
        handleBusinessErrors: true,
        handleHTTPErrors: true,
      });
      successToast("Added the GitLab integration");
    }
    token.value = "";
    void router.push({
      name: "orgs",
      params: { orgId, page: "integrations", action: "manage" },
    });
  } catch (err) {
    apiError.value = tokenIntegrationError(err, {
      provider: "GitLab",
      scopes: "api and read_user",
      updating,
    });
  } finally {
    busy.value = false;
  }
}

async function loadStoredUrl(): Promise<void> {
  if (!updateId || !orgId || !authStore.getToken) return;
  try {
    const integration = await integrationRepo.getGitlabIntegration({
      orgId,
      integrationId: updateId,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
    });
    storedUrl.value = integration.service_domain.replace(/\/+$/, "");
  } catch {
    apiError.value = "The GitLab integration could not be loaded.";
  }
}

if (!orgId) router.back();
onMounted(() => void loadStoredUrl());
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2
      class="flex items-center gap-3 text-2xl font-bold text-foreground-strong"
    >
      <Icon icon="devicon:gitlab" aria-hidden="true" class="size-8" />
      {{ updating ? "Replace the GitLab token" : "Connect GitLab" }}
    </h2>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <TokenIntegrationForm
        v-model:token="token"
        title="Personal access token"
        description="Paste a personal access token with the scopes listed here. It lets CodeClarity list and clone your repositories."
        label="GitLab personal access token"
        placeholder="glpat-..."
        hint="The token starts with glpat-."
        :submit-label="updating ? 'Replace token' : 'Connect GitLab'"
        :validate="validate"
        :fields-invalid="urlError !== undefined"
        :busy="busy"
        :api-error="apiError"
        @submit="submit"
      >
        <template #fields="{ submitted }">
          <div v-if="updating" class="flex flex-col gap-2">
            <p class="text-sm font-medium leading-none">GitLab instance</p>
            <p class="text-sm text-muted-foreground">
              {{ storedUrl ?? "Loading..." }}
            </p>
            <p class="text-sm text-muted-foreground">
              A replaced token stays on this instance. To use another one,
              delete this integration and connect GitLab again.
            </p>
          </div>
          <fieldset v-else class="flex flex-col gap-3">
            <legend class="mb-2 text-sm font-medium leading-none">
              GitLab instance
            </legend>
            <RadioGroup v-model="instance" class="flex gap-6">
              <div class="flex items-center gap-2">
                <RadioGroupItem id="gitlab-cloud" value="cloud" />
                <Label for="gitlab-cloud">GitLab.com</Label>
              </div>
              <div class="flex items-center gap-2">
                <RadioGroupItem id="gitlab-self-hosted" value="self-hosted" />
                <Label for="gitlab-self-hosted">Self-hosted</Label>
              </div>
            </RadioGroup>
            <div v-if="instance === 'self-hosted'" class="flex flex-col gap-2">
              <Label for="gitlab-url">Instance URL</Label>
              <Input
                id="gitlab-url"
                v-model="selfHostedUrl"
                type="url"
                placeholder="https://gitlab.example.com"
                :aria-invalid="submitted && urlError ? true : undefined"
                :aria-describedby="
                  submitted && urlError ? 'gitlab-url-error' : undefined
                "
              />
              <p
                v-if="submitted && urlError"
                id="gitlab-url-error"
                class="text-sm text-destructive"
              >
                {{ urlError }}
              </p>
            </div>
          </fieldset>
        </template>
      </TokenIntegrationForm>

      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h2 class="text-lg font-semibold leading-none text-foreground-strong">
            Create a token
          </h2>
          <CardDescription>
            These links open your GitLab instance with the scopes already
            selected.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-6">
          <div class="flex flex-wrap gap-3">
            <Button
              as="a"
              variant="outline"
              :href="`${tokenPage}?name=CodeClarity+Full+Access&scopes=read_api,read_user,read_repository,self_rotate`"
              target="_blank"
              rel="noopener noreferrer"
            >
              Full access token
              <ExternalLink aria-hidden="true" />
              <span class="sr-only">(opens GitLab in a new tab)</span>
            </Button>
            <Button
              as="a"
              variant="outline"
              :href="`${tokenPage}?name=CodeClarity+Repository+Only&scopes=read_repository`"
              target="_blank"
              rel="noopener noreferrer"
            >
              Repositories only
              <ExternalLink aria-hidden="true" />
              <span class="sr-only">(opens GitLab in a new tab)</span>
            </Button>
          </div>
          <ol
            class="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground"
          >
            <li>Click "Add new token" on the top right.</li>
            <li>Select an expiration that fits your security policy.</li>
            <li>Click "Create personal access token".</li>
            <li>Copy the token and paste it into the form.</li>
          </ol>
          <p class="text-sm text-muted-foreground">
            Creating the token by hand? Select
            <template v-for="(scope, index) in SCOPES" :key="scope">
              <code class="font-mono text-foreground-strong">{{
                scope
              }}</code>{{ scopeSeparator(index) }}
            </template>
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
