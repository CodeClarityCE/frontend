<template>
  <!-- Empty state when organization needs setup -->
  <div class="h-full relative">
    <!-- Loading skeleton -->
    <div class="flex flex-col gap-4 h-full">
      <div class="flex flex-row gap-5">
        <Skeleton class="h-14 w-10/12" />
        <Skeleton class="h-14 w-2/12" />
      </div>
      <Skeleton v-for="i in 6" :key="i" class="h-[16.6%] w-full min-h-32" />
    </div>

    <!-- Overlay content -->
    <div
      class="flex flex-col gap-4 items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg"
    >
      <!-- Error state -->
      <InfoCard
        v-if="isError"
        title="Error"
        description="Unable to fetch the state of your organization."
        icon="solar:confounded-square-linear"
        variant="default"
      >
      </InfoCard>

      <!-- Setup needed state -->
      <InfoCard
        v-else-if="!hasIntegrations"
        title="No VCS Integration Yet"
        description="You have no integration with a VCS system yet"
        icon="solar:sleeping-square-linear"
        variant="default"
      >
        <template #actions>
          <RouterLink
            v-if="!hasIntegrations"
            :to="{
              name: 'orgs',
              params: { orgId: orgId, page: 'integrations', action: 'manage' },
            }"
          >
            <Button
              class="bg-theme-primary hover:bg-theme-primary-dark text-white"
            >
              Link to Github or Gitlab
            </Button>
          </RouterLink>
        </template>
      </InfoCard>
      <InfoCard
        v-else-if="!hasProjects"
        title="No Projects Yet"
        description="Get started by adding your first project to begin security analysis."
        icon="solar:sleeping-square-linear"
        variant="default"
      >
        <template #actions>
          <RouterLink :to="{ name: 'projects', params: { page: 'add' } }">
            <Button
              class="bg-theme-primary hover:bg-theme-primary-dark text-white flex items-center gap-2"
            >
              <Icon icon="solar:add-circle-bold" class="h-4 w-4" />
              Add Project
            </Button>
          </RouterLink>
        </template>
      </InfoCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { InfoCard } from "@/base_components";
import Button from "@/shadcn/ui/button/Button.vue";
import Skeleton from "@/shadcn/ui/skeleton/Skeleton.vue";

/**
 * DashboardEmptyState - Shows when dashboard has no data
 *
 * Simple states:
 * - Loading skeleton
 * - Error message
 * - Setup guidance (no integrations/projects)
 */

interface Props {
  isError?: boolean;
  hasIntegrations?: boolean;
  hasProjects?: boolean;
  orgId?: string;
}

withDefaults(defineProps<Props>(), {
  isError: false,
  hasIntegrations: false,
  hasProjects: false,
  orgId: undefined,
});
</script>
