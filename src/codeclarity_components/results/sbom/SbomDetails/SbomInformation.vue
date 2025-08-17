<script lang="ts" setup>
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import { Badge } from '@/shadcn/ui/badge';
import { Icon } from '@iconify/vue';
import { calculateDateDifference, formatRelativeTime, isValidDate } from '@/utils/dateUtils';
import type { PropType } from 'vue';
import { computed } from 'vue';
import EcosystemBadge from '@/base_components/ui/EcosystemBadge.vue';
import { EcosystemDetector, EcosystemMetadataExtractor } from '@/utils/packageEcosystem';

const props = defineProps({
    dependency: {
        type: Object as PropType<DependencyDetails>,
        required: true
    }
});

// Ecosystem detection
const ecosystem = computed(() => {
    return EcosystemDetector.detectFromDependency(props.dependency);
});

const ecosystemMetadata = computed(() => {
    return EcosystemMetadataExtractor.extractMetadata(props.dependency, ecosystem.value);
});

// Computed properties for version management
const isVersionOutdated = computed(() => {
    if (!props.dependency.release_date || !props.dependency.lastest_release_date) return false;
    const diffDays = calculateDateDifference(
        props.dependency.lastest_release_date,
        props.dependency.release_date,
        'days'
    );
    return diffDays > 182; // 6 months
});

const getVersionLag = () => {
    if (!props.dependency.release_date || !props.dependency.lastest_release_date) return '';
    const diffDays = calculateDateDifference(
        props.dependency.lastest_release_date,
        props.dependency.release_date,
        'days'
    );

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} months`;
    return `${Math.round(diffDays / 365)} years`;
};

// Engine icon mapping
const getEngineIcon = (engineName: string): string => {
    const iconMap: { [key: string]: string } = {
        node: 'akar-icons:node-fill',
        npm: 'akar-icons:npm-fill',
        yarn: 'akar-icons:yarn-fill',
        python: 'akar-icons:python-fill',
        java: 'skill-icons:java-dark',
        go: 'skill-icons:golang',
        rust: 'skill-icons:rust',
        php: 'skill-icons:php-dark'
    };
    return iconMap[engineName.toLowerCase()] || 'solar:cpu-bolt-bold';
};

// Package age calculations
const getPackageAge = (): string => {
    if (!props.dependency.release_date) return 'Unknown';

    const diffDays = calculateDateDifference(new Date(), props.dependency.release_date, 'days');

    if (diffDays < 30) return `${diffDays} days old`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} months old`;
    return `${Math.round(diffDays / 365)} years old`;
};

const getAgeClass = (): string => {
    if (!props.dependency.release_date) return 'unknown';

    const diffDays = calculateDateDifference(new Date(), props.dependency.release_date, 'days');

    if (diffDays < 90) return 'fresh'; // < 3 months
    if (diffDays < 365) return 'moderate'; // < 1 year
    if (diffDays < 730) return 'old'; // < 2 years
    return 'very-old'; // > 2 years
};

const getAgeIcon = (): string => {
    const ageClass = getAgeClass();
    const iconMap: { [key: string]: string } = {
        fresh: 'solar:star-bold',
        moderate: 'solar:clock-circle-bold',
        old: 'solar:history-bold',
        'very-old': 'solar:danger-triangle-bold',
        unknown: 'solar:question-circle-bold'
    };
    return iconMap[ageClass];
};

const getAgeDescription = (): string => {
    const ageClass = getAgeClass();
    const descriptions: { [key: string]: string } = {
        fresh: 'Recently released package',
        moderate: 'Moderately aged package',
        old: 'Older package, consider checking for updates',
        'very-old': 'Very old package, review maintenance status',
        unknown: 'Release date unavailable'
    };
    return descriptions[ageClass];
};
</script>

