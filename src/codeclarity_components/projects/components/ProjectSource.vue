<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { FolderArchive } from "@lucide/vue";

import { IntegrationProvider } from "@/codeclarity_components/organizations/integrations/Integrations";

// Where a project comes from, as a logo and a word.
defineProps<{ type: IntegrationProvider }>();
</script>

<template>
  <span class="inline-flex items-center gap-1.5 text-sm text-foreground">
    <template v-if="type === IntegrationProvider.GITHUB">
      <Icon icon="simple-icons:github" aria-hidden="true" class="size-4" />
      GitHub
    </template>
    <template v-else-if="type === IntegrationProvider.GITLAB">
      <Icon icon="simple-icons:gitlab" aria-hidden="true" class="size-4" />
      GitLab
    </template>
    <template v-else>
      <FolderArchive aria-hidden="true" class="size-4" />
      Upload
    </template>
  </span>
</template>
