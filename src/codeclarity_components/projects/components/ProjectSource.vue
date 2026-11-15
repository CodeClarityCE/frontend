<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { FolderArchive } from "@lucide/vue";

import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";

import { sourceLabel } from "./source-label";

// Where a project comes from, as a logo and a word.
defineProps<{ type: IntegrationProvider }>();
</script>

<template>
  <span class="inline-flex items-center gap-1.5 text-sm text-foreground">
    <Icon
      v-if="type === IntegrationProvider.GITHUB"
      icon="simple-icons:github"
      aria-hidden="true"
      class="size-4"
    />
    <Icon
      v-else-if="type === IntegrationProvider.GITLAB"
      icon="simple-icons:gitlab"
      aria-hidden="true"
      class="size-4"
    />
    <FolderArchive v-else aria-hidden="true" class="size-4" />
    {{ sourceLabel(type) }}
  </span>
</template>