<template>
    <div class="information-panel">
        <!-- Package Manager Section -->
        <div class="info-section">
            <div class="section-header">
                <Icon icon="solar:box-bold" class="section-icon" />
                <h3 class="section-title">Package Source</h3>
            </div>
            <div class="info-grid">
                <div class="info-card primary">
                    <div class="info-card-header">
                        <Icon icon="solar:download-bold" class="info-icon" />
                        <span class="info-title">Package Ecosystem</span>
                    </div>
                    <div class="info-card-content">
                        <div class="integration-info">
                            <a
                                v-if="ecosystem.website"
                                :href="`${ecosystem.website}/package/${dependency.name}`"
                                target="_blank"
                                class="integration-link"
                                :class="ecosystem.type"
                            >
                                <Icon :icon="ecosystem.icon" class="integration-icon" :style="{ color: ecosystem.color }" />
                                <span class="integration-text">{{ ecosystem.name }}</span>
                                <Icon icon="solar:external-link-linear" class="external-icon" />
                            </a>
                            <div v-else class="integration-link" :class="ecosystem.type">
                                <Icon :icon="ecosystem.icon" class="integration-icon" :style="{ color: ecosystem.color }" />
                                <span class="integration-text">{{ ecosystem.name }}</span>
                            </div>
                        </div>
                        
                        <!-- Show available tools for this ecosystem -->
                        <div v-if="ecosystem.tools.length > 0" class="mt-3">
                            <div class="text-xs text-gray-500 mb-2">Compatible tools:</div>
                            <div class="flex flex-wrap gap-1">
                                <Badge 
                                    v-for="tool in ecosystem.tools" 
                                    :key="tool" 
                                    variant="outline" 
                                    class="text-xs"
                                >
                                    {{ tool }}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="info-card">
                    <div class="info-card-header">
                        <Icon icon="solar:hierarchy-2-bold" class="info-icon" />
                        <span class="info-title">Dependency Type</span>
                    </div>
                    <div class="info-card-content">
                        <div class="dependency-type">
                            <Icon
                                :icon="
                                    dependency.transitive
                                        ? 'solar:hierarchy-2-linear'
                                        : 'solar:download-linear'
                                "
                                :class="[
                                    'type-icon',
                                    dependency.transitive ? 'transitive' : 'direct'
                                ]"
                            />
                            <span class="type-text">{{
                                dependency.transitive ? 'Transitive' : 'Direct'
                            }}</span>
                        </div>
                        <p class="type-description">
                            {{
                                dependency.transitive
                                    ? 'Indirect dependency through another package'
                                    : 'Direct dependency in your project'
                            }}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Version Information Section -->
        <div class="info-section">
            <div class="section-header">
                <Icon icon="solar:tag-bold" class="section-icon" />
                <h3 class="section-title">Version Information</h3>
            </div>
            <div class="version-grid">
                <div class="version-item current">
                    <div class="version-label">
                        <Icon icon="solar:bookmark-bold" class="version-icon current" />
                        <span>Current Version</span>
                    </div>
                    <Badge variant="outline" class="version-badge current">{{
                        dependency.version
                    }}</Badge>
                    <div
                        v-if="dependency.release_date && isValidDate(dependency.release_date)"
                        class="version-date"
                    >
                        Released {{ formatRelativeTime(dependency.release_date) }}
                    </div>
                </div>

                <div class="version-item latest">
                    <div class="version-label">
                        <Icon icon="solar:star-bold" class="version-icon latest" />
                        <span>Latest Version</span>
                    </div>
                    <Badge variant="outline" class="version-badge latest">{{
                        dependency.latest_version
                    }}</Badge>
                    <div
                        v-if="
                            dependency.lastest_release_date &&
                            isValidDate(dependency.lastest_release_date)
                        "
                        class="version-date"
                    >
                        Released {{ formatRelativeTime(dependency.lastest_release_date) }}
                    </div>
                </div>

                <div v-if="isVersionOutdated" class="version-status outdated">
                    <Icon icon="solar:clock-circle-bold" class="status-icon outdated" />
                    <div class="status-content">
                        <span class="status-title">Version Status</span>
                        <p class="status-description">
                            {{ getVersionLag() }} behind the latest release
                        </p>
                    </div>
                </div>

                <div v-else class="version-status current">
                    <Icon icon="solar:check-circle-bold" class="status-icon current" />
                    <div class="status-content">
                        <span class="status-title">Version Status</span>
                        <p class="status-description">Using the latest version</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Technical Details Section -->
        <div class="info-section">
            <div class="section-header">
                <Icon icon="solar:settings-bold" class="section-icon" />
                <h3 class="section-title">Technical Details</h3>
            </div>
            <div class="details-grid">
                <!-- License Information -->
                <div class="detail-card license">
                    <div class="detail-header">
                        <Icon icon="solar:document-text-bold" class="detail-icon" />
                        <span class="detail-title">License</span>
                    </div>
                    <div class="detail-content">
                        <div
                            v-if="dependency.license && dependency.license !== ''"
                            class="license-info valid"
                        >
                            <Badge variant="outline" class="license-badge valid">
                                {{ dependency.license }}
                            </Badge>
                            <span class="license-status">Licensed</span>
                        </div>
                        <div v-else class="license-info invalid">
                            <Badge variant="destructive" class="license-badge invalid">
                                <Icon icon="solar:danger-triangle-bold" class="mr-1" />
                                Unlicensed
                            </Badge>
                            <span class="license-status">No license information</span>
                        </div>
                    </div>
                </div>

                <!-- Engine Support -->
                <div
                    v-if="dependency.engines && Object.keys(dependency.engines).length > 0"
                    class="detail-card engines"
                >
                    <div class="detail-header">
                        <Icon icon="solar:cpu-bolt-bold" class="detail-icon" />
                        <span class="detail-title">Engine Support</span>
                    </div>
                    <div class="detail-content">
                        <div class="engines-list">
                            <div
                                v-for="(value, key) in dependency.engines"
                                :key="key"
                                class="engine-item"
                            >
                                <Icon
                                    :icon="getEngineIcon(String(key))"
                                    :class="['engine-icon', String(key).toLowerCase()]"
                                />
                                <div class="engine-info">
                                    <span class="engine-name">{{
                                        String(key).charAt(0).toUpperCase() + String(key).slice(1)
                                    }}</span>
                                    <code class="engine-version">{{ value }}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ecosystem-specific Metadata -->
                <div v-if="Object.keys(ecosystemMetadata).length > 0" class="detail-card ecosystem-metadata">
                    <div class="detail-header">
                        <Icon :icon="ecosystem.icon" class="detail-icon" :style="{ color: ecosystem.color }" />
                        <span class="detail-title">{{ ecosystem.language }} Metadata</span>
                    </div>
                    <div class="detail-content">
                        <div class="flex flex-col gap-4">
                            <!-- PHP Composer specific metadata -->
                            <template v-if="ecosystem.type === 'packagist'">
                                <div v-if="ecosystemMetadata.type" class="flex flex-col gap-2">
                                    <span class="text-sm font-semibold text-gray-700">Type:</span>
                                    <Badge variant="outline" class="w-fit text-xs">{{ ecosystemMetadata.type }}</Badge>
                                </div>
                                <div v-if="ecosystemMetadata.autoload" class="flex flex-col gap-2">
                                    <span class="text-sm font-semibold text-gray-700">Autoload:</span>
                                    <code class="font-mono text-xs bg-gray-100 p-2 rounded border border-gray-200 whitespace-pre-wrap max-h-32 overflow-y-auto">{{ JSON.stringify(ecosystemMetadata.autoload, null, 2) }}</code>
                                </div>
                                <div v-if="ecosystemMetadata.suggest && Object.keys(ecosystemMetadata.suggest).length > 0" class="flex flex-col gap-2">
                                    <span class="text-sm font-semibold text-gray-700">Suggested packages:</span>
                                    <div class="flex flex-col gap-2 max-h-24 overflow-y-auto">
                                        <div v-for="(reason, pkg) in ecosystemMetadata.suggest" :key="pkg" class="flex justify-between items-center p-1.5 bg-gray-50 rounded border border-gray-200">
                                            <code class="font-mono text-xs font-semibold text-blue-600">{{ pkg }}</code>
                                            <span class="text-xs text-gray-600 text-right max-w-60 break-words">{{ reason }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            
                            <!-- NPM specific metadata -->
                            <template v-if="ecosystem.type === 'npm'">
                                <div v-if="ecosystemMetadata.keywords && ecosystemMetadata.keywords.length > 0" class="flex flex-col gap-2">
                                    <span class="text-sm font-semibold text-gray-700">Keywords:</span>
                                    <div class="flex flex-wrap gap-1">
                                        <Badge v-for="keyword in ecosystemMetadata.keywords" :key="keyword" variant="outline" class="text-xs">
                                            {{ keyword }}
                                        </Badge>
                                    </div>
                                </div>
                                <div v-if="ecosystemMetadata.engines" class="flex flex-col gap-2">
                                    <span class="text-sm font-semibold text-gray-700">Engines:</span>
                                    <code class="font-mono text-xs bg-gray-100 p-2 rounded border border-gray-200 whitespace-pre-wrap max-h-32 overflow-y-auto">{{ JSON.stringify(ecosystemMetadata.engines, null, 2) }}</code>
                                </div>
                                <div v-if="ecosystemMetadata.peerDependencies && Object.keys(ecosystemMetadata.peerDependencies).length > 0" class="flex flex-col gap-2">
                                    <span class="text-sm font-semibold text-gray-700">Peer Dependencies:</span>
                                    <div class="flex flex-col gap-2 max-h-24 overflow-y-auto">
                                        <div v-for="(version, pkg) in ecosystemMetadata.peerDependencies" :key="pkg" class="flex justify-between items-center p-1.5 bg-gray-50 rounded border border-gray-200">
                                            <code class="font-mono text-xs font-semibold text-blue-600">{{ pkg }}</code>
                                            <span class="text-xs text-gray-600">{{ version }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Package Age Indicator -->
                <div class="detail-card age">
                    <div class="detail-header">
                        <Icon icon="solar:calendar-bold" class="detail-icon" />
                        <span class="detail-title">Package Age</span>
                    </div>
                    <div class="detail-content">
                        <div class="age-info">
                            <div class="age-indicator">
                                <Icon :icon="getAgeIcon()" :class="['age-icon', getAgeClass()]" />
                                <span :class="['age-text', getAgeClass()]">{{
                                    getPackageAge()
                                }}</span>
                            </div>
                            <p class="age-description">{{ getAgeDescription() }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';

.information-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* Section Headers */
.info-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e5e7eb;
}

.section-icon {
    font-size: 1.25rem;
    color: theme('colors.theme-primary');
}

.section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: theme('colors.theme-black');
    margin: 0;
}

/* Grid Layouts */
.info-grid,
.details-grid {
    display: grid;
    gap: 1rem;
}

.info-grid {
    grid-template-columns: 1fr;

    @media (min-width: 640px) {
        grid-template-columns: 1fr 1fr;
    }
}

.details-grid {
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
}

.version-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    grid-template-rows: auto auto;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
}

