<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { Star, Upload } from "@lucide/vue";
import { computed } from "vue";

import {
  IntegrationProvider,
  type VCS,
} from "@/codeclarity_components/organizations/integrations/Integrations";

const props = defineProps<{
  vcsIntegrations: VCS[];
}>();

const emit = defineEmits<{
  (e: "onSelectedVCS", selected: VCS): void;
  (e: "onLocalUpload"): void;
  /** The "Popular on GitHub" source, backed by the org's GitHub integration. */
  (e: "onPopularGithub", github: VCS): void;
}>();

const valid = computed(() =>
  props.vcsIntegrations.filter(
    (vcs) =>
      !vcs.invalid &&
      (vcs.integration_provider === IntegrationProvider.GITHUB ||
        vcs.integration_provider === IntegrationProvider.GITLAB),
  ),
);

// The popular list is ranked and cloned through the GitHub integration's
// token, so it is only usable once a valid one exists.
const githubIntegration = computed(() =>
  valid.value.find(
    (vcs) => vcs.integration_provider === IntegrationProvider.GITHUB,
  ),
);

function onPopularGithub(): void {
  if (githubIntegration.value) emit("onPopularGithub", githubIntegration.value);
}

const choice =
  "flex h-full w-full flex-col items-start gap-3 rounded-card border bg-card p-5 text-left shadow-card transition-colors duration-150 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none";
</script>
<template>
  <ul aria-label="Import methods" class="grid grid-cols-4 gap-4">
    <li v-for="vcs in valid" :key="vcs.id">
      <button
        type="button"
        :class="choice"
        :data-testid="
          vcs.integration_provider === IntegrationProvider.GITHUB
            ? 'github-card'
            : 'gitlab-card'
        "
        @click="emit('onSelectedVCS', vcs)"
      >
        <Icon
          :icon="
            vcs.integration_provider === IntegrationProvider.GITHUB
              ? 'simple-icons:github'
              : 'simple-icons:gitlab'
          "
          aria-hidden="true"
          class="size-7 text-foreground-strong"
        />
        <span class="flex flex-col gap-1">
          <span class="font-semibold text-foreground-strong">
            {{
              vcs.integration_provider === IntegrationProvider.GITHUB
                ? "GitHub"
                : "GitLab"
            }}
          </span>
          <span class="text-sm text-muted-foreground">
            Import from {{ vcs.service_domain }}
          </span>
        </span>
      </button>
    </li>

    <li>
      <button
        type="button"
        :class="[
          choice,
          !githubIntegration && 'cursor-not-allowed hover:border-border',
        ]"
        :aria-disabled="!githubIntegration"
        data-testid="popular-github-card"
        @click="onPopularGithub()"
      >
        <Star aria-hidden="true" class="size-7 text-foreground-strong" />
        <span class="flex flex-col gap-1">
          <span class="font-semibold text-foreground-strong">
            Popular on GitHub
          </span>
          <span class="text-sm text-muted-foreground">
            {{
              githubIntegration
                ? "Top 100 starred JS/TS/PHP repos"
                : "Requires a GitHub integration"
            }}
          </span>
        </span>
      </button>
    </li>

    <li>
      <button type="button" :class="choice" @click="emit('onLocalUpload')">
        <Upload aria-hidden="true" class="size-7 text-foreground-strong" />
        <span class="flex flex-col gap-1">
          <span class="font-semibold text-foreground-strong">
            Upload an archive
          </span>
          <span class="text-sm text-muted-foreground">ZIP or TAR.GZ</span>
        </span>
      </button>
    </li>
  </ul>
</template>
