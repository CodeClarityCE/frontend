<script lang="ts" setup>
import { type Ref, ref, watch, computed } from 'vue';
import SearchBar from '@/base_components/filters/SearchBar.vue';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import type {
    VulnerabilityMerged,
    WeaknessInfo
} from '@/codeclarity_components/results/vulnerabilities/VulnStats';
import { PatchType } from '@/codeclarity_components/results/vulnerabilities/VulnStats';
import { Icon } from '@iconify/vue';
// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import PaginationComponent from '@/base_components/utilities/PaginationComponent.vue';
import {
    isNoneSeverity,
    isCriticalSeverity,
    isHighSeverity,
    isLowSeverity,
    isMediumSeverity
} from '@/utils/severity';
import BubbleComponent from '@/base_components/data-display/bubbles/BubbleComponent.vue';
import InfoMarkdown from '@/base_components/ui/InfoMarkdown.vue';
import UtilitiesSort from '@/base_components/utilities/UtilitiesSort.vue';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import UtilitiesFilters, {
    createNewFilterState,
    FilterType,
    type FilterState
} from '@/base_components/filters/UtilitiesFilters.vue';
import ActiveFilterBar from '@/base_components/filters/ActiveFilterBar.vue';
import { ProjectsSortInterface } from '@/codeclarity_components/projects/project.repository';
import { Badge } from '@/shadcn/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn/ui/tooltip';
import AddToPolicyButton from './components/AddToPolicyButton.vue';

export interface Props {
    [key: string]: any;
    highlightElem: string;
    forceOpenNewTab?: boolean;
    analysisID?: string;
    projectID?: string;
    ecosystemFilter?: string | null;
    showBlacklisted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    forceOpenNewTab: false,
    analysisID: '',
    projectID: '',
    ecosystemFilter: null,
    showBlacklisted: true
});

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

// Repository setup
const resultsRepository = new ResultsRepository();

const selectionPageLimit = [5, 10, 20, 30, 40, 50, 75, 100];
const placeholder = 'Search by dependency, dependency version, or cve';

// UI state for improved hierarchy
const expandedCards: Ref<Set<string>> = ref(new Set());

const render: Ref<boolean> = ref(false);
const pageLimitSelected: Ref<number> = ref(10);
const nmbEntriesShowing: Ref<number> = ref(pageLimitSelected.value);
const matchingItemsCount: Ref<number> = ref(0);
const nmbEntriesTotal: Ref<number> = ref(0);
const pageNumber: Ref<number> = ref(0);
const totalPages: Ref<number> = ref(0);
const filterApplied: Ref<boolean> = ref(false);
const searchKey: Ref<string> = ref<string>('');
const findings: Ref<Array<VulnerabilityMerged>> = ref([]);
const sortKey: Ref<string> = ref(ProjectsSortInterface.SEVERITY);
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);

// Filters
const filterState: Ref<FilterState> = ref(
    createNewFilterState({
        AttributeState: {
            name: 'Matching',
            type: FilterType.CHECKBOX,
            data: {
                hide_correct_matching: {
                    title: 'Hide correct',
                    value: false
                },
                hide_possibly_incorrect_matching: {
                    title: 'Hide possibly incorrect',
                    value: false
                },
                hide_incorrect_matching: {
                    title: 'Hide incorrect',
                    value: false
                }
            }
        },
        BlacklistState: {
            name: 'Policy Status',
            type: FilterType.CHECKBOX,
            data: {
                show_blacklisted: {
                    title: 'Show blacklisted vulnerabilities',
                    value: props.showBlacklisted
                }
            }
        }
    })
);

const sortByOptions = [
    { label: 'CVE', key: 'cve' },
    { label: 'Severity', key: 'severity' },
    { label: 'Dependency Name', key: 'dep_name' },
    { label: 'Dependency Version', key: 'dep_version' },
    { label: 'Weakness', key: 'weakness' },
    { label: 'Owasp Top 10', key: 'owasp_top_10' }
];

const selected_workspace = defineModel<string>('selected_workspace', { default: '.' });

// OWASP Top 10 2021 mapping with descriptions
const owaspMapping: Record<
    string,
    {
        id: string;
        name: string;
        description: string;
        impact: string;
        color: string;
    }