/* Card Components */
.info-card,
.detail-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.25rem;
    transition: all 0.2s ease-in-out;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: rgba(29, 206, 121, 0.3);
    }

    &.primary {
        border-left: 4px solid theme('colors.theme-primary');
        background: rgba(29, 206, 121, 0.02);
    }
}

.info-card-header,
.detail-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.info-icon,
.detail-icon {
    font-size: 1rem;
    color: theme('colors.theme-primary');
}

.info-title,
.detail-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: theme('colors.theme-black');
}

.info-card-content,
.detail-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

/* Integration Links */
.integration-info {
    display: flex;
    align-items: center;
    width: 100%;
}

.integration-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: theme('colors.theme-black');
    font-weight: 500;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    transition: all 0.2s ease-in-out;
    width: 100%;

    &.npm {
        &:hover {
            background: rgba(203, 56, 55, 0.1);
            color: #cb3837;
        }
    }

    &.yarn {
        &:hover {
            background: rgba(44, 142, 187, 0.1);
            color: #2c8ebb;
        }
    }

    &.self {
        background: rgba(75, 85, 99, 0.1);
        color: #4b5563;
        cursor: default;
    }

    &.unknown {
        background: rgba(156, 163, 175, 0.1);
        color: #6b7280;
        cursor: default;
    }
}

