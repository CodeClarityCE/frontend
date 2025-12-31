<script setup lang="ts">
import { Icon } from "@iconify/vue";

import {
  IntegrationProvider,
  type VCS,
} from "@/codeclarity_components/organizations/integrations/Integrations";

defineProps<{
  vcsIntegrations: VCS[];
}>();

const emit = defineEmits<(e: "onSelectedVCS", selected: VCS) => void>();
</script>
<template>
  <div class="space-y-6">
    <div class="text-center">
      <h3 class="text-lg font-semibold text-theme-black mb-2">
        Choose Integration
      </h3>
      <p class="text-sm text-theme-gray">
        Select your version control system to import repositories
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <template v-for="vcs in vcsIntegrations" :key="vcs.id">
        <!-- GitLab Integration -->
        <div
          v-if="
            vcs.integration_provider === IntegrationProvider.GITLAB &&
            !vcs.invalid
          "
          class="group cursor-pointer"
          @click="emit('onSelectedVCS', vcs)"
        >
          <div
            class="border border-gray-200 rounded-lg p-6 hover:border-theme-primary hover:bg-theme-primary/5 transition-all duration-200 hover:shadow-md"
          >
            <div class="flex flex-col items-center text-center space-y-3">
              <div
                class="p-3 bg-orange-100 rounded-xl group-hover:bg-theme-primary/10 transition-colors"
              >
                <Icon
                  icon="simple-icons:gitlab"
                  class="h-8 w-8 text-orange-600 group-hover:text-theme-primary"
                />
              </div>
              <div>
                <h4 class="font-semibold text-theme-black">GitLab</h4>
                <p class="text-sm text-theme-gray">Import from GitLab</p>
              </div>
            </div>
          </div>
        </div>

        <!-- GitHub Integration -->
        <div
          v-if="
            vcs.integration_provider === IntegrationProvider.GITHUB &&
            !vcs.invalid
          "
          class="group cursor-pointer"
          @click="emit('onSelectedVCS', vcs)"
        >
          <div
            class="border border-gray-200 rounded-lg p-6 hover:border-theme-primary hover:bg-theme-primary/5 transition-all duration-200 hover:shadow-md"
          >
            <div class="flex flex-col items-center text-center space-y-3">
              <div
                class="p-3 bg-gray-100 rounded-xl group-hover:bg-theme-primary/10 transition-colors"
              >
                <Icon
                  icon="simple-icons:github"
                  class="h-8 w-8 text-gray-800 group-hover:text-theme-primary"
                />
              </div>
              <div>
                <h4 class="font-semibold text-theme-black">GitHub</h4>
                <p class="text-sm text-theme-gray">Import from GitHub</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