> = {
    '1345': {
        id: 'A01',
        name: 'Broken Access Control',
        description:
            'Failures related to restrictions on what authenticated users are allowed to do.',
        impact: 'Unauthorized access to data, functions, or entire systems.',
        color: 'bg-red-50 border-red-200 text-red-800'
    },
    '1346': {
        id: 'A02',
        name: 'Cryptographic Failures',
        description: 'Failures related to cryptography which lead to exposure of sensitive data.',
        impact: 'Data breaches, identity theft, and exposure of sensitive information.',
        color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    '1347': {
        id: 'A03',
        name: 'Injection',
        description:
            'Application is vulnerable to injection attacks when untrusted data is sent as part of a command or query.',
        impact: 'Data loss, corruption, denial of access, or complete host takeover.',
        color: 'bg-red-50 border-red-200 text-red-800'
    },
    '1348': {
        id: 'A04',
        name: 'Insecure Design',
        description: 'Missing or ineffective control design that could have prevented attacks.',
        impact: 'Wide range of attacks depending on the missing security controls.',
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    '1349': {
        id: 'A05',
        name: 'Security Misconfiguration',
        description: 'Missing appropriate security hardening or improperly configured permissions.',
        impact: 'Unauthorized access to system data or functionality.',
        color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    '1352': {
        id: 'A06',
        name: 'Vulnerable Components',
        description: 'Using components with known vulnerabilities or outdated versions.',
        impact: 'Range from minimal to complete host takeover and data compromise.',
        color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    '1353': {
        id: 'A07',
        name: 'Authentication Failures',
        description: 'Application functions related to authentication and session management.',
        impact: 'Compromise of passwords, keys, or session tokens.',
        color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    },
    '1354': {
        id: 'A08',
        name: 'Software & Data Integrity',
        description: 'Code and infrastructure that does not protect against integrity violations.',
        impact: 'Unauthorized code execution and system compromise.',
        color: 'bg-pink-50 border-pink-200 text-pink-800'
    },
    '1355': {
        id: 'A09',
        name: 'Logging & Monitoring',
        description: 'Insufficient logging and monitoring coupled with missing incident response.',
        impact: 'Allows attacks to continue undetected and escalate.',
        color: 'bg-green-50 border-green-200 text-green-800'
    },
    '1356': {
        id: 'A10',
        name: 'Server-Side Request Forgery',
        description:
            'SSRF flaws occur when a web application fetches a remote resource without validating user-supplied URL.',
        impact: 'Unauthorized access to internal systems and data exfiltration.',
        color: 'bg-teal-50 border-teal-200 text-teal-800'
    }
};

function getUniqueOWASP(weaknessInfo: WeaknessInfo[]) {
    const owaspIds = weaknessInfo
        .map((weakness) => weakness.OWASPTop10Id)
        .filter((id) => id && id !== '');
    const uniqueOwaspIds = Array.from(new Set(owaspIds));
    return uniqueOwaspIds;
}

function getOwaspInfo(owaspId: string) {
    return (
        owaspMapping[owaspId] || {
            id: 'Unknown',
            name: 'Uncategorized',
            description: 'This vulnerability does not map to a specific OWASP Top 10 category.',
            impact: 'Impact varies depending on the specific vulnerability.',
            color: 'bg-gray-50 border-gray-200 text-gray-800'
        }
    );
}

function toggleCardExpansion(vulnerabilityId: string) {
    if (expandedCards.value.has(vulnerabilityId)) {
        expandedCards.value.delete(vulnerabilityId);
    } else {
        expandedCards.value.add(vulnerabilityId);
    }
}

function isCardExpanded(vulnerabilityId: string) {
    return expandedCards.value.has(vulnerabilityId);
}

function truncateDescription(description: string, maxLength: number = 150) {
    if (description.length <= maxLength) return description;

    // Remove markdown formatting like ####
    const cleanDescription = description.replace(/^#+\s*/, '').trim();

    if (cleanDescription.length <= maxLength) return cleanDescription;

    // Find the last complete word within the limit
    const truncated = cleanDescription.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > maxLength * 0.7) {
        return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
}

function getSeverityBorderColor(severityValue: number) {
    if (isCriticalSeverity(severityValue)) return 'border-l-red-600';
    if (isHighSeverity(severityValue)) return 'border-l-orange-500';
    if (isMediumSeverity(severityValue)) return 'border-l-yellow-500';
    if (isLowSeverity(severityValue)) return 'border-l-blue-500';
    return 'border-l-gray-400';
}

async function init() {
    if (!userStore.getDefaultOrg) {
        throw new Error('No default org selected');
    }
    if (!authStore.getToken) {
        throw new Error('No default org selected');
    }
    if (props.projectID == '' || props.analysisID == '') {
        return;
    }
    try {
        const res = await resultsRepository.getVulnerabilities({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: selected_workspace.value,
            bearerToken: authStore.getToken,
            pagination: {
                page: pageNumber.value,
                entries_per_page: pageLimitSelected.value
            },
            sort: {
                sortKey: sortKey.value,
                sortDirection: sortDirection.value
            },
            active_filters: filterState.value.toString(),
            search_key: searchKey.value,
            ecosystem_filter: props.ecosystemFilter || undefined,
            show_blacklisted: props.showBlacklisted
        });
        findings.value = res.data;
        render.value = true;
        pageNumber.value = res.page;
        pageLimitSelected.value = res.entries_per_page;
        nmbEntriesShowing.value = res.entry_count;
        matchingItemsCount.value = res.matching_count;
        nmbEntriesTotal.value = res.total_entries;
        totalPages.value = res.total_pages;
    } catch (error) {
        console.log(error);
        render.value = false;
    }
}

init();

watch(
    [
        pageLimitSelected,
        searchKey,
        sortKey,
        sortDirection,
        pageNumber,
        selected_workspace,
        () => props.ecosystemFilter,
        () => props.showBlacklisted
    ],
    () => {
        init();
    }
);

watch(() => filterState.value.activeFilters, init);

// Sync blacklisted filter with parent component
const showBlacklistedFromFilter = computed(() => {
    return filterState.value.filterConfig?.BlacklistState?.data?.show_blacklisted?.value || false;
});

// Define emit for updating parent's showBlacklisted value
const emit = defineEmits<{
    'update:showBlacklisted': [value: boolean];
}>();

// Watch for changes in the filter and emit to parent
watch(showBlacklistedFromFilter, (newValue) => {
    emit('update:showBlacklisted', newValue);
});

// Computed statistics for dashboard
const criticalCount = computed(() => {
    return findings.value.filter((vuln) => isCriticalSeverity(vuln.Severity.Severity)).length;
});

const highCount = computed(() => {
    return findings.value.filter((vuln) => isHighSeverity(vuln.Severity.Severity)).length;
});

const patchableCount = computed(() => {
    return findings.value.filter((vuln) =>
        vuln.Affected.some(
            (dep) => dep.PatchType === PatchType.Full || dep.PatchType === PatchType.Partial
        )
    ).length;
});

const exploitableCount = computed(() => {
    return findings.value.filter((vuln) => vuln.EPSS.Score > 0.1).length;
});
</script>

<template>
    <div class="container py-6 mx-auto space-y-6">
        <!-- Header Section -->
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Vulnerabilities
                    </h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Security vulnerabilities found in your project dependencies
                    </p>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Icon icon="tabler:shield-exclamation" class="w-4 h-4" />
                    <span>{{ nmbEntriesTotal }} total vulnerabilities</span>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-gray-950 border rounded-lg p-3">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:alert-triangle" class="w-4 h-4 text-red-500" />
                        <span
                            class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide"
                            >Critical</span
                        >
                    </div>
                    <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ criticalCount }}
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-950 border rounded-lg p-3">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:exclamation-circle" class="w-4 h-4 text-orange-500" />
                        <span
                            class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide"
                            >High</span
                        >
                    </div>
                    <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ highCount }}
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-950 border rounded-lg p-3">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:trending-up" class="w-4 h-4 text-purple-500" />
                        <span
                            class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide"
                            >Exploitable</span
                        >
                    </div>
                    <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ exploitableCount }}
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-950 border rounded-lg p-3">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:bandage" class="w-4 h-4 text-green-500" />
                        <span
                            class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide"
                            >Patchable</span
                        >
                    </div>
                    <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {{ patchableCount }}
                    </div>
                </div>
            </div>

            <!-- Security Indicators Legend -->
            <div
                class="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-lg p-4 border border-red-200 dark:border-red-800"
            >
                <h3
                    class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2"
                >
                    <Icon icon="tabler:info-circle" class="w-4 h-4" />
                    Vulnerability Indicators & Severity Levels
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div class="space-y-2">
                        <div class="font-medium text-gray-900 dark:text-gray-100">
                            Severity Levels
                        </div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-severityCritical rounded"></div>
                                <span class="text-gray-600 dark:text-gray-400"
                                    >Critical (9.0-10.0)</span
                                >
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-severityHigh rounded"></div>
                                <span class="text-gray-600 dark:text-gray-400">High (7.0-8.9)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-severityMedium rounded"></div>
                                <span class="text-gray-600 dark:text-gray-400"
                                    >Medium (4.0-6.9)</span
                                >
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-severityLow rounded"></div>
                                <span class="text-gray-600 dark:text-gray-400">Low (0.1-3.9)</span>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="font-medium text-gray-900 dark:text-gray-100">
                            Exploitation Risk
                        </div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:trending-up" class="w-3 h-3 text-red-600" />
                                <span class="text-gray-600 dark:text-gray-400"
                                    >EPSS > 10% (High risk)</span
                                >
                            </div>
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:alert-triangle" class="w-3 h-3 text-amber-600" />
                                <span class="text-gray-600 dark:text-gray-400"
                                    >Possible false match</span
                                >
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="font-medium text-gray-900 dark:text-gray-100">
                            Patching Status
                        </div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:bandage" class="w-3 h-3 text-green-600" />
                                <span class="text-gray-600 dark:text-gray-400"
                                    >Patch available</span
                                >
                            </div>
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:bandage-off" class="w-3 h-3 text-gray-500" />
                                <span class="text-gray-600 dark:text-gray-400"
                                    >No patch available</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Filters -->
        <div class="flex flex-col gap-4">
            <div class="flex gap-4">
                <SearchBar v-model:search-key="searchKey" :placeholder="placeholder" />
                <UtilitiesFilters v-model:filter-state="filterState"></UtilitiesFilters>
            </div>

            <!--------------------------------------------------------------------------->
            <!--                           Active Filters list                         -->
            <!--------------------------------------------------------------------------->

            <ActiveFilterBar v-model:filter-state="filterState"></ActiveFilterBar>

            <!--------------------------------------------------------------------------->
            <!--                        Pagination info and controls                   -->
            <!--------------------------------------------------------------------------->
            <UtilitiesSort
                v-model:page-limit-selected="pageLimitSelected"
                v-model:sort-key="sortKey"
                v-model:sort-direction="sortDirection"
                :selection-page-limit="selectionPageLimit"
                :sort-options="sortByOptions"
                :showing="nmbEntriesShowing"
                :total="nmbEntriesTotal"
            >
            </UtilitiesSort>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                           Vulnerabilities List                        -->
        <!--------------------------------------------------------------------------->

        <div v-if="render" class="flex flex-col gap-y-3">
            <div v-for="report in findings" :key="report.Id" class="vulnerability-card">
                <div
                    class="vulnerability-card-wrapper border border-gray-200 rounded-lg hover:shadow-lg transition-all border-l-4"
                    :class="getSeverityBorderColor(report.Severity.Severity)"
                >
                    <!-- Card Header: Most Important Info -->
                    <div
                        class="card-header flex items-start gap-4 p-3 cursor-pointer"
                        @click="toggleCardExpansion(report.Vulnerability)"
                    >
                        <!-- Severity Indicator -->
                        <div class="severity-badge flex-shrink-0">
                            <div
                                v-if="isCriticalSeverity(report.Severity.Severity)"
                                class="px-4 py-2 text-sm font-bold text-white bg-severityCritical rounded-md shadow-sm"
                            >
                                CRITICAL
                            </div>
                            <div
                                v-else-if="isHighSeverity(report.Severity.Severity)"
                                class="px-4 py-2 text-sm font-bold text-white bg-severityHigh rounded-md shadow-sm"
                            >
                                HIGH
                            </div>
                            <div
                                v-else-if="isMediumSeverity(report.Severity.Severity)"
                                class="px-4 py-2 text-sm font-bold text-white bg-severityMedium rounded-md shadow-sm"
                            >
                                MEDIUM
                            </div>
                            <div
                                v-else-if="isLowSeverity(report.Severity.Severity)"
                                class="px-4 py-2 text-sm font-bold text-white bg-severityLow rounded-md shadow-sm"
                            >
                                LOW
                            </div>
                            <div
                                v-else-if="isNoneSeverity(report.Severity.Severity)"
                                class="px-4 py-2 text-sm font-bold text-white bg-severityNone rounded-md shadow-sm"
                            >
                                NONE
                            </div>
                        </div>

                        <!-- Primary Information -->
                        <div class="flex-1 min-w-0">
                            <!-- CVE ID and Weakness Type -->
                            <div class="flex items-center gap-3 mb-1">
                                <h3 class="text-xl font-bold text-gray-900 tracking-tight">
                                    {{ report.Vulnerability }}
                                </h3>
                                <!-- Policy status indicator -->
                                <Badge
                                    v-if="report.is_blacklisted"
                                    class="bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold text-xs px-2.5 py-1.5 rounded-md"
                                >
                                    <Icon
                                        icon="solar:shield-cross-bold"
                                        class="w-3.5 h-3.5 mr-1.5"
                                    />
                                    Policy Excluded
                                </Badge>
                                <div
                                    v-if="report.Weaknesses && report.Weaknesses.length > 0"
                                    class="text-sm text-gray-500 font-medium"
                                >
                                    {{ report.Weaknesses[0].WeaknessName }}
                                </div>
                            </div>

                            <!-- Affected Libraries -->
                            <div class="mb-2">
                                <div class="flex flex-wrap gap-1.5">
                                    <Badge
                                        v-for="info in report.Affected.slice(0, 3)"
                                        :key="info.AffectedDependency"
                                        variant="outline"
                                        class="text-xs px-2 py-1"
                                    >
                                        {{ info.AffectedDependency }}@{{ info.AffectedVersion }}
                                    </Badge>
                                    <Badge
                                        v-if="report.Affected.length > 3"
                                        variant="outline"
                                        class="text-xs text-gray-500 px-2 py-1"
                                    >
                                        +{{ report.Affected.length - 3 }} more
                                    </Badge>
                                </div>
                            </div>

                            <!-- Description Preview -->
                            <div class="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                {{ truncateDescription(report.Description) }}
                            </div>

                            <!-- High Exploitation Risk Banner -->
                            <TooltipProvider v-if="report.EPSS.Score > 0.1">
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <div
                                            class="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium border border-red-200 cursor-help"
                                        >
                                            <Icon icon="tabler:trending-up" class="w-3 h-3" />
                                            <span
                                                >High exploitation probability ({{
                                                    (report.EPSS.Score * 100).toFixed(1)
                                                }}%)</span
                                            >
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        class="bg-white border border-gray-300 shadow-lg"
                                    >
                                        <div class="max-w-sm space-y-3 p-3">
                                            <div class="flex items-center gap-2">
                                                <Icon
                                                    icon="tabler:trending-up"
                                                    class="w-4 h-4 text-red-600"
                                                />
                                                <span class="font-semibold text-base text-gray-900">
                                                    EPSS Score:
                                                    {{ (report.EPSS.Score * 100).toFixed(1) }}%
                                                </span>
                                            </div>

                                            <div
                                                class="text-sm space-y-2 bg-gray-50 p-3 rounded-lg"
                                            >
                                                <div class="font-medium text-gray-900">
                                                    Exploit Prediction Scoring System
                                                </div>
                                                <div class="text-gray-600">
                                                    Predicts the probability that this vulnerability
                                                    will be exploited in the wild within the next 30
                                                    days.
                                                </div>
                                                <div class="text-gray-600">
                                                    <strong>Score > 10%:</strong> High likelihood of
                                                    exploitation - prioritize patching.
                                                </div>
                                            </div>

                                            <div class="pt-2 border-t border-gray-200">
                                                <a
                                                    href="https://www.first.org/epss/"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Learn more about EPSS
                                                    <Icon
                                                        icon="tabler:external-link"
                                                        class="w-3 h-3"
                                                    />
                                                </a>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <!-- Match Uncertainty Banner -->
                            <div
                                v-if="
                                    report.Conflict.ConflictFlag === 'MATCH_POSSIBLE_INCORRECT' ||
                                    report.Conflict.ConflictFlag === 'MATCH_INCORRECT'
                                "
                                class="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border"
                                :class="{
                                    'bg-amber-50 text-amber-700 border-amber-200':
                                        report.Conflict.ConflictFlag === 'MATCH_POSSIBLE_INCORRECT',
                                    'bg-red-50 text-red-700 border-red-200':
                                        report.Conflict.ConflictFlag === 'MATCH_INCORRECT'
                                }"
                            >
                                <Icon icon="tabler:alert-triangle" class="w-3 h-3" />
                                <span
                                    v-if="
                                        report.Conflict.ConflictFlag === 'MATCH_POSSIBLE_INCORRECT'
                                    "
                                >
                                    OSV and NVD data sources disagree
                                </span>
                                <span v-else> Vulnerability match is incorrect </span>
                            </div>
                        </div>

                        <!-- Quick Actions & Key Metrics -->
                        <div class="flex-shrink-0 flex items-center gap-2">
                            <!-- Add to Policy Button -->
                            <AddToPolicyButton
                                v-if="!report.is_blacklisted"
                                :vulnerability-id="report.Vulnerability"
                                size="sm"
                                variant="outline"
                            />

                            <!-- High Impact Warning -->
                            <TooltipProvider v-if="report.EPSS.Score > 0.1">
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <div
                                            class="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md border border-red-200 cursor-help"
                                        >
                                            <Icon
                                                icon="tabler:alert-triangle-filled"
                                                class="w-4 h-4"
                                            />
                                            <span class="text-xs font-semibold">HIGH RISK</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        class="bg-white border border-gray-300 shadow-lg"
                                    >
                                        <div class="max-w-sm space-y-3 p-3">
                                            <div class="flex items-center gap-2">
                                                <Icon
                                                    icon="tabler:alert-triangle-filled"
                                                    class="w-4 h-4 text-red-600"
                                                />
                                                <span class="font-semibold text-base text-gray-900">
                                                    High Risk Vulnerability
                                                </span>
                                            </div>

                                            <div
                                                class="text-sm space-y-2 bg-gray-50 p-3 rounded-lg"
                                            >
                                                <div class="font-medium text-gray-900">
                                                    Priority Action Required
                                                </div>
                                                <div class="text-gray-600">
                                                    This vulnerability has a high probability ({{
                                                        (report.EPSS.Score * 100).toFixed(1)
                                                    }}%) of being exploited in the wild.
                                                </div>
                                                <div class="text-gray-600">
                                                    <strong>Recommendation:</strong> Prioritize
                                                    patching or implementing mitigations
                                                    immediately.
                                                </div>
                                            </div>

                                            <div class="pt-2 border-t border-gray-200">
                                                <p
                                                    class="text-sm text-gray-800 font-medium flex items-center gap-1"
                                                >
                                                    <span class="text-red-600">⚠</span> High
                                                    exploitation probability detected via EPSS
                                                    scoring
                                                </p>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <!-- Conflict Warning -->
                            <TooltipProvider
                                v-if="
                                    report.Conflict.ConflictFlag === 'MATCH_POSSIBLE_INCORRECT' ||
                                    report.Conflict.ConflictFlag === 'MATCH_INCORRECT'
                                "
                            >
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <div
                                            class="flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold cursor-help"
                                            :class="{
                                                'bg-amber-50 text-amber-700 border-amber-200':
                                                    report.Conflict.ConflictFlag ===
                                                    'MATCH_POSSIBLE_INCORRECT',
                                                'bg-red-100 text-red-700 border-red-200':
                                                    report.Conflict.ConflictFlag ===
                                                    'MATCH_INCORRECT'
                                            }"
                                        >
                                            <Icon
                                                icon="tabler:alert-triangle-filled"
                                                class="w-4 h-4"
                                            />
                                            <span
                                                v-if="
                                                    report.Conflict.ConflictFlag ===
                                                    'MATCH_POSSIBLE_INCORRECT'
                                                "
                                            >
                                                UNCERTAIN
                                            </span>
                                            <span v-else> MISMATCH </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        class="bg-white border border-gray-300 shadow-lg"
                                    >
                                        <div class="max-w-sm space-y-3 p-3">
                                            <div class="flex items-center gap-2">
                                                <Icon
                                                    icon="tabler:alert-triangle-filled"
                                                    class="w-4 h-4"
                                                    :class="{
                                                        'text-amber-600':
                                                            report.Conflict.ConflictFlag ===
                                                            'MATCH_POSSIBLE_INCORRECT',
                                                        'text-red-600':
                                                            report.Conflict.ConflictFlag ===
                                                            'MATCH_INCORRECT'
                                                    }"
                                                />
                                                <span class="font-semibold text-base text-gray-900">
                                                    Match Reliability Warning
                                                </span>
                                            </div>

                                            <div
                                                class="text-sm space-y-2 bg-gray-50 p-3 rounded-lg"
                                            >
                                                <div class="font-medium text-gray-900">
                                                    {{
                                                        report.Conflict.ConflictFlag ===
                                                        'MATCH_POSSIBLE_INCORRECT'
                                                            ? 'Possibly Incorrect Match'
                                                            : 'Incorrect Match'
                                                    }}
                                                </div>
                                                <div class="text-gray-600">
                                                    {{
                                                        report.Conflict.ConflictFlag ===
                                                        'MATCH_POSSIBLE_INCORRECT'
                                                            ? 'NVD and OSV databases disagree on this vulnerability match. The vulnerability may not actually affect this dependency version.'
                                                            : 'This vulnerability match has been determined to be incorrect. The vulnerability likely does not affect this dependency.'
                                                    }}
                                                </div>
                                                <div class="text-gray-600">
                                                    <strong>Recommendation:</strong>
                                                    {{
                                                        report.Conflict.ConflictFlag ===
                                                        'MATCH_POSSIBLE_INCORRECT'
                                                            ? 'Verify manually before taking action.'
                                                            : 'This can likely be ignored unless manual verification confirms otherwise.'
                                                    }}
                                                </div>
                                            </div>

                                            <div class="pt-2 border-t border-gray-200">
                                                <p
                                                    class="text-sm text-gray-800 font-medium flex items-center gap-1"
                                                >
                                                    <span
                                                        :class="{
                                                            'text-amber-600':
                                                                report.Conflict.ConflictFlag ===
                                                                'MATCH_POSSIBLE_INCORRECT',
                                                            'text-red-600':
                                                                report.Conflict.ConflictFlag ===
                                                                'MATCH_INCORRECT'
                                                        }"
                                                        >⚠</span
                                                    >
                                                    Cross-reference with multiple vulnerability
                                                    databases recommended
                                                </p>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <!-- Expand/Collapse Icon -->
                            <Icon
                                :icon="
                                    isCardExpanded(report.Vulnerability)
                                        ? 'tabler:chevron-up'
                                        : 'tabler:chevron-down'
                                "
                                class="w-5 h-5 text-gray-400"
                            />
                        </div>
                    </div>

                    <!-- Expandable Content -->
                    <div
                        v-if="isCardExpanded(report.Vulnerability)"
                        class="card-body border-t border-gray-100 p-3"
                    >
                        <!-- Secondary Metrics Row -->
                        <div class="flex flex-wrap gap-1.5 mb-3">
                            <!-- EPSS Score -->
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <Badge
                                            variant="secondary"
                                            class="text-xs px-2 py-1 cursor-help"
                                        >
                                            EPSS {{ (report.EPSS.Score * 100).toFixed(1) }}%
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        class="bg-white border border-gray-300 shadow-lg"
                                    >
                                        <div class="max-w-sm space-y-3 p-3">
                                            <div class="flex items-center gap-2">
                                                <Icon
                                                    icon="tabler:trending-up"
                                                    class="w-4 h-4 text-red-600"
                                                />
                                                <span class="font-semibold text-base text-gray-900">
                                                    EPSS Score:
                                                    {{ (report.EPSS.Score * 100).toFixed(1) }}%
                                                </span>
                                            </div>

                                            <div
                                                class="text-sm space-y-2 bg-gray-50 p-3 rounded-lg"
                                            >
                                                <div class="font-medium text-gray-900">
                                                    Exploit Prediction Scoring System
                                                </div>
                                                <div class="text-gray-600">
                                                    Predicts the probability that this vulnerability
                                                    will be exploited in the wild within the next 30
                                                    days.
                                                </div>
                                                <div class="text-gray-600">
                                                    <strong>Score > 10%:</strong> High likelihood of
                                                    exploitation - prioritize patching.
                                                </div>
                                            </div>

                                            <div class="pt-2 border-t border-gray-200">
                                                <a
                                                    href="https://www.first.org/epss/"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Learn more about EPSS
                                                    <Icon
                                                        icon="tabler:external-link"
                                                        class="w-3 h-3"
                                                    />
                                                </a>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <!-- Additional Severity Sources with Confidence -->
                            <div
                                v-for="vla in report.VLAI"
                                :key="vla.Source"
                                class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border severity-badge-bg"
                                :class="{
                                    'severity-critical-bg': vla.Score == 'critical',
                                    'severity-high-bg': vla.Score == 'high',
                                    'severity-medium-bg': vla.Score == 'medium',
                                    'severity-low-bg': vla.Score == 'low',
                                    'severity-none-bg': vla.Score == 'none'
                                }"
                            >
                                <!-- Source icon/name -->
                                <span
                                    class="font-semibold"
                                    :class="{
                                        'text-severityCritical': vla.Score == 'critical',
                                        'text-severityHigh': vla.Score == 'high',
                                        'text-severityMedium': vla.Score == 'medium',
                                        'text-severityLow': vla.Score == 'low',
                                        'text-severityNone': vla.Score == 'none'
                                    }"
                                >
                                    {{ vla.Source }}
                                </span>

                                <!-- Confidence indicator -->
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <div
                                                class="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold cursor-help"
                                                :class="{
                                                    'bg-green-100 text-green-800':
                                                        vla.Confidence >= 0.9,
                                                    'bg-yellow-100 text-yellow-800':
                                                        vla.Confidence >= 0.5 &&
                                                        vla.Confidence < 0.9,
                                                    'bg-red-100 text-red-800': vla.Confidence < 0.5
                                                }"
                                            >
                                                <Icon
                                                    :icon="
                                                        vla.Confidence >= 0.9
                                                            ? 'tabler:check-circle'
                                                            : vla.Confidence >= 0.5
                                                              ? 'tabler:alert-circle'
                                                              : 'tabler:x-circle'
                                                    "
                                                    class="w-3 h-3"
                                                />
                                                <span v-if="vla.Confidence >= 0.9">HIGH</span>
                                                <span v-else-if="vla.Confidence >= 0.5">MED</span>
                                                <span v-else>LOW</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            class="bg-white border border-gray-300 shadow-lg"
                                        >
                                            <div class="max-w-sm space-y-3 p-3">
                                                <div class="flex items-center gap-2">
                                                    <Icon
                                                        :icon="
                                                            vla.Confidence >= 0.9
                                                                ? 'tabler:check-circle'
                                                                : vla.Confidence >= 0.5
                                                                  ? 'tabler:alert-circle'
                                                                  : 'tabler:x-circle'
                                                        "
                                                        class="w-4 h-4"
                                                        :class="{
                                                            'text-green-600': vla.Confidence >= 0.9,
                                                            'text-amber-600':
                                                                vla.Confidence >= 0.5 &&
                                                                vla.Confidence < 0.9,
                                                            'text-red-600': vla.Confidence < 0.5
                                                        }"
                                                    />
                                                    <span
                                                        class="font-semibold text-base text-gray-900"
                                                    >
                                                        {{ vla.Source }} Assessment Confidence
                                                    </span>
                                                </div>

                                                <div
                                                    class="text-sm space-y-2 bg-gray-50 p-3 rounded-lg"
                                                >
                                                    <div class="flex justify-between items-center">
                                                        <span class="text-gray-700 font-medium"
                                                            >Confidence Score:</span
                                                        >
                                                        <span class="font-bold text-gray-900"
                                                            >{{
                                                                Math.round(vla.Confidence * 100)
                                                            }}%</span
                                                        >
                                                    </div>
                                                    <div class="flex justify-between items-center">
                                                        <span class="text-gray-700 font-medium"
                                                            >Severity Rating:</span
                                                        >
                                                        <span
                                                            class="font-bold text-gray-900 capitalize"
                                                            >{{ vla.Score }}</span
                                                        >
                                                    </div>
                                                </div>

                                                <div class="pt-2 border-t border-gray-200">
                                                    <p
                                                        v-if="vla.Confidence >= 0.9"
                                                        class="text-sm text-gray-800 font-medium flex items-center gap-1"
                                                    >
                                                        <span class="text-green-600">✓</span> Highly
                                                        reliable assessment with strong confidence
                                                    </p>
                                                    <p
                                                        v-else-if="vla.Confidence >= 0.5"
                                                        class="text-sm text-gray-800 font-medium flex items-center gap-1"
                                                    >
                                                        <span class="text-amber-600">⚠</span>
                                                        Moderate reliability - cross-reference
                                                        recommended
                                                    </p>
                                                    <p
                                                        v-else
                                                        class="text-sm text-gray-800 font-medium flex items-center gap-1"
                                                    >
                                                        <span class="text-red-600">⚠</span> Low
                                                        confidence - verify with additional sources
                                                    </p>
                                                </div>

                                                <div class="pt-2 border-t border-gray-200">
                                                    <a
                                                        href="https://www.vulnerability-lookup.org/user-manual/ai/"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        Learn more about VLAI assessments
                                                        <Icon
                                                            icon="tabler:external-link"
                                                            class="w-3 h-3"
                                                        />
                                                    </a>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <!-- CWE Badges -->
                            <TooltipProvider
                                v-for="weakness in report.Weaknesses || []"
                                :key="weakness.WeaknessId"
                            >
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <Badge :cwe="true" class="text-xs px-2 py-1 cursor-help">
                                            {{ weakness.WeaknessId }}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        class="bg-white border border-gray-300 shadow-lg"
                                    >
                                        <div class="max-w-sm space-y-2 p-3">
                                            <div class="flex items-center gap-2">
                                                <Icon
                                                    icon="tabler:bug"
                                                    class="w-4 h-4 text-red-600"
                                                />
                                                <span class="font-semibold text-base text-gray-900">
                                                    {{ weakness.WeaknessId }}
                                                </span>
                                            </div>

                                            <div class="text-sm space-y-1">
                                                <div class="font-medium text-gray-900">
                                                    {{ weakness.WeaknessName }}
                                                </div>
                                                <div class="text-gray-600">
                                                    Common weakness pattern that can lead to
                                                    security vulnerabilities
                                                </div>
                                            </div>

                                            <div class="pt-2 border-t border-gray-200">
                                                <a
                                                    :href="`https://cwe.mitre.org/data/definitions/${weakness.WeaknessId.replace('CWE-', '')}.html`"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    View CWE details
                                                    <Icon
                                                        icon="tabler:external-link"
                                                        class="w-3 h-3"
                                                    />
                                                </a>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <!-- Full Description -->
                        <div class="mb-3">
                            <InfoMarkdown :markdown="report.Description.trim()" />
                        </div>

                        <!-- Impact Information -->
                        <div class="flex gap-1.5 mb-3">
                            <TooltipProvider>
                                <Tooltip
                                    v-if="
                                        report.Severity?.ConfidentialityImpact !== 'NONE' &&
                                        report.Severity?.ConfidentialityImpact !== ''
                                    "
                                >
                                    <TooltipTrigger as-child>
                                        <BubbleComponent
                                            class="text-xs impact-bubble cursor-help"
                                            :class="{
                                                'impact-high':
                                                    report.Severity?.ConfidentialityImpact ===
                                                        'HIGH' ||
                                                    report.Severity?.ConfidentialityImpact ===
                                                        'COMPLETE',
                                                'impact-medium':
                                                    report.Severity?.ConfidentialityImpact ===
                                                        'LOW' ||
                                                    report.Severity?.ConfidentialityImpact ===
                                                        'PARTIAL'
                                            }"
                                        >
                                            <template #content>
                                                <Icon icon="tabler:shield-lock" class="w-3 h-3" />
                                                <span>Confidentiality</span>
                                                <span class="ml-1 text-xs font-bold text-white">
                                                    {{ report.Severity?.ConfidentialityImpact }}
                                                </span>
                                            </template>
                                        </BubbleComponent>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        class="bg-white text-gray-800 shadow-lg border max-w-sm"
                                    >
                                        <div class="space-y-3 p-1">
                                            <div class="flex items-center gap-2">
                                                <Icon
                                                    icon="tabler:shield-lock"
                                                    class="w-4 h-4 text-blue-600"
                                                />
                                                <div class="flex items-center gap-2">
                                                    <span class="font-semibold text-base"
                                                        >Confidentiality Impact</span
                                                    >
                                                    <span
                                                        class="px-2 py-1 rounded text-xs font-bold text-white"
                                                        :class="{
                                                            'bg-red-600':
                                                                report.Severity
                                                                    ?.ConfidentialityImpact ===
                                                                    'HIGH' ||
                                                                report.Severity
                                                                    ?.ConfidentialityImpact ===
                                                                    'COMPLETE',
                                                            'bg-orange-600':
                                                                report.Severity
                                                                    ?.ConfidentialityImpact ===
                                                                    'LOW' ||
                                                                report.Severity
                                                                    ?.ConfidentialityImpact ===
                                                                    'PARTIAL'
                                                        }"
                                                    >
                                                        {{ report.Severity?.ConfidentialityImpact }}
                                                    </span>
                                                </div>
                                            </div>

                                            <div class="text-sm bg-gray-50 p-3 rounded-lg">
                                                <div class="font-medium text-gray-900 mb-2">
                                                    {{
                                                        report.Severity?.ConfidentialityImpact ===
                                                            'HIGH' ||
                                                        report.Severity?.ConfidentialityImpact ===
                                                            'COMPLETE'
                                                            ? 'High Impact'
                                                            : 'Limited Impact'
                                                    }}
                                                </div>
                                                <div class="text-gray-600">
                                                    <span
                                                        v-if="
                                                            report.Severity
                                                                ?.ConfidentialityImpact ===
                                                                'HIGH' ||
                                                            report.Severity
                                                                ?.ConfidentialityImpact ===
                                                                'COMPLETE'
                                                        "
                                                    >
                                                        Complete loss of confidentiality - attackers
                                                        can access all sensitive data, user
                                                        credentials, encryption keys, or system
                                                        secrets. This represents a total compromise
                                                        of data privacy.
                                                    </span>
                                                    <span v-else>
                                                        Partial confidentiality loss - attackers can
                                                        access some restricted information, but
                                                        cannot control what is obtained. The scope
                                                        of information disclosure is limited.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip
                                    v-if="
                                        report.Severity?.AvailabilityImpact !== 'NONE' &&
                                        report.Severity?.AvailabilityImpact !== ''
                                    "
                                >
                                    <TooltipTrigger as-child>
                                        <BubbleComponent
                                            class="text-xs impact-bubble cursor-help"
                                            :class="{
                                                'impact-high':
                                                    report.Severity?.AvailabilityImpact ===
                                                        'HIGH' ||
                                                    report.Severity?.AvailabilityImpact ===
                                                        'COMPLETE',
                                                'impact-medium':
                                                    report.Severity?.AvailabilityImpact === 'LOW' ||
                                                    report.Severity?.AvailabilityImpact ===
                                                        'PARTIAL'
                                            }"
                                        >
                                            <template #content>
                                                <Icon icon="tabler:server" class="w-3 h-3" />
                                                <span>Availability</span>
                                                <span class="ml-1 text-xs font-bold text-white">
                                                    {{ report.Severity?.AvailabilityImpact }}
                                                </span>
                                            </template>
                                        </BubbleComponent>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        class="bg-white text-gray-800 shadow-lg border max-w-sm"
                                    >
                                        <div class="space-y-3 p-1">
                                            <div class="flex items-center gap-2">
                                                <Icon
                                                    icon="tabler:server"
                                                    class="w-4 h-4 text-purple-600"
                                                />
                                                <div class="flex items-center gap-2">
                                                    <span class="font-semibold text-base"
                                                        >Availability Impact</span
                                                    >
                                                    <span
                                                        class="px-2 py-1 rounded text-xs font-bold text-white"
                                                        :class="{
                                                            'bg-red-600':
                                                                report.Severity
                                                                    ?.AvailabilityImpact ===
                                                                    'HIGH' ||
                                                                report.Severity
                                                                    ?.AvailabilityImpact ===
                                                                    'COMPLETE',
                                                            'bg-orange-600':
                                                                report.Severity
                                                                    ?.AvailabilityImpact ===
                                                                    'LOW' ||
                                                                report.Severity
                                                                    ?.AvailabilityImpact ===
                                                                    'PARTIAL'
                                                        }"
                                                    >
                                                        {{ report.Severity?.AvailabilityImpact }}
                                                    </span>
                                                </div>
                                            </div>

                                            <div class="text-sm bg-gray-50 p-3 rounded-lg">
                                                <div class="font-medium text-gray-900 mb-2">
                                                    {{
                                                        report.Severity?.AvailabilityImpact ===
                                                            'HIGH' ||
                                                        report.Severity?.AvailabilityImpact ===
                                                            'COMPLETE'
                                                            ? 'Complete Service Disruption'
                                                            : 'Performance Degradation'
                                                    }}
                                                </div>
                                                <div class="text-gray-600">
                                                    <span
                                                        v-if="
                                                            report.Severity?.AvailabilityImpact ===
                                                                'HIGH' ||
                                                            report.Severity?.AvailabilityImpact ===
                                                                'COMPLETE'
                                                        "
                                                    >
                                                        Total shutdown or denial of service -
                                                        attackers can completely prevent legitimate
                                                        users from accessing the system or service,
                                                        causing sustained outages and business
                                                        disruption.
                                                    </span>
                                                    <span v-else>
                                                        Reduced performance or intermittent
                                                        interruptions - some resources may be
                                                        partially available, but overall system
                                                        functionality is degraded without complete
                                                        failure.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip
                                    v-if="
                                        report.Severity?.IntegrityImpact !== 'NONE' &&
                                        report.Severity?.IntegrityImpact !== ''
                                    "
                                >
                                    <TooltipTrigger as-child>
                                        <BubbleComponent
                                            class="text-xs impact-bubble cursor-help"
                                            :class="{
                                                'impact-high':
                                                    report.Severity?.IntegrityImpact === 'HIGH' ||
                                                    report.Severity?.IntegrityImpact === 'COMPLETE',
                                                'impact-medium':
                                                    report.Severity?.IntegrityImpact === 'LOW' ||
                                                    report.Severity?.IntegrityImpact === 'PARTIAL'
                                            }"
                                        >
                                            <template #content>
                                                <Icon icon="tabler:shield-check" class="w-3 h-3" />
                                                <span>Integrity</span>
                                                <span class="ml-1 text-xs font-bold text-white">
                                                    {{ report.Severity?.IntegrityImpact }}
                                                </span>
                                            </template>
                                        </BubbleComponent>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        class="bg-white text-gray-800 shadow-lg border max-w-sm"
                                    >
                                        <div class="space-y-3 p-1">
                                            <div class="flex items-center gap-2">
                                                <Icon
                                                    icon="tabler:shield-check"
                                                    class="w-4 h-4 text-green-600"
                                                />
                                                <div class="flex items-center gap-2">
                                                    <span class="font-semibold text-base"
                                                        >Integrity Impact</span
                                                    >
                                                    <span
                                                        class="px-2 py-1 rounded text-xs font-bold text-white"
                                                        :class="{
                                                            'bg-red-600':
                                                                report.Severity?.IntegrityImpact ===
                                                                    'HIGH' ||
                                                                report.Severity?.IntegrityImpact ===
                                                                    'COMPLETE',
                                                            'bg-orange-600':
                                                                report.Severity?.IntegrityImpact ===
                                                                    'LOW' ||
                                                                report.Severity?.IntegrityImpact ===
                                                                    'PARTIAL'
                                                        }"
                                                    >
                                                        {{ report.Severity?.IntegrityImpact }}
                                                    </span>
                                                </div>
                                            </div>

                                            <div class="text-sm bg-gray-50 p-3 rounded-lg">
                                                <div class="font-medium text-gray-900 mb-2">
                                                    {{
                                                        report.Severity?.IntegrityImpact ===
                                                            'HIGH' ||
                                                        report.Severity?.IntegrityImpact ===
                                                            'COMPLETE'
                                                            ? 'Complete Data Compromise'
                                                            : 'Limited Data Modification'
                                                    }}
                                                </div>
                                                <div class="text-gray-600">
                                                    <span
                                                        v-if="
                                                            report.Severity?.IntegrityImpact ===
                                                                'HIGH' ||
                                                            report.Severity?.IntegrityImpact ===
                                                                'COMPLETE'
                                                        "
                                                    >
                                                        Total loss of data integrity - attackers can
                                                        modify, delete, or corrupt any system files,
                                                        application data, or critical
                                                        configurations, potentially rendering
                                                        systems unreliable.
                                                    </span>
                                                    <span v-else>
                                                        Limited data modification capability -
                                                        attackers can alter some information but
                                                        cannot control the scope or consequence of
                                                        modifications. Impact is constrained but
                                                        still concerning.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <!-- OWASP Top 10 Information -->
                        <div
                            v-if="report.Weaknesses?.some((w: any) => w.OWASPTop10Id !== '')"
                            class="mb-3"
                        >
                            <div class="flex flex-wrap gap-2">
                                <div
                                    v-for="owaspID in getUniqueOWASP(report.Weaknesses || [])"
                                    :key="owaspID"
                                >
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div
                                                    :class="[
                                                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all hover:shadow-sm cursor-help',
                                                        getOwaspInfo(owaspID).color
                                                    ]"
                                                >
                                                    <Icon
                                                        icon="simple-icons:owasp"
                                                        class="w-3 h-3"
                                                    />
                                                    <span
                                                        >{{ getOwaspInfo(owaspID).id }}:
                                                        {{ getOwaspInfo(owaspID).name }}</span
                                                    >
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                class="bg-white border border-gray-300 shadow-lg max-w-sm"
                                            >
                                                <div class="space-y-3 p-3">
                                                    <div class="flex items-center gap-2">
                                                        <Icon
                                                            icon="simple-icons:owasp"
                                                            class="w-4 h-4 text-orange-600"
                                                        />
                                                        <span
                                                            class="font-semibold text-base text-gray-900"
                                                        >
                                                            OWASP {{ getOwaspInfo(owaspID).id }}
                                                        </span>
                                                    </div>

                                                    <div class="space-y-2">
                                                        <div>
                                                            <h4
                                                                class="font-medium text-sm text-gray-900 mb-1"
                                                            >
                                                                {{ getOwaspInfo(owaspID).name }}
                                                            </h4>
                                                            <p
                                                                class="text-sm text-gray-600 leading-relaxed"
                                                            >
                                                                {{
                                                                    getOwaspInfo(owaspID)
                                                                        .description
                                                                }}
                                                            </p>
                                                        </div>

                                                        <div class="bg-gray-50 p-2 rounded-lg">
                                                            <h5
                                                                class="font-medium text-xs text-gray-700 mb-1"
                                                            >
                                                                Potential Impact:
                                                            </h5>
                                                            <p
                                                                class="text-xs text-gray-600 leading-relaxed"
                                                            >
                                                                {{ getOwaspInfo(owaspID).impact }}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </div>

                        <!-- View Details Link -->
                        <div
                            class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between"
                        >
                            <RouterLink
                                :to="{
                                    name: 'results',
                                    query: {
                                        analysis_id: props.analysisID,
                                        project_id: props.projectID,
                                        finding_id: report.Vulnerability
                                    },
                                    params: { page: 'vulnerabilities_details' }
                                }"
                                class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                                View detailed analysis
                                <Icon icon="tabler:external-link" class="w-4 h-4" />
                            </RouterLink>
                        </div>
                    </div>
                </div>
            </div>

            <!--------------------------------------------------------------------------->
            <!--                     Filter result empty indicator                     -->
            <!--------------------------------------------------------------------------->

            <div v-if="matchingItemsCount == 0 && filterApplied && render" class="mt-5">
                <div style="text-align: center">No findings match the filter</div>
            </div>
            <div v-if="matchingItemsCount == 0 && !filterApplied && render" class="mt-5">
                <div style="text-align: center">No findings</div>
            </div>

            <!-- Pagination -->
            <div class="flex items-center justify-between border-t border-gray-200 py-4">
                <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:file-text" class="w-4 h-4" />
                        <span>Page {{ pageNumber + 1 }} of {{ totalPages }}</span>
                    </div>
                    <div class="text-xs">
                        Showing
                        {{ Math.min(pageNumber * pageLimitSelected + 1, nmbEntriesTotal) }}-{{
                            Math.min((pageNumber + 1) * pageLimitSelected, nmbEntriesTotal)
                        }}
                        of {{ nmbEntriesTotal }}
                    </div>
                </div>

                <PaginationComponent
                    v-model:page="pageNumber"
                    v-model:nmb-entries-showing="pageLimitSelected"
                    v-model:nmb-entries-total="nmbEntriesTotal"
                    v-model:total-pages="totalPages"
                />
            </div>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                            Loading skeleton                           -->
        <!--------------------------------------------------------------------------->

        <div v-else>
            <div class="flex flex-col gap-2">
                <BoxLoader
                    v-for="i in 2"
                    :key="i"
                    :dimensions="{ width: '100%', height: '300px' }"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/common/summary.scss';
