<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { RouterLink } from "vue-router";

import { InfoCard } from "@/base_components";
import {
  isMemberRoleGreaterOrEqualTo,
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import Button from "@/shadcn/ui/button/Button.vue";

defineProps<{
  defaultOrg: Organization;
}>();

const emit = defineEmits<{
  (e: "onRefresh"): void;
  (e: "onLocalUpload"): void;
}>();
</script>
<template>
  <InfoCard
    title="No VCS Integrations"
    description="Connect a version control system or upload your project directly"
    icon="solar:code-square-bold"
    variant="default"
  >
    <div class="space-y-6">
      <!-- Explanation -->
      <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div class="flex items-start gap-3">
          <Icon
            icon="solar:info-circle-bold"
            class="h-5 w-5 text-blue-600 mt-0.5"
          />
          <div>
            <p class="font-medium text-blue-800 mb-1">
              VCS Integration Optional
            </p>
            <p class="text-sm text-blue-700">
              You can connect to GitHub or GitLab to import repositories
              directly, or upload your project files as a ZIP/TAR.GZ archive.
            </p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3">
        <Button
          class="bg-theme-primary hover:bg-theme-primary/90 text-white"
          @click="emit('onLocalUpload')"
        >
          <Icon icon="solar:upload-bold" class="h-4 w-4 mr-2" />
          Upload Local Project
        </Button>

        <Button
          variant="outline"
          class="border-gray-300 text-gray-700 hover:border-theme-primary hover:text-theme-primary"
          @click="emit('onRefresh')"
        >
          <Icon icon="solar:refresh-bold" class="h-4 w-4 mr-2" />
          Refresh
        </Button>

        <Button
          variant="outline"
          class="border-gray-300 text-gray-700 hover:border-theme-primary hover:text-theme-primary"
          @click="$router.back()"
        >
          Go Back
        </Button>

        <Button
          v-if="isMemberRoleGreaterOrEqualTo(defaultOrg.role, MemberRole.ADMIN)"
          variant="outline"
          class="border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
          as-child
        >
          <RouterLink
            :to="{
              name: 'orgs',
              params: {
                orgId: defaultOrg.id,
                page: 'integrations',
                action: 'manage',
              },
            }"
            target="_blank"
            class="flex items-center gap-2"
          >
            <Icon icon="solar:settings-bold" class="h-4 w-4" />
            Manage Integrations
          </RouterLink>
        </Button>
      </div>
    </div>
  </InfoCard>
</template>
