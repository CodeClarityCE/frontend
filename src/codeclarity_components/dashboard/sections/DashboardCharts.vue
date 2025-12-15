<template>
    <!-- Main dashboard charts and visualizations -->
    <div class="grid gap-8 lg:grid-cols-12">
        <!-- Vulnerability Exposure Overview (large card) -->
        <InfoCard
            title="Vulnerability Exposure Overview"
            description="Total severity of vulnerabilities across all your projects"
            icon="solar:chart-square-bold"
            variant="primary"
            class="lg:col-span-8"
        >
            <ExposureOverview :integration-ids="integrationIds" />
        </InfoCard>

        <!-- Vulnerabilities Summary (smaller card) -->
        <InfoCard
            title="Vulnerabilities Summary"
            description="Current threats affecting your projects"
            icon="solar:bug-bold"
            variant="default"
            class="lg:col-span-4"
        >
            <CurrentVulns :integration-ids="integrationIds" />
        </InfoCard>

        <!-- License Distribution -->
        <InfoCard
            title="Open Source Licenses"
            description="License compliance across your dependencies"
            icon="solar:document-text-bold"
            variant="primary"
            class="lg:col-span-6"
        >
            <LicenseDist :integration-ids="integrationIds" />
        </InfoCard>

        <!-- Vulnerability Impact Analysis -->
        <InfoCard
            title="Impact Analysis"
            description="Risk assessment and severity insights"
            icon="solar:target-bold"
            variant="default"
            class="lg:col-span-6"
        >
            <VulnerabilityImpact :integration-ids="integrationIds" />
        </InfoCard>

        <!-- Tickets Summary -->
        <InfoCard
            title="Tickets"
            description="Track vulnerability remediation progress"
            icon="solar:ticket-bold"
            variant="default"
            class="lg:col-span-4"
        >
            <TicketsDashboardCard :integration-ids="integrationIds" />
        </InfoCard>
    </div>
</template>

<script setup lang="ts">
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import CurrentVulns from '../charts/CurrentVulns.vue';
import ExposureOverview from '../charts/ExposureOverview.vue';
import LicenseDist from '../charts/LicenseDist.vue';
import TicketsDashboardCard from '../charts/TicketsDashboardCard.vue';
import VulnerabilityImpact from '../charts/VulnerabilityImpact.vue';

/**
 * DashboardCharts - Simple chart grid layout
 *
 * Four main charts in a responsive grid:
 * - Exposure overview (large)
 * - Current vulnerabilities (small)
 * - License distribution
 * - Vulnerability impact
 */

interface Props {
    integrationIds: string[];
}

defineProps<Props>();
</script>
