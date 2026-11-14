<script setup lang="ts">
import { CircleAlert, FolderPlus, Play } from "@lucide/vue";
import { RouterLink } from "vue-router";

import { Button } from "@/shadcn/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/shadcn/ui/empty";

// The project overview's next step: retry, add a project or run an analysis.
withDefaults(
  defineProps<{
    isError?: boolean;
    hasIntegrations?: boolean;
    hasProjects?: boolean;
    hasAnalyses?: boolean;
    orgId?: string;
  }>(),
  {
    isError: false,
    hasIntegrations: false,
    hasProjects: false,
    hasAnalyses: false,
    orgId: undefined,
  },
);

defineEmits<{ retry: [] }>();
</script>

<template>
  <Empty v-if="isError" class="rounded-card border border-dashed bg-card">
    <EmptyHeader>
      <EmptyMedia variant="icon" class="bg-neutral-subtle text-danger">
        <CircleAlert aria-hidden="true" class="size-6" />
      </EmptyMedia>
      <h3 class="text-lg font-medium tracking-tight text-foreground-strong">
        Unable to load the project overview
      </h3>
      <EmptyDescription>
        We couldn't fetch your organisation's projects. Please try again.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button variant="outline" @click="$emit('retry')">Try again</Button>
    </EmptyContent>
  </Empty>

  <Empty
    v-else-if="!hasIntegrations && !hasProjects && !hasAnalyses"
    class="rounded-card border border-dashed bg-card"
  >
    <EmptyHeader>
      <EmptyMedia
        variant="icon"
        class="bg-brand-subtle text-brand-subtle-foreground"
      >
        <FolderPlus aria-hidden="true" class="size-6" />
      </EmptyMedia>
      <h3 class="text-lg font-medium tracking-tight text-foreground-strong">
        Get started
      </h3>
      <EmptyDescription>
        Import a project from GitHub or GitLab, or upload a local archive, to
        start a security analysis.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent class="flex flex-row justify-center gap-3">
      <Button
        :as="RouterLink"
        :to="{
          name: 'orgs',
          params: { orgId: orgId, page: 'integrations', action: 'manage' },
        }"
        variant="outline"
      >
        Connect a VCS
      </Button>
      <Button
        :as="RouterLink"
        :to="{ name: 'projects', params: { page: 'add' } }"
        arrow
      >
        Upload a project
      </Button>
    </EmptyContent>
  </Empty>

  <Empty
    v-else-if="!hasProjects"
    class="rounded-card border border-dashed bg-card"
  >
    <EmptyHeader>
      <EmptyMedia
        variant="icon"
        class="bg-brand-subtle text-brand-subtle-foreground"
      >
        <FolderPlus aria-hidden="true" class="size-6" />
      </EmptyMedia>
      <h3 class="text-lg font-medium tracking-tight text-foreground-strong">
        Import your first project
      </h3>
      <EmptyDescription>
        Import a project from your repositories or upload a local archive to
        start analysing it for vulnerabilities.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button
        :as="RouterLink"
        :to="{ name: 'projects', params: { page: 'add' } }"
        arrow
      >
        Import a project
      </Button>
    </EmptyContent>
  </Empty>

  <Empty
    v-else-if="!hasAnalyses"
    class="rounded-card border border-dashed bg-card"
  >
    <EmptyHeader>
      <EmptyMedia
        variant="icon"
        class="bg-brand-subtle text-brand-subtle-foreground"
      >
        <Play aria-hidden="true" class="size-6" />
      </EmptyMedia>
      <h3 class="text-lg font-medium tracking-tight text-foreground-strong">
        Run your first analysis
      </h3>
      <EmptyDescription>
        Your projects are ready. Start an analysis to scan them for
        vulnerabilities.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button
        :as="RouterLink"
        :to="{ name: 'projects', params: { page: 'list' } }"
        arrow
      >
        Go to Projects
      </Button>
    </EmptyContent>
  </Empty>
</template>
