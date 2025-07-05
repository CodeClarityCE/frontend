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
    </div>
</template>

<script setup lang="ts">
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import { defineAsyncComponent } from 'vue';
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';

// Async component imports with loading states
const LicenseDist = defineAsyncComponent({
    loader: () => import('../charts/LicenseDist.vue'),
    loadingComponent: LoadingComponent,
    delay: 200,
    errorComponent: ErrorComponent,
    timeout: 3000
});

const ExposureOverview = defineAsyncComponent({
    loader: () => import('../charts/ExposureOverview.vue'),
    loadingComponent: LoadingComponent,
    delay: 200,
    errorComponent: ErrorComponent,
    timeout: 3000
});

const VulnerabilityImpact = defineAsyncComponent({
    loader: () => import('../charts/VulnerabilityImpact.vue'),
    loadingComponent: LoadingComponent,
    delay: 200,
    errorComponent: ErrorComponent,
    timeout: 3000
});

const CurrentVulns = defineAsyncComponent({
    loader: () => import('../charts/CurrentVulns.vue'),
    loadingComponent: LoadingComponent,
    delay: 200,
    errorComponent: ErrorComponent,
    timeout: 3000
});

/**
 * DashboardCharts - Main chart components for the dashboard
 *
 * Contains the primary visualizations:
 * - Vulnerability exposure overview (main chart)
 * - Current vulnerabilities summary
 * - License distribution analysis
 * - Vulnerability impact analysis
 */

interface Props {
    integrationIds: string[];
}

defineProps<Props>();
</script>
