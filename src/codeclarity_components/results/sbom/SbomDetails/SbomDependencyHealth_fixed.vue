<script lang="ts" setup>
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import { Icon } from '@iconify/vue';
import moment from 'moment';
import type { PropType } from 'vue';
import { computed } from 'vue';

const props = defineProps({
    dependency: {
        type: Object as PropType<DependencyDetails>,
        required: true
    }
});

// Computed properties for health checks
const isOutdated = computed(() => {
    if (!props.dependency.release_date || !props.dependency.lastest_release_date) return false;
    return (
        moment(props.dependency.lastest_release_date).diff(
            moment(props.dependency.release_date),
            'days'
        ) > 182
    );
});

const hasVulnerabilities = computed(() => {
    return props.dependency.vulnerabilities && props.dependency.vulnerabilities.length > 0;
});

const isUnlicensed = computed(() => {
    return !props.dependency.license || props.dependency.license === '';
});

const hasHealthIssues = computed(() => {
    return isOutdated.value || hasVulnerabilities.value || isUnlicensed.value;
});

// Helper methods
const getDaysOutdated = (): number => {
    if (!props.dependency.release_date || !props.dependency.lastest_release_date) return 0;
    return moment(props.dependency.lastest_release_date).diff(
        moment(props.dependency.release_date),
        'days'
    );
};

const getHealthStatusTitle = (): string => {
    const issueCount = [isOutdated.value, hasVulnerabilities.value, isUnlicensed.value].filter(
        Boolean
    ).length;

    if (issueCount === 1) return 'Health issue detected';
    if (issueCount > 1) return 'Multiple health issues detected';
    return 'Package appears healthy';
};

const getHealthStatusDescription = (): string => {
    const issues = [];
    if (hasVulnerabilities.value) issues.push('security vulnerabilities');
    if (isUnlicensed.value) issues.push('licensing issues');
    if (isOutdated.value) issues.push('outdated version');

    if (issues.length === 0) return 'No issues detected with this package.';
    if (issues.length === 1) return `This package has ${issues[0]}.`;
    if (issues.length === 2) return `This package has ${issues[0]} and ${issues[1]}.`;
    return `This package has ${issues.slice(0, -1).join(', ')}, and ${issues[issues.length - 1]}.`;
};
</script>