.integration-icon {
    font-size: 1.2rem;

    &.npm {
        color: #cb3837;
    }

    &.yarn {
        color: #2c8ebb;
    }

    &.self {
        color: theme('colors.theme-primary');
    }

    &.unknown {
        color: #9ca3af;
    }
}

.integration-text {
    flex: 1;
    font-size: 0.9rem;
}

.external-icon {
    font-size: 0.875rem;
    opacity: 0.7;
}

/* Dependency Type */
.dependency-type {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.type-icon {
    font-size: 1.1rem;

    &.direct {
        color: theme('colors.theme-primary');
    }

    &.transitive {
        color: #f59e0b;
    }
}

.type-text {
    font-weight: 600;
    color: theme('colors.theme-black');
}

.type-description {
    font-size: 0.8rem;
    color: theme('colors.theme-gray');
    margin: 0;
    line-height: 1.4;
}

/* Version Items */
.version-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.version-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.version-icon {
    font-size: 1rem;

    &.current {
        color: #6b7280;
    }

    &.latest {
        color: theme('colors.theme-primary');
    }
}

.version-badge {
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-weight: 600;
    font-size: 0.85rem;
    align-self: flex-start;

    &.current {
        background: rgba(75, 85, 99, 0.1);
        border-color: #6b7280;
        color: #374151;
    }

    &.latest {
        background: rgba(29, 206, 121, 0.1);
        border-color: rgba(29, 206, 121, 0.3);
        color: theme('colors.theme-primary');
    }
}

.version-date {
    font-size: 0.8rem;
    color: theme('colors.theme-gray');
    font-style: italic;
}

/* Version Status */
.version-status {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 8px;

    &.current {
        background: rgba(29, 206, 121, 0.1);
        border: 1px solid rgba(29, 206, 121, 0.2);
    }

    &.outdated {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.2);
    }
}

