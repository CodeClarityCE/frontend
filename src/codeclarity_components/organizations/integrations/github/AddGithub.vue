<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ExternalLink } from "@lucide/vue";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import { GithubTokenType } from "@/codeclarity_components/organizations/integrations/integration_add.http";
import { IntegrationsRepository } from "@/codeclarity_components/organizations/integrations/IntegrationsRepository";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shadcn/ui/card";
import { useAuthStore } from "@/stores/auth";
import { successToast } from "@/utils/toasts";

import { tokenIntegrationError } from "../integration-errors";
import TokenIntegrationForm from "../TokenIntegrationForm.vue";

const githubClassicTokenRegex = /^ghp_[a-zA-Z0-9]{36}$/;

const authStore = useAuthStore();
const integrationRepo = new IntegrationsRepository();
const route = useRoute();

const orgId = typeof route.params.orgId === "string" ? route.params.orgId : "";
const updateId =
  typeof route.query.update === "string" ? route.query.update : undefined;
const updating = updateId !== undefined;

const token = ref("");
const busy = ref(false);
const apiError = ref<string>();

const title = computed(() =>
  updating ? "Replace the GitHub token" : "Connect GitHub",
);

function validate(value: string): string | undefined {
  if (value.length === 0) return "Enter a GitHub classic token";
  if (!githubClassicTokenRegex.test(value)) {
    return "A classic token starts with ghp_ followed by 36 letters or digits";
  }
  return undefined;
}

async function submit(): Promise<void> {
  if (!orgId || !authStore.getToken) return;
  busy.value = true;
  apiError.value = undefined;
  const data = {
    token: token.value,
    token_type: GithubTokenType.CLASSIC_TOKEN,
  };
  try {
    if (updateId) {
      await integrationRepo.updateGithubIntegration({
        orgId,
        integrationId: updateId,
        bearerToken: authStore.getToken,
        data,
      });
      successToast("Updated the GitHub integration");
    } else {
      await integrationRepo.addGithubIntegration({
        orgId,
        bearerToken: authStore.getToken,
        data,
      });
      successToast("Added the GitHub integration");
    }
    token.value = "";
    void router.push({
      name: "orgs",
      params: { orgId, page: "integrations", action: "manage" },
    });
  } catch (err) {
    apiError.value = tokenIntegrationError(err, {
      provider: "GitHub",
      scopes: "repo and write:org",
      updating,
    });
  } finally {
    busy.value = false;
  }
}

if (!orgId) router.back();
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2
      class="flex items-center gap-3 text-2xl font-bold text-foreground-strong"
    >
      <Icon icon="devicon:github" aria-hidden="true" class="size-8" />
      {{ title }}
    </h2>

    <div class="grid grid-cols-2 items-start gap-6">
      <TokenIntegrationForm
        v-model:token="token"
        title="Personal access token"
        description="Paste a classic token with the scopes below. It lets CodeClarity list and clone your repositories."
        label="GitHub classic token"
        placeholder="ghp_..."
        hint="A classic token with the repo and write:org scopes, or public_repo for public repositories only."
        :submit-label="updating ? 'Replace token' : 'Connect GitHub'"
        :validate="validate"
        :busy="busy"
        :api-error="apiError"
        @submit="submit"
      />

      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h2 class="text-lg font-semibold leading-none text-foreground-strong">
            Create a token
          </h2>
          <CardDescription>
            These links open GitHub with the scopes already selected.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-6">
          <div class="flex flex-wrap gap-3">
            <Button
              as="a"
              variant="outline"
              href="https://github.com/settings/tokens/new?description=CodeClarity&scopes=repo,write:org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Full access token
              <ExternalLink aria-hidden="true" />
              <span class="sr-only">(opens GitHub in a new tab)</span>
            </Button>
            <Button
              as="a"
              variant="outline"
              href="https://github.com/settings/tokens/new?description=CodeClarity+Public&scopes=public_repo"
              target="_blank"
              rel="noopener noreferrer"
            >
              Public repositories only
              <ExternalLink aria-hidden="true" />
              <span class="sr-only">(opens GitHub in a new tab)</span>
            </Button>
          </div>
          <ol
            class="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground"
          >
            <li>
              Pick "Full access token" for private repositories, or "Public
              repositories only".
            </li>
            <li>Select an expiration that fits your security policy.</li>
            <li>Click "Generate token".</li>
            <li>Copy the token and paste it into the form.</li>
          </ol>
          <p class="text-sm text-muted-foreground">
            Creating the token by hand? Select
            <code class="font-mono text-foreground-strong">repo</code> and
            <code class="font-mono text-foreground-strong">write:org</code>, or
            only
            <code class="font-mono text-foreground-strong">public_repo</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