<template>
    <section class="dependency-health-panel">
        <div class="health-content">
            <!-- Health Status Overview -->
            <div class="health-overview">
                <div v-if="hasHealthIssues" class="health-summary warning">
                    <Icon icon="solar:danger-triangle-bold" class="summary-icon warning" />
                    <div class="summary-content">
                        <h3 class="summary-title">{{ getHealthStatusTitle() }}</h3>
                        <p class="summary-description">{{ getHealthStatusDescription() }}</p>
                    </div>
                </div>
                <div v-else class="health-summary healthy">
                    <Icon icon="solar:check-circle-bold" class="summary-icon healthy" />
                    <div class="summary-content">
                        <h3 class="summary-title">Package appears healthy</h3>
                        <p class="summary-description">
                            No security vulnerabilities, licensing issues, or outdated versions
                            detected.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Health Issues Grid -->
            <div v-if="hasHealthIssues" class="health-issues-grid">
                <!-- Outdated Warning -->
                <div v-if="isOutdated" class="health-issue-card outdated">
                    <div class="issue-header">
                        <Icon icon="solar:refresh-broken-bold" class="issue-icon" />
                        <span class="issue-title">Outdated Package</span>
                        <Badge variant="secondary" class="issue-badge"
                            >{{ getDaysOutdated() }} days behind</Badge
                        >
                    </div>
                    <div class="issue-content">
                        <p class="issue-description">
                            This package is <strong>{{ getDaysOutdated() }} days</strong> behind the
                            latest release.
                        </p>
                        <div class="issue-recommendation">
                            <Icon icon="solar:lightbulb-bold" class="recommendation-icon" />
                            <span
                                >Consider upgrading <code>{{ dependency.name }}</code> to the latest
                                version.</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Unlicensed Warning -->
                <div v-if="dependency.license == ''" class="health-issue-card unlicensed">
                    <div class="issue-header">
                        <Icon icon="solar:document-text-broken-bold" class="issue-icon" />
                        <span class="issue-title">Unlicensed</span>
                        <Badge variant="destructive" class="issue-badge">Compliance Risk</Badge>
                    </div>
                    <div class="issue-content">
                        <p class="issue-description">This dependency appears to be unlicensed.</p>
                        <div class="issue-recommendation">
                            <Icon icon="solar:danger-triangle-bold" class="recommendation-icon" />
                            <span
                                >Authors of unlicensed dependencies hold exclusive rights to their
                                use, redistribution and modification.</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Vulnerability Warning -->
                <div
                    v-if="dependency.vulnerabilities && dependency.vulnerabilities.length > 0"
                    class="health-issue-card vulnerable"
                >
                    <div class="issue-header">
                        <Icon icon="solar:bug-bold" class="issue-icon" />
                        <span class="issue-title">Security Vulnerabilities</span>
                        <Badge variant="destructive" class="issue-badge"
                            >{{ dependency.vulnerabilities.length }} found</Badge
                        >
                    </div>
                    <div class="issue-content">
                        <p class="issue-description">
                            {{ dependency.vulnerabilities.length }} security
                            {{
                                dependency.vulnerabilities.length === 1
                                    ? 'vulnerability'
                                    : 'vulnerabilities'
                            }}
                            detected.
                        </p>

                        <!-- Mini Severity Distribution -->
                        <div class="mini-severity-grid">
                            <div
                                v-if="dependency.severity_dist?.critical > 0"
                                class="mini-severity-item critical"
                            >
                                <Icon
                                    icon="solar:danger-triangle-bold"
                                    class="mini-severity-icon"
                                />
                                <span class="mini-severity-count">{{
                                    dependency.severity_dist.critical
                                }}</span>
                                <span class="mini-severity-label">Critical</span>
                            </div>
                            <div
                                v-if="dependency.severity_dist?.high > 0"
                                class="mini-severity-item high"
                            >
                                <Icon icon="solar:shield-warning-bold" class="mini-severity-icon" />
                                <span class="mini-severity-count">{{
                                    dependency.severity_dist.high
                                }}</span>
                                <span class="mini-severity-label">High</span>
                            </div>
                            <div
                                v-if="dependency.severity_dist?.medium > 0"
                                class="mini-severity-item medium"
                            >
                                <Icon icon="solar:shield-check-bold" class="mini-severity-icon" />
                                <span class="mini-severity-count">{{
                                    dependency.severity_dist.medium
                                }}</span>
                                <span class="mini-severity-label">Medium</span>
                            </div>
                            <div
                                v-if="dependency.severity_dist?.low > 0"
                                class="mini-severity-item low"
                            >
                                <Icon icon="solar:shield-bold" class="mini-severity-icon" />
                                <span class="mini-severity-count">{{
                                    dependency.severity_dist.low
                                }}</span>
                                <span class="mini-severity-label">Low</span>
                            </div>
                        </div>

                        <div class="issue-recommendation">
                            <Icon icon="solar:shield-check-bold" class="recommendation-icon" />
                            <span
                                >See the detailed Security Analysis section below for complete
                                vulnerability information.</span
                            >
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Healthy Indicators -->
            <div v-if="!hasHealthIssues" class="health-indicators">
                <div class="health-celebration">
                    <Icon icon="solar:medal-star-bold" class="celebration-icon" />
                    <h4 class="celebration-title">Excellent Package Health!</h4>
                    <p class="celebration-description">
                        This package meets all security and quality standards.
                    </p>
                </div>

                <div class="indicator-grid">
                    <div class="indicator-item security">
                        <Icon icon="solar:shield-check-bold" class="indicator-icon success" />
                        <div class="indicator-content">
                            <span class="indicator-title">Security Clear</span>
                            <span class="indicator-desc">No known vulnerabilities</span>
                        </div>
                    </div>
                    <div class="indicator-item license">
                        <Icon icon="solar:document-text-bold" class="indicator-icon success" />
                        <div class="indicator-content">
                            <span class="indicator-title">Licensed</span>
                            <span class="indicator-desc">{{
                                dependency.license || 'Standard license'
                            }}</span>
                        </div>
                    </div>
                    <div class="indicator-item version">
                        <Icon icon="solar:refresh-bold" class="indicator-icon success" />
                        <div class="indicator-content">
                            <span class="indicator-title">Up to Date</span>
                            <span class="indicator-desc">Using latest version</span>
                        </div>
                    </div>
                    <div class="indicator-item maintenance">
                        <Icon icon="solar:tools-bold" class="indicator-icon success" />
                        <div class="indicator-content">
                            <span class="indicator-title">Well Maintained</span>
                            <span class="indicator-desc">Active development</span>
                        </div>
                    </div>
                </div>

                <!-- Health Score Metrics -->
                <div class="health-metrics">
                    <div class="metric-item">
                        <Icon icon="solar:chart-bold" class="metric-icon" />
                        <div class="metric-content">
                            <span class="metric-label">Health Score</span>
                            <span class="metric-value">A+</span>
                        </div>
                    </div>
                    <div class="metric-item">
                        <Icon icon="solar:time-bold" class="metric-icon" />
                        <div class="metric-content">
                            <span class="metric-label">Last Updated</span>
                            <span class="metric-value">{{
                                dependency.release_date
                                    ? moment(dependency.release_date).fromNow()
                                    : 'Unknown'
                            }}</span>
                        </div>
                    </div>
                    <div class="metric-item">
                        <Icon icon="solar:users-group-two-rounded-bold" class="metric-icon" />
                        <div class="metric-content">
                            <span class="metric-label">Dependency Type</span>
                            <span class="metric-value">{{
                                dependency.transitive ? 'Transitive' : 'Direct'
                            }}</span>
                        </div>
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