.status-icon {
    font-size: 1.25rem;

    &.current {
        color: theme('colors.theme-primary');
    }

    &.outdated {
        color: #f59e0b;
    }
}

.status-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.status-title {
    font-weight: 600;
    font-size: 0.9rem;
    color: theme('colors.theme-black');
}

.status-description {
    font-size: 0.8rem;
    color: theme('colors.theme-gray');
    margin: 0;
}

/* License Information */
.license-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.license-badge {
    font-weight: 600;
    font-size: 0.8rem;
    align-self: flex-start;

    &.valid {
        background: rgba(29, 206, 121, 0.1);
        border-color: rgba(29, 206, 121, 0.3);
        color: theme('colors.theme-primary');
    }
}

.license-status {
    font-size: 0.8rem;
    color: theme('colors.theme-gray');
}

/* Engine Support */
.engines-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.engine-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
}

.engine-icon {
    font-size: 1.25rem;

    &.node {
        color: #8cc84b;
    }

    &.npm {
        color: #cb3837;
    }

    &.yarn {
        color: #2c8ebb;
    }
}

.engine-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.engine-name {
    font-weight: 600;
    font-size: 0.8rem;
    color: theme('colors.theme-black');
    text-transform: capitalize;
}

.engine-version {
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 0.75rem;
    color: theme('colors.theme-gray');
    background: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
}

/* Package Age */
.age-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.age-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.age-icon {
    font-size: 1rem;

    &.fresh {
        color: theme('colors.theme-primary');
    }

    &.moderate {
        color: #f59e0b;
    }

    &.old {
        color: #ef4444;
    }

    &.very-old {
        color: #dc2626;
    }

    &.unknown {
        color: #9ca3af;
    }
}

.age-text {
    font-weight: 600;
    font-size: 0.9rem;

    &.fresh {
        color: theme('colors.theme-primary');
    }

    &.moderate {
        color: #f59e0b;
    }

    &.old {
        color: #ef4444;
    }

    &.very-old {
        color: #dc2626;
    }

    &.unknown {
        color: #9ca3af;
    }
}

.age-description {
    font-size: 0.8rem;
    color: theme('colors.theme-gray');
    margin: 0;
    line-height: 1.4;
}

/* Responsive Design */
@media (max-width: 768px) {
    .information-panel {
        gap: 1.5rem;
    }

    .info-grid,
    .details-grid {
        grid-template-columns: 1fr;
    }

    .version-grid {
        grid-template-columns: 1fr;
    }

    .info-card,
    .detail-card {
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .version-status {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}
</style>
