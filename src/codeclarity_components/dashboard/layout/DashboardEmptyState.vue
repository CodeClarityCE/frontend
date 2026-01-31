<template>
  <!-- Empty state when organization needs setup -->
  <div class="h-full flex items-center justify-center min-h-[60vh]">
    <!-- Error state -->
    <Empty v-if="isError" class="border border-red-200 bg-red-50/50">
      <EmptyHeader>
        <EmptyMedia variant="icon" class="bg-red-100 text-red-600">
          <Icon icon="solar:confounded-square-linear" class="size-6" />
        </EmptyMedia>
        <EmptyTitle>Unable to load dashboard</EmptyTitle>
        <EmptyDescription>
          We couldn't fetch your organization data. Please try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" @click="$emit('retry')">
          <Icon icon="solar:refresh-bold" class="size-4 mr-2" />
          Try Again
        </Button>
      </EmptyContent>
    </Empty>

    <!-- No integrations state - only show when there are also no projects or analyses -->
    <Empty
      v-else-if="!hasIntegrations && !hasProjects && !hasAnalyses"
      class="border border-gray-200"
    >
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          class="bg-theme-primary/10 text-theme-primary"
        >
          <Icon icon="solar:folder-add-bold" class="size-6" />
        </EmptyMedia>
        <EmptyTitle>Get Started</EmptyTitle>
        <EmptyDescription>
          Import a project from GitHub/GitLab or upload a local archive to begin
          security analysis.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent class="flex gap-3">
        <RouterLink
          :to="{
            name: 'orgs',
            params: { orgId: orgId, page: 'integrations', action: 'manage' },
          }"
        >
          <Button variant="outline" class="border-gray-300">
            <Icon icon="solar:link-bold" class="size-4 mr-2" />
            Connect VCS
          </Button>
        </RouterLink>
        <RouterLink :to="{ name: 'projects', params: { page: 'add' } }">
          <Button
            class="bg-theme-primary hover:bg-theme-primary-dark text-white"
          >
            <Icon icon="solar:upload-bold" class="size-4 mr-2" />
            Upload Project
          </Button>
        </RouterLink>
      </EmptyContent>
    </Empty>

    <!-- No projects state -->
    <Empty v-else-if="!hasProjects" class="border border-gray-200">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          class="bg-theme-primary/10 text-theme-primary"
        >
          <Icon icon="solar:folder-add-bold" class="size-6" />
        </EmptyMedia>
        <EmptyTitle>Import Your First Project</EmptyTitle>
        <EmptyDescription>
          Import a project from your repositories or upload a local archive to
          start analyzing for vulnerabilities.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <RouterLink :to="{ name: 'projects', params: { page: 'add' } }">
          <Button
            class="bg-theme-primary hover:bg-theme-primary-dark text-white"
          >
            <Icon icon="solar:add-circle-bold" class="size-4 mr-2" />
            Import Project
          </Button>
        </RouterLink>
      </EmptyContent>
    </Empty>

    <!-- No analyses state -->
    <Empty v-else-if="!hasAnalyses" class="border border-gray-200">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          class="bg-theme-primary/10 text-theme-primary"
        >
          <Icon icon="solar:play-circle-bold" class="size-6" />
        </EmptyMedia>
        <EmptyTitle>Run Your First Analysis</EmptyTitle>
        <EmptyDescription>
          You have projects ready. Start an analysis to scan for vulnerabilities
          and get security insights for your code.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <RouterLink :to="{ name: 'projects', params: { page: 'list' } }">
          <Button
            class="bg-theme-primary hover:bg-theme-primary-dark text-white"
          >
            <Icon icon="solar:folder-open-bold" class="size-4 mr-2" />
            Go to Projects
          </Button>
        </RouterLink>
      </EmptyContent>
    </Empty>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

import Button from "@/shadcn/ui/button/Button.vue";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shadcn/ui/empty";

/**
 * DashboardEmptyState - Shows when dashboard has no data
 *
 * States (in priority order):
 * - Error: Unable to fetch organization data
 * - No integrations: User needs to connect GitHub/GitLab
 * - No projects: User needs to import a project
 * - No analyses: User needs to run an analysis
 */

interface Props {
  isError?: boolean;
  hasIntegrations?: boolean;
  hasProjects?: boolean;
  hasAnalyses?: boolean;
  orgId?: string;
}

withDefaults(defineProps<Props>(), {
  isError: false,
  hasIntegrations: false,
  hasProjects: false,
  hasAnalyses: false,
  orgId: undefined,
});

defineEmits<{
  retry: [];
}>();
</script>
