<script lang="ts" setup>
import { ArrowLeft } from "@lucide/vue";
import { RouterLink } from "vue-router";

import { PageHeading } from "@/base_components/page";
import { Button } from "@/shadcn/ui/button";

// A not-found page for results, linking back to the results or the projects.
defineProps<{
  title: string;
  description: string;
  results?: Record<string, unknown> | null;
}>();
</script>

<template>
  <div class="flex flex-col items-start gap-6">
    <PageHeading :description="description">{{ title }}</PageHeading>
    <Button v-if="results" :as="RouterLink" :to="results" variant="outline">
      <ArrowLeft aria-hidden="true" class="size-4" />
      Back to results
    </Button>
    <Button
      v-else
      :as="RouterLink"
      :to="{ name: 'projects' }"
      variant="outline"
    >
      <ArrowLeft aria-hidden="true" class="size-4" />
      Back to projects
    </Button>
  </div>
</template>
