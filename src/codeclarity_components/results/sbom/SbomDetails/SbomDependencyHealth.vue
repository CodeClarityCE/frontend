<script lang="ts" setup>
import SeverityBubble from '@/base_components/data-display/bubbles/SeverityBubble.vue';
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import moment from 'moment';
import type { PropType } from 'vue';

defineProps({
    dependency: {
        type: Object as PropType<DependencyDetails>,
        required: true
    }
});
</script>

<template>
    <section class="dependency-health-panel">
        <div class="section-header">
            <h2 class="section-title">Dependency Health</h2>
        </div>

        <div class="health-content">
            <!-- Health Issues -->
            <div class="health-issues">
                <!-- Outdated Warning -->
                <div
                    v-if="
                        moment(dependency.lastest_release_date).diff(
                            moment(dependency.release_date),
                            'days'
                        ) > 182
                    "
                    class="health-alert outdated"
                >
                    <div class="alert-header">
                        <Icon icon="material-symbols:update-disabled" class="alert-icon" />
                        <span class="alert-title">Outdated Package</span>
                    </div>
                    <div class="alert-message">
                        <p>
                            This package is
                            <strong
                                >{{
                                    moment(dependency.lastest_release_date).diff(
                                        moment(dependency.release_date),
                                        'days'
                                    )
                                }}
                                days</strong
                            >
                            behind the latest release.
                        </p>
                        <p class="recommendation">
                            Consider upgrading <code>{{ dependency.name }}</code> to the latest
                            version.
                        </p>
                    </div>
                </div>

                <!-- Unlicensed Warning -->
                <div v-if="dependency.license == ''" class="health-alert unlicensed">
                    <div class="alert-header">
                        <Icon icon="material-symbols:gavel" class="alert-icon" />
                        <span class="alert-title">Unlicensed</span>
                    </div>
                    <div class="alert-message">
                        <p>This dependency appears to be unlicensed.</p>
                        <p class="legal-notice">
                            Authors of unlicensed dependencies hold exclusive rights to their use,
                            redistribution and modification.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Vulnerability Section -->
            <div v-if="dependency.vulnerabilities.length > 0" class="vulnerability-section">
                <div class="health-alert vulnerable">
                    <div class="alert-header">
                        <Icon icon="material-symbols:security" class="alert-icon" />
                        <span class="alert-title">Security Vulnerabilities Found</span>
                    </div>
                    <div class="alert-message">
                        <div class="vulnerabilities-list">
                            <Badge
                                v-for="vulnerability in dependency.vulnerabilities"
                                :key="vulnerability"
                                variant="destructive"
                                class="vulnerability-badge"
                            >
                                {{ vulnerability }}
                            </Badge>
                        </div>
                    </div>
                </div>

                <!-- Severity Distribution -->
                <div class="severity-distribution">
                    <h3 class="severity-title">Severity Distribution</h3>
                    <div class="severity-bubbles">
                        <div class="severity-item">
                            <SeverityBubble
                                :critical="true"
                                :deactivated="dependency.severity_dist.critical == 0"
                            >
                                <template #content>
                                    {{ dependency.severity_dist.critical }}
                                </template>
                            </SeverityBubble>
                            <span class="severity-label">Critical</span>
                        </div>

                        <div class="severity-item">
                            <SeverityBubble
                                :high="true"
                                :deactivated="dependency.severity_dist.high == 0"
                            >
                                <template #content>
                                    {{ dependency.severity_dist.high }}
                                </template>
                            </SeverityBubble>
                            <span class="severity-label">High</span>
                        </div>

                        <div class="severity-item">
                            <SeverityBubble
                                :medium="true"
                                :deactivated="dependency.severity_dist.medium == 0"
                            >
                                <template #content>
                                    {{ dependency.severity_dist.medium }}
                                </template>
                            </SeverityBubble>
                            <span class="severity-label">Medium</span>
                        </div>

                        <div class="severity-item">
                            <SeverityBubble
                                :low="true"
                                :deactivated="dependency.severity_dist.low == 0"
                            >
                                <template #content>
                                    {{ dependency.severity_dist.low }}
                                </template>
                            </SeverityBubble>
                            <span class="severity-label">Low</span>
                        </div>

                        <div class="severity-item">
                            <SeverityBubble
                                :none="true"
                                :deactivated="dependency.severity_dist.none == 0"
                            >
                                <template #content>
                                    {{ dependency.severity_dist.none }}
                                </template>
                            </SeverityBubble>
                            <span class="severity-label">Info</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Healthy State -->
            <div
                v-else-if="
                    moment(dependency.lastest_release_date).diff(
                        moment(dependency.release_date),
                        'days'
                    ) <= 182 && dependency.license !== ''
                "
                class="health-status healthy"
            >
                <div class="healthy-indicator">
                    <Icon icon="material-symbols:check-circle" class="healthy-icon" />
                    <div class="healthy-content">
                        <h3 class="healthy-title">Package appears healthy</h3>
                        <p class="healthy-description">
                            No security vulnerabilities, licensing issues, or outdated versions
                            detected.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';

.dependency-health-panel {
    height: 100%;
}

.section-header {
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
}

.section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}

.health-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.health-issues {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.health-alert {
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid;

    &.outdated {
        border-left-color: #f59e0b;
        background-color: #fef3c7;
    }

    &.unlicensed {
        border-left-color: #3b82f6;
        background-color: #dbeafe;
    }

    &.vulnerable {
        border-left-color: #ef4444;
        background-color: #fecaca;
    }
}

.alert-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.alert-icon {
    font-size: 1.125rem;
}

.alert-title {
    font-weight: 600;
    font-size: 0.9rem;
}

.outdated .alert-icon,
.outdated .alert-title {
    color: #d97706;
}

.unlicensed .alert-icon,
.unlicensed .alert-title {
    color: #2563eb;
}

.vulnerable .alert-icon,
.vulnerable .alert-title {
    color: #dc2626;
}

.alert-message {
    font-size: 0.875rem;
    line-height: 1.5;
    color: #374151;

    p {
        margin: 0 0 0.5rem 0;

        &:last-child {
            margin-bottom: 0;
        }
    }

    code {
        background: rgba(0, 0, 0, 0.05);
        padding: 0.125rem 0.25rem;
        border-radius: 4px;
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        font-size: 0.8rem;
        font-weight: 500;
    }
}

.recommendation {
    font-weight: 500;
    margin-top: 0.5rem;
}

.legal-notice {
    font-size: 0.8rem;
    font-style: italic;
    opacity: 0.8;
}

.vulnerability-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.vulnerabilities-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.vulnerability-badge {
    font-size: 0.75rem;
    font-weight: 500;
}

.severity-distribution {
    background: #f9fafb;
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid #e5e7eb;
}

.severity-title {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: #374151;
}

.severity-bubbles {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.severity-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
}

.severity-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
}

.health-status.healthy {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 1.5rem;
}

.healthy-indicator {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}

.healthy-icon {
    font-size: 1.5rem;
    color: #22c55e;
    flex-shrink: 0;
}

.healthy-content {
    flex: 1;
}

.healthy-title {
    font-size: 1rem;
    font-weight: 600;
    color: #16a34a;
    margin: 0 0 0.5rem 0;
}

.healthy-description {
    font-size: 0.875rem;
    color: #374151;
    margin: 0;
    line-height: 1.5;
}

@media (max-width: 768px) {
    .severity-bubbles {
        justify-content: center;
        gap: 0.75rem;
    }

    .healthy-indicator {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
    }

    .alert-message {
        font-size: 0.8rem;
    }
}
</style>