@use '@/assets/common/cvss.scss';
@use '@/assets/colors.scss' as colors;

.vulnerability-card-wrapper {
    transition: all 0.2s ease-in-out;

    &:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        border-color: #d1d5db;
        transform: translateY(-1px);
    }
}

.card-header {
    transition: background-color 0.15s ease;

    &:hover {
        background-color: #f9fafb;
    }
}

.severity-badge {
    min-width: 85px;

    > div {
        transition: all 0.15s ease;

        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
    }
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
}

// Enhanced spacing for badges and bubbles
.card-body .flex.flex-wrap {
    gap: 0.25rem;
}

// Color-coded left borders
.border-l-red-600 {
    border-left-color: colors.$severity-critical !important;
}

.border-l-orange-500 {
    border-left-color: colors.$severity-high !important;
}

.border-l-yellow-500 {
    border-left-color: colors.$severity-medium !important;
}

.border-l-blue-500 {
    border-left-color: colors.$severity-low !important;
}

.border-l-gray-400 {
    border-left-color: colors.$severity-none !important;
}

// Enhanced CVE styling
h3 {
    letter-spacing: -0.025em;
    transition: color 0.15s ease;

    &:hover {
        color: #1f2937;
    }
}

// Improved badge spacing
.vulnerability-card .flex.flex-wrap {
    .badge + .badge {
        margin-left: 0;
    }
}

