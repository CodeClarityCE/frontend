<script setup lang="ts">
import { useDashboardData } from '../composables/useDashboardData';

// Simple component imports
import { PageHeader } from '@/base_components';
import DashboardQuickStats from '../sections/DashboardQuickStats.vue';
import DashboardCharts from '../sections/DashboardCharts.vue';
import DashboardSidebar from './DashboardSidebar.vue';
import DashboardEmptyState from './DashboardEmptyState.vue';

/**
 * DashboardStats - Main dashboard container
 *
 * Simple orchestrator that:
 * 1. Gets data from composable
 * 2. Shows empty state if needed
 * 3. Otherwise renders dashboard sections
 */

const {
    activeIntegrationIds,
    shouldShowEmptyState,
    hasIntegrations,
    hasProjects,
    hasError,
    isLoading,
    defaultOrg,
    refreshData
} = useDashboardData();
</script>

<template>
    <!-- Empty state: loading, error, or setup needed -->
    <DashboardEmptyState
        v-if="shouldShowEmptyState"
        :is-error="hasError"
        :has-integrations="hasIntegrations"
        :has-projects="hasProjects"
        :org-id="defaultOrg?.id"
    />

    <!-- Main dashboard: header + stats + charts + sidebar -->
    <div v-else class="space-y-8">
        <PageHeader
            title="Security Dashboard"
            description="Monitor your organization's security posture and vulnerabilities"
            :is-loading="isLoading"
            @refresh="refreshData"
        />
        <DashboardQuickStats />
        <DashboardCharts :integration-ids="activeIntegrationIds" />
        <DashboardSidebar />
    </div>
</template>
