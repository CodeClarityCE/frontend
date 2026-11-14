<script setup lang="ts">
import { RefreshCw } from "@lucide/vue";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import { Button } from "@/shadcn/ui/button";
import { Skeleton } from "@/shadcn/ui/skeleton";

import { useDashboardData } from "./composables/useDashboardData";
import DashboardEmptyState from "./layout/DashboardEmptyState.vue";
import DashboardCharts from "./sections/DashboardCharts.vue";
import DashboardQuickStats from "./sections/DashboardQuickStats.vue";
import DashboardResearch from "./sections/DashboardResearch.vue";

const {
  activeIntegrationIds,
  hasData,
  hasIntegrations,
  hasProjects,
  hasAnalyses,
  hasError,
  isLoading,
  defaultOrg,
  refreshData,
} = useDashboardData();
</script>

<template>
  <div class="flex flex-col gap-10 p-8 pt-6">
    <PageHeading
      description="Your Experiments first, then the security of your projects."
    >
      <BrandEmphasis>Dashboard</BrandEmphasis>
    </PageHeading>

    <DashboardResearch />

    <section
      aria-labelledby="dashboard-projects-heading"
      class="flex flex-col gap-4"
    >
      <div class="flex items-center justify-between gap-4">
        <h2
          id="dashboard-projects-heading"
          class="text-xl font-bold tracking-tight text-foreground-strong"
        >
          Projects
        </h2>
        <Button
          v-if="hasData && !isLoading"
          variant="outline"
          size="sm"
          @click="() => void refreshData()"
        >
          <RefreshCw aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <div
        v-if="isLoading"
        role="status"
        aria-label="Loading the project overview"
        class="flex flex-col gap-6"
      >
        <Skeleton class="h-28 rounded-card" />
        <Skeleton class="h-80 rounded-card" />
      </div>
      <DashboardEmptyState
        v-else-if="hasError || !hasData"
        :is-error="hasError"
        :has-integrations="hasIntegrations"
        :has-projects="hasProjects"
        :has-analyses="hasAnalyses"
        :org-id="defaultOrg?.id"
        @retry="refreshData"
      />
      <template v-else>
        <DashboardQuickStats :integration-ids="activeIntegrationIds" />
        <DashboardCharts :integration-ids="activeIntegrationIds" />
      </template>
    </section>
  </div>
</template>
