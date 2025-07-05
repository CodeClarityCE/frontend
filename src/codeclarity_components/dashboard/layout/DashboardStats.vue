<script setup lang="ts">
import { useDashboardData } from '../composables/useDashboardData';

// Component imports
import DashboardHeader from './DashboardHeader.vue';
import DashboardQuickStats from '../sections/DashboardQuickStats.vue';
import DashboardCharts from '../sections/DashboardCharts.vue';
import DashboardSidebar from './DashboardSidebar.vue';
import DashboardEmptyState from './DashboardEmptyState.vue';

/**
 * DashboardStats - Main dashboard orchestrator (SIMPLIFIED)
 *
 * This component now focuses purely on layout and presentation.
 * All data management logic has been moved to the useDashboardData composable.
 */

// Get dashboard data and state from composable
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
    <!-- Show empty state if loading, error, or setup needed -->
    <DashboardEmptyState
        v-if="shouldShowEmptyState"
        :is-error="hasError"
        :has-integrations="hasIntegrations"
        :has-projects="hasProjects"
        :org-id="defaultOrg?.id"
    />

    <!-- Main dashboard content -->
    <div v-else class="space-y-8 min-h-screen">
        <!-- Dashboard header with title and controls -->
        <DashboardHeader :is-loading="isLoading" @refresh="refreshData" />

        <!-- Quick stats overview -->
        <DashboardQuickStats />

        <!-- Main charts and visualizations -->
        <DashboardCharts :integration-ids="activeIntegrationIds" />

        <!-- Activity sidebar with navigation -->
        <DashboardSidebar />
    </div>
</template>
