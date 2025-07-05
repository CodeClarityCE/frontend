<script lang="ts" setup>
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import { Badge } from '@/shadcn/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn/ui/tooltip';
import { Icon } from '@iconify/vue';
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
    <div class="information-panel">
        <div class="section-header">
            <h2 class="section-title">Information</h2>
        </div>

        <div class="info-content">
            <!-- Package Manager -->
            <div class="info-item">
                <div class="info-label">Integrated through:</div>
                <div class="info-value">
                    <div v-if="dependency.package_manager == 'NPM'" class="integration-info">
                        <a
                            :href="`https://www.npmjs.com/package/${dependency.name}/v/${dependency.version}`"
                            target="_blank"
                            class="integration-link"
                        >
                            <Icon :icon="'akar-icons:npm-fill'" class="integration-icon"></Icon>
                            <span>NPM</span>
                        </a>
                    </div>
                    <div v-else-if="dependency.package_manager == 'YARN'" class="integration-info">
                        <a
                            :href="`https://yarnpkg.com/package?name=${dependency.name}&version=${dependency.version}`"
                            target="_blank"
                            class="integration-link"
                        >
                            <Icon :icon="'akar-icons:yarn-fill'" class="integration-icon"></Icon>
                            <span>Yarn</span>
                        </a>
                    </div>
                    <div v-else-if="dependency.package_manager == 'SELF'" class="integration-info">
                        <Icon :icon="'ion:document-outline'" class="integration-icon"></Icon>
                        <span class="font-semibold">{{ dependency.name }}</span>
                        <span class="text-sm text-gray-500">self-managed</span>
                    </div>
                </div>
            </div>

            <!-- Version Information -->
            <div class="info-item">
                <div class="info-label">Version:</div>
                <div class="info-value">
                    <Badge variant="outline" class="version-badge">{{ dependency.version }}</Badge>
                </div>
            </div>

            <!-- Release Date -->
            <div
                v-if="
                    moment(dependency.release_date).toString() !==
                    'Mon Jan 01 0001 00:17:30 GMT+0017'
                "
                class="info-item"
            >
                <div class="info-label">Release Date:</div>
                <div class="info-value">
                    <span class="date-value">{{
                        moment(dependency.release_date).format('LL')
                    }}</span>
                </div>
            </div>

            <!-- Latest Version -->
            <div class="info-item">
                <div class="info-label">Latest Version:</div>
                <div class="info-value">
                    <Badge variant="outline" class="version-badge latest">{{
                        dependency.latest_version
                    }}</Badge>
                </div>
            </div>

            <!-- Latest Release Date -->
            <div
                v-if="
                    moment(dependency.lastest_release_date).toString() !==
                    'Mon Jan 01 0001 00:17:30 GMT+0017'
                "
                class="info-item"
            >
                <div class="info-label">Latest Release:</div>
                <div class="info-value">
                    <span class="date-value">{{
                        moment(dependency.lastest_release_date).format('LL')
                    }}</span>
                </div>
            </div>

            <!-- Engines -->
            <div v-if="dependency.engines" class="info-item">
                <div class="info-label">Engines Supported:</div>
                <div class="info-value">
                    <div class="engines-list">
                        <div
                            v-for="(value, key) in dependency.engines"
                            :key="key"
                            class="engine-item"
                        >
                            <Icon
                                v-if="dependency.engines.hasOwnProperty('node')"
                                :icon="'akar-icons:node-fill'"
                                class="engine-icon"
                            ></Icon>
                            <span class="engine-version">{{ value }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Status Information -->
            <div class="info-item">
                <div class="status-badges">
                    <div v-if="dependency.license == ''" class="status-item">
                        <div class="info-label">License:</div>
                        <Badge variant="destructive" class="status-badge">
                            <Icon icon="material-symbols:warning" class="mr-1" />
                            Unlicensed
                        </Badge>
                    </div>

                    <div v-if="dependency.license != ''" class="status-item">
                        <div class="info-label">License:</div>
                        <Badge variant="outline" class="license-badge">
                            {{ dependency.license }}
                        </Badge>
                    </div>

                    <div
                        v-if="
                            moment(dependency.lastest_release_date).diff(
                                moment(dependency.release_date),
                                'days'
                            ) > 182
                        "
                        class="status-item"
                    >
                        <div class="info-label">Status:</div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Badge variant="secondary" class="status-badge outdated">
                                        <Icon icon="material-symbols:update" class="mr-1" />
                                        Outdated
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div class="tooltip-content">
                                        <p>
                                            {{
                                                moment(dependency.lastest_release_date).diff(
                                                    moment(dependency.release_date),
                                                    'days'
                                                )
                                            }}
                                            days behind latest release
                                        </p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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

.info-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.info-label {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.875rem;
}

.info-value {
    display: flex;
    align-items: center;
}

.integration-info {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.integration-link {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    text-decoration: none;
    color: #1f2937;
    font-weight: 500;

    &:hover {
        color: colors.$base-color;
    }
}

.integration-icon {
    font-size: 1rem;
}

.version-badge {
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-weight: 500;
    font-size: 0.8rem;

    &.latest {
        color: #059669;
        border-color: #d1fae5;
        background-color: #ecfdf5;
    }
}

.date-value {
    font-weight: 400;
    color: #374151;
    font-size: 0.875rem;
}

.engines-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.engine-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.engine-icon {
    font-size: 1rem;
    color: #8cc84b;
}

.engine-version {
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
}

.status-badges {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.status-item {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.status-badge {
    align-self: flex-start;
    font-size: 0.8rem;

    &.outdated {
        color: #d97706;
        background-color: #fef3c7;
        border-color: #fbbf24;
    }
}

.license-badge {
    color: #059669;
    border-color: #d1fae5;
    background-color: #ecfdf5;
    font-weight: 500;
    font-size: 0.8rem;
}

.tooltip-content {
    max-width: 200px;

    p {
        margin: 0;
        font-size: 0.875rem;
    }
}

@media (max-width: 768px) {
    .info-item {
        gap: 0.25rem;
    }
}
</style>