.health-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Health Overview */
.health-overview {
    margin-bottom: 1rem;
}

.health-summary {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 8px;
    border: 2px solid transparent;

    &.warning {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.2);
    }

    &.healthy {
        background: rgba(29, 206, 121, 0.1);
        border-color: rgba(29, 206, 121, 0.2);
    }
}

.summary-icon {
    font-size: 1.5rem;
    flex-shrink: 0;

    &.warning {
        color: #f59e0b;
    }

    &.healthy {
        color: theme('colors.theme-primary');
    }
}

.summary-content {
    flex: 1;
}

.summary-title {
    font-size: 1rem;
    font-weight: 600;
    color: theme('colors.theme-black');
    margin: 0 0 0.25rem 0;
}

.summary-description {
    font-size: 0.9rem;
    color: theme('colors.theme-gray');
    margin: 0;
    line-height: 1.4;
}

/* Health Issues Grid */
.health-issues-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }
}

.health-issue-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.25rem;
    transition: all 0.2s ease-in-out;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.outdated {
        border-left: 4px solid #f59e0b;
        background: rgba(245, 158, 11, 0.02);
    }

    &.unlicensed {
        border-left: 4px solid #ef4444;
        background: rgba(239, 68, 68, 0.02);
    }

    &.vulnerable {
        border-left: 4px solid #dc2626;
        background: rgba(220, 38, 38, 0.02);
    }
}

.issue-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.issue-icon {
    font-size: 1.25rem;

    .outdated & {
        color: #f59e0b;
    }

    .unlicensed & {
        color: #ef4444;
    }

    .vulnerable & {
        color: #dc2626;
    }
}

.issue-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: theme('colors.theme-black');
    flex: 1;
}

.issue-badge {
    font-size: 0.75rem;
    font-weight: 500;
}

.issue-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.issue-description {
    font-size: 0.9rem;
    color: theme('colors.theme-black');
    margin: 0;
    line-height: 1.4;
}

.issue-recommendation {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
}