// Severity background colors to match text colors
.severity-critical-bg {
    background-color: rgba(colors.$severity-critical, 0.1);
    border-color: rgba(colors.$severity-critical, 0.3);
}

.severity-high-bg {
    background-color: rgba(colors.$severity-high, 0.1);
    border-color: rgba(colors.$severity-high, 0.3);
}

.severity-medium-bg {
    background-color: rgba(colors.$severity-medium, 0.1);
    border-color: rgba(colors.$severity-medium, 0.3);
}

.severity-low-bg {
    background-color: rgba(colors.$severity-low, 0.1);
    border-color: rgba(colors.$severity-low, 0.3);
}

.severity-none-bg {
    background-color: rgba(colors.$severity-none, 0.1);
    border-color: rgba(colors.$severity-none, 0.3);
}

// Impact bubble styling
.impact-bubble {
    transition: all 0.2s ease;
    border: 2px solid transparent;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
}

.impact-high {
    background-color: #dc2626 !important; // Strong red for HIGH/COMPLETE impact
    border-color: #991b1b !important;
    color: white !important;

    &:hover {
        background-color: #b91c1c !important;
        border-color: #7f1d1d !important;
    }
}

.impact-medium {
    background-color: #ea580c !important; // Distinct orange for LOW/PARTIAL impact
    border-color: #c2410c !important;
    color: white !important;

    &:hover {
        background-color: #dc2626 !important;
        border-color: #991b1b !important;
    }
}
</style>