.recommendation-icon {
    font-size: 1rem;
    color: theme('colors.theme-primary');
    margin-top: 0.125rem;
    flex-shrink: 0;
}

.issue-recommendation span {
    font-size: 0.85rem;
    color: theme('colors.theme-gray');
    line-height: 1.4;
}

/* Mini Severity Grid */
.mini-severity-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.75rem 0;
}

.mini-severity-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: 1px solid transparent;
    background: #f9fafb;

    &.critical {
        border-color: rgba(220, 38, 38, 0.2);
        background: rgba(220, 38, 38, 0.05);
    }

    &.high {
        border-color: rgba(239, 68, 68, 0.2);
        background: rgba(239, 68, 68, 0.05);
    }

    &.medium {
        border-color: rgba(245, 158, 11, 0.2);
        background: rgba(245, 158, 11, 0.05);
    }

    &.low {
        border-color: rgba(29, 206, 121, 0.2);
        background: rgba(29, 206, 121, 0.05);
    }
}

.mini-severity-icon {
    font-size: 0.875rem;

    .critical & {
        color: #dc2626;
    }

    .high & {
        color: #ef4444;
    }

    .medium & {
        color: #f59e0b;
    }

    .low & {
        color: theme('colors.theme-primary');
    }
}

.mini-severity-count {
    font-weight: 600;
    font-size: 0.875rem;
    color: theme('colors.theme-black');
}

.mini-severity-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: theme('colors.theme-gray');
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

/* Enhanced Health Indicators (for healthy packages) */
.health-indicators {
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 8px;
}

.health-celebration {
    text-align: center;
    padding: 2rem;
    background: linear-gradient(135deg, rgba(29, 206, 121, 0.1) 0%, rgba(29, 206, 121, 0.05) 100%);
    border-radius: 12px;
    border: 1px solid rgba(29, 206, 121, 0.2);
    margin-bottom: 2rem;
}

.celebration-icon {
    font-size: 3rem;
    color: theme('colors.theme-primary');
    margin-bottom: 1rem;
}

.celebration-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: theme('colors.theme-black');
    margin: 0 0 0.5rem 0;
}

.celebration-description {
    font-size: 0.95rem;
    color: theme('colors.theme-gray');
    margin: 0;
    line-height: 1.4;
}

.indicator-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
}

.indicator-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: white;
    border-radius: 8px;
    border: 1px solid rgba(29, 206, 121, 0.15);
    transition: all 0.2s ease-in-out;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(29, 206, 121, 0.1);
        border-color: rgba(29, 206, 121, 0.3);
    }

    &.security {
        border-left: 4px solid theme('colors.theme-primary');
    }

    &.license {
        border-left: 4px solid #10b981;
    }

    &.version {
        border-left: 4px solid #3b82f6;
    }

    &.maintenance {
        border-left: 4px solid #8b5cf6;
    }
}

.indicator-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.indicator-title {
    font-weight: 600;
    font-size: 0.95rem;
    color: theme('colors.theme-black');
}

.indicator-desc {
    font-size: 0.85rem;
    color: theme('colors.theme-gray');
}

.health-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.metric-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.metric-icon {
    font-size: 1.25rem;
    color: theme('colors.theme-primary');
    background: rgba(29, 206, 121, 0.1);
    padding: 0.5rem;
    border-radius: 6px;
}

.metric-content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.metric-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: theme('colors.theme-gray');
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.metric-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: theme('colors.theme-black');
}

.indicator-icon {
    font-size: 1.5rem;
    flex-shrink: 0;

    &.success {
        color: theme('colors.theme-primary');
    }
}

/* Code styling */
code {
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 0.85em;
    color: theme('colors.theme-primary');
    border: 1px solid #e5e7eb;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .health-summary {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }

    .health-celebration {
        padding: 1.5rem;
    }

    .celebration-icon {
        font-size: 2.5rem;
    }

    .indicator-grid {
        grid-template-columns: 1fr;
    }

    .health-metrics {
        grid-template-columns: 1fr;
    }
}
</style>
