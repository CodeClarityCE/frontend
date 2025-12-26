<script lang="ts" setup>
import BubbleComponent from '@/base_components/data-display/bubbles/BubbleComponent.vue';
import SeverityBubble from '@/base_components/data-display/bubbles/SeverityBubble.vue';
import SortableTable, {
    type TableHeader
} from '@/base_components/data-display/tables/SortableTable.vue';
import ActiveFilterBar from '@/base_components/filters/ActiveFilterBar.vue';
import {
    createNewFilterState,
    FilterType,
    type FilterConfig,
    type FilterState
} from '@/base_components/filters/filterTypes';
import SearchBar from '@/base_components/filters/SearchBar.vue';
import UtilitiesFilters from '@/base_components/filters/UtilitiesFilters.vue';
import PaginationComponent from '@/base_components/utilities/PaginationComponent.vue';
import UtilitiesSort from '@/base_components/utilities/UtilitiesSort.vue';
import { ProjectsSortInterface } from '@/codeclarity_components/projects/project.repository';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import {
    PatchType,
    type VulnerabilityMerged
} from '@/codeclarity_components/results/vulnerabilities/VulnStats';
import CreateTicketButton from '@/codeclarity_components/tickets/components/CreateTicketButton.vue';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';
import { Badge } from '@/shadcn/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn/ui/tooltip';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { Icon } from '@iconify/vue';
import { ref, watch, computed, type Ref } from 'vue';
import AddToPolicyButton from './components/AddToPolicyButton.vue';

export interface Props {
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

const headers: TableHeader[] = [
    { label: 'CVE', key: 'cve' },
    { label: 'Severity', key: 'severity' },
    { label: 'Dependency', key: 'dep_name' },
    { label: 'Weakness', key: 'weakness' },
    { label: 'Owasp Top 10', key: 'owasp_top_10' },
    { label: 'Exploitability', key: 'exploitability' },
    { label: 'Impact', key: null },
    { label: 'Details', key: null }
];

const sortByOptions = [
    { label: 'CVE', key: 'cve' },
    { label: 'Severity', key: 'severity' },
    { label: 'Dependency Name', key: 'dep_name' },
    { label: 'Dependency Version', key: 'dep_version' },
    { label: 'Weakness', key: 'weakness' },
    { label: 'Owasp Top 10', key: 'owasp_top_10' },
    { label: 'Exploitability', key: 'exploitability' }
];

const error = ref(false);
const render = ref(true);
const pageLimitSelected = ref(15);
const selectionPageLimit = [5, 10, 15, 20, 30, 40, 50, 75, 100];
const nmbEntriesShowing = ref(pageLimitSelected.value);
const matchingItemsCount = ref(0);
const nmbEntriesTotal = ref(0);
const pageNumber = ref(0);
const totalPages = ref(10);
const filterApplied = ref(false);
const searchKey = ref('');
const placeholder = 'Search by dependency, dependency version, or cve';

const findings: Ref<VulnerabilityMerged[]> = ref([]);
const sortKey = ref(ProjectsSortInterface.SEVERITY);
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);

// Filters
const filterConfigDef: FilterConfig = {
    ImportState: {
        name: 'Language',

        type: FilterType.RADIO,
        icon: 'meteor-icons:language',
        data: {
            js: {
                title: 'JavaScript',
                value: true
            }
        }
    },
    Divider: {
        name: 'Language',

        type: FilterType.DIVIDER,
        data: {}
    },
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
};

const filterState = ref<FilterState>(createNewFilterState(filterConfigDef));

const selected_workspace = defineModel<string>('selected_workspace', { default: '.' });

function isNoneSeverity(n: number): boolean {
    return n === 0.0 || n === undefined;
}
function isLowSeverity(n: number): boolean {
    return n < 4.0 && n > 0.0;
}
function isMediumSeverity(n: number): boolean {
    return n >= 4.0 && n < 7.0;
}
function isHighSeverity(n: number): boolean {
    return n >= 7.0 && n < 9.0;
}
function isCriticalSeverity(n: number): boolean {
    return n >= 9.0;
}

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

interface OwaspInfoResult {
    id: string;
    name: string;
    description: string;
    impact: string;
    color: string;
}

function getOwaspInfo(owaspId: string): OwaspInfoResult {
    return (
        owaspMapping[owaspId] ?? {
            id: 'Unknown',
            name: 'Uncategorized',
            description: 'This vulnerability does not map to a specific OWASP Top 10 category.',
            impact: 'Impact varies depending on the specific vulnerability.',
            color: 'bg-gray-50 border-gray-200 text-gray-800'
        }
    );
}

function getUniqueOWASP(weaknessInfo: { OWASPTop10Id: string }[]): string[] {
    const owaspIds = weaknessInfo
        .map((weakness) => weakness.OWASPTop10Id)
        .filter((id) => id && id !== '');
    const uniqueOwaspIds = Array.from(new Set(owaspIds));
    return uniqueOwaspIds;
}

// DEFINE THE OPTIONS IN FILTER
type Options = Record<string, unknown>;
const options = ref<Options>({
    OwaspTop10: {
        iconScale: '2',
        icon: 'si-owasp',
        name: 'Owasp Top 10 (2021)',
        type: 'checkbox',
        data: {
            owasp_top_10_2021_a1: {
                title: 'A01: Broken Access Control',
                value: false
            },
            owasp_top_10_2021_a2: {
                title: 'A02: Cryptographic Failures',
                value: false
            },
            owasp_top_10_2021_a3: {
                title: 'A03: Injection',
                value: false
            },
            owasp_top_10_2021_a4: {
                title: 'A04: Insecure Design',
                value: false
            },
            owasp_top_10_2021_a5: {
                title: 'A05: Security Misconfiguration',
                value: false
            },
            owasp_top_10_2021_a6: {
                title: 'A06: Vulnerable and Outdated Components',
                value: false
            },
            owasp_top_10_2021_a7: {
                title: 'A07: Identification and Authentication Failures',
                value: false
            },
            owasp_top_10_2021_a8: {
                title: 'A08: Software and Data Integrity Failures',
                value: false
            },
            owasp_top_10_2021_a9: {
                title: 'A09: Security Logging and Monitoring Failures',
                value: false
            },
            owasp_top_10_2021_a10: {
                title: 'A10: Server-Side Request Forgery',
                value: false
            },
            owasp_uncategorized: {
                title: 'Uncategorized',
                value: false
            }
        }
    },
    Impact: {
        name: 'Security Impact',
        type: 'checkbox',
        data: {
            availability_impact: {
                title: 'Availability',
                value: false
            },
            confidentiality_impact: {
                title: 'Confidentiality',
                value: false
            },
            integrity_impact: {
                title: 'Integrity',
                value: false
            }
        }
    },
    Divider: {
        type: 'divider'
    },
    Severity: {
        name: 'Severity',
        type: 'checkbox',
        data: {
            severity_critical: {
                title: 'Critical',
                value: false
            },
            severity_high: {
                title: 'High',
                value: false
            },
            severity_medium: {
                title: 'Moderate',
                value: false
            },
            severity_low: {
                title: 'Low',
                value: false
            },
            severity_none: {
                title: 'None',
                value: false
            }
        }
    },
    Patchable: {
        name: 'Patchable',
        type: 'radio',
        data: {
            patchable: {
                title: 'Patchable',
                value: false
            },
            partially_patchable: {
                title: 'Partially Patchable',
                value: false
            },
            not_patchable: {
                title: 'Unpatchable',
                value: false
            },
            patch_any: {
                title: 'Any',
                value: true
            }
        }
    }
});

for (const category in options.value) {
    const categoryData = options.value[category] as { data: Record<string, { value: boolean }> };
    for (const option in categoryData.data) {
        const optionData = categoryData.data[option];
        if (optionData) {
            optionData.value = false;
        }
    }
}

function updateSort(_sortKey: ProjectsSortInterface, _sortDirection: SortDirection): void {
    sortKey.value = _sortKey;
    sortDirection.value = _sortDirection;
    void init();
}

const resultsRepository: ResultsRepository = new ResultsRepository();

async function init(): Promise<void> {
    if (!userStore.getDefaultOrg) {
        throw new Error('No default org selected');
    }
    if (!authStore.getToken) {
        throw new Error('No default org selected');
    }
    if (props.projectID === '' || props.analysisID === '') {
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
            ecosystem_filter: props.ecosystemFilter ?? undefined,
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
        console.error('error', error);
        render.value = false;
    }
}

void init();

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
        void init();
    }
);
watch(() => filterState.value.activeFilters, init);

// Sync blacklisted filter with parent component
const showBlacklistedFromFilter = computed<boolean>(() => {
    return filterState.value.filterConfig?.BlacklistState?.data?.show_blacklisted?.value ?? false;
});

// Define emit for updating parent's showBlacklisted value
const emit = defineEmits<{
    'update:showBlacklisted': [value: boolean];
}>();

// Watch for changes in the filter and emit to parent
watch(showBlacklistedFromFilter, (newValue: boolean) => {
    void emit('update:showBlacklisted', newValue);
});
</script>

<template>
    <div class="container py-6 mx-auto space-y-6">
        <!-- Header Section -->
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Vulnerabilities</h2>
                    <p class="text-sm text-gray-600 mt-1">
                        Security vulnerabilities found in your project dependencies
                    </p>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <Icon icon="tabler:shield-exclamation" class="w-4 h-4" />
                    <span>{{ nmbEntriesTotal }} total vulnerabilities</span>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="bg-white border rounded-lg p-3">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:alert-triangle" class="w-4 h-4 text-red-500" />
                        <span class="text-xs text-gray-600 uppercase tracking-wide">Critical</span>
                    </div>
                    <div class="text-lg font-semibold text-gray-900">
                        {{ criticalCount }}
                    </div>
                </div>

                <div class="bg-white border rounded-lg p-3">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:exclamation-circle" class="w-4 h-4 text-orange-500" />
                        <span class="text-xs text-gray-600 uppercase tracking-wide">High</span>
                    </div>
                    <div class="text-lg font-semibold text-gray-900">
                        {{ highCount }}
                    </div>
                </div>

                <div class="bg-white border rounded-lg p-3">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:trending-up" class="w-4 h-4 text-purple-500" />
                        <span class="text-xs text-gray-600 uppercase tracking-wide"
                            >Exploitable</span
                        >
                    </div>
                    <div class="text-lg font-semibold text-gray-900">
                        {{ exploitableCount }}
                    </div>
                </div>

                <div class="bg-white border rounded-lg p-3">
                    <div class="flex items-center gap-2">
                        <Icon icon="tabler:bandage" class="w-4 h-4 text-green-500" />
                        <span class="text-xs text-gray-600 uppercase tracking-wide">Patchable</span>
                    </div>
                    <div class="text-lg font-semibold text-gray-900">
                        {{ patchableCount }}
                    </div>
                </div>
            </div>

            <!-- Security Indicators Legend -->
            <div
                class="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200"
            >
                <h3 class="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Icon icon="tabler:info-circle" class="w-4 h-4" />
                    Vulnerability Indicators & Severity Levels
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div class="space-y-2">
                        <div class="font-medium text-gray-900">Severity Levels</div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-severity-critical rounded"></div>
                                <span class="text-gray-600">Critical (9.0-10.0)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-severity-high rounded"></div>
                                <span class="text-gray-600">High (7.0-8.9)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-severity-medium rounded"></div>
                                <span class="text-gray-600">Medium (4.0-6.9)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-severity-low rounded"></div>
                                <span class="text-gray-600">Low (0.1-3.9)</span>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="font-medium text-gray-900">Exploitation Risk</div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:trending-up" class="w-3 h-3 text-red-600" />
                                <span class="text-gray-600">EPSS > 10% (High risk)</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:alert-triangle" class="w-3 h-3 text-amber-600" />
                                <span class="text-gray-600">Possible false match</span>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="font-medium text-gray-900">Patching Status</div>
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:bandage" class="w-3 h-3 text-green-600" />
                                <span class="text-gray-600">Patch available</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <Icon icon="tabler:bandage-off" class="w-3 h-3 text-gray-500" />
                                <span class="text-gray-600">No patch available</span>
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
            <ActiveFilterBar v-model:filter-state="filterState"></ActiveFilterBar>
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

        <!-- Data Table -->
        <div class="overflow-x-auto">
            <SortableTable
                :headers="headers"
                :sort-key="sortKey"
                :sort-direction="sortDirection"
                :on-sort-change="updateSort"
            >
                <template #data>
                    <tr
                        v-for="report in findings"
                        :key="report.Id"
                        class="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                    >
                        <!-- CVE Column -->
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <Badge
                                                class="text-nowrap whitespace-nowrap rounded-md font-semibold cursor-help hover:bg-gray-200"
                                                variant="secondary"
                                                >{{ report.Vulnerability }}</Badge
                                            >
                                        </TooltipTrigger>
                                        <TooltipContent
                                            class="bg-white border border-gray-300 shadow-lg max-w-sm"
                                        >
                                            <div class="space-y-2 p-2">
                                                <div class="font-semibold text-gray-900">
                                                    {{ report.Vulnerability }}
                                                </div>
                                                <div class="text-sm text-gray-600 line-clamp-3">
                                                    {{ report.Description }}
                                                </div>
                                                <div class="text-xs text-gray-500">
                                                    Click for detailed analysis
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <!-- Policy status indicator -->
                                <TooltipProvider v-if="report.is_blacklisted">
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <div
                                                class="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md text-xs font-semibold cursor-help"
                                            >
                                                <Icon
                                                    icon="solar:shield-cross-bold"
                                                    class="w-3.5 h-3.5"
                                                />
                                                Policy Excluded
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            class="bg-white border border-gray-300 shadow-lg"
                                        >
                                            <div class="p-2">
                                                <div class="font-medium text-gray-900">
                                                    Excluded by Vulnerability Policy
                                                </div>
                                                <div class="text-sm text-gray-600">
                                                    This vulnerability is marked as a false positive
                                                    and excluded from results by your vulnerability
                                                    policy
                                                </div>
                                                <div
                                                    v-if="
                                                        report.blacklisted_by_policies &&
                                                        report.blacklisted_by_policies.length > 0
                                                    "
                                                    class="text-xs text-gray-500 mt-1"
                                                >
                                                    Policy:
                                                    {{ report.blacklisted_by_policies.join(', ') }}
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <!-- High Exploitation Risk Indicator -->
                                <TooltipProvider v-if="report.EPSS.Score > 0.1">
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <div
                                                class="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-medium cursor-help"
                                            >
                                                <Icon icon="tabler:trending-up" class="w-3 h-3" />
                                                <span
                                                    >{{
                                                        (report.EPSS.Score * 100).toFixed(1)
                                                    }}%</span
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
                                                    <span
                                                        class="font-semibold text-base text-gray-900"
                                                    >
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
                                                        Predicts the probability that this
                                                        vulnerability will be exploited in the wild
                                                        within the next 30 days.
                                                    </div>
                                                    <div class="text-gray-600">
                                                        <strong>Score > 10%:</strong> High
                                                        likelihood of exploitation - prioritize
                                                        patching.
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

                                <!-- Conflict Warning -->
                                <TooltipProvider
                                    v-if="
                                        report.Conflict.ConflictFlag ==
                                            'MATCH_POSSIBLE_INCORRECT' ||
                                        report.Conflict.ConflictFlag === 'MATCH_INCORRECT'
                                    "
                                >
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <Icon
                                                :class="{
                                                    'text-amber-600':
                                                        report.Conflict.ConflictFlag ==
                                                        'MATCH_POSSIBLE_INCORRECT',
                                                    'text-red-600':
                                                        report.Conflict.ConflictFlag ==
                                                        'MATCH_INCORRECT'
                                                }"
                                                icon="tabler:alert-triangle-filled"
                                                class="w-4 h-4 cursor-help"
                                            />
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
                                                    <span
                                                        class="font-semibold text-base text-gray-900"
                                                        >Match Reliability Warning</span
                                                    >
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
                                                        OSV and NVD vulnerability databases provide
                                                        conflicting information about this match.
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
                            </div>
                        </td>

                        <!-- Severity Column with VLAI tooltips -->
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <div class="cursor-help">
                                                <SeverityBubble
                                                    :critical="
                                                        isCriticalSeverity(report.Severity.Severity)
                                                    "
                                                    :high="isHighSeverity(report.Severity.Severity)"
                                                    :medium="
                                                        isMediumSeverity(report.Severity.Severity)
                                                    "
                                                    :low="isLowSeverity(report.Severity.Severity)"
                                                    :none="isNoneSeverity(report.Severity.Severity)"
                                                >
                                                    <template #content>{{
                                                        report.Severity.Severity
                                                    }}</template>
                                                </SeverityBubble>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            class="bg-white border border-gray-300 shadow-lg"
                                        >
                                            <div class="max-w-sm space-y-3 p-3">
                                                <div class="flex items-center gap-2">
                                                    <Icon
                                                        icon="tabler:shield-exclamation"
                                                        class="w-4 h-4 text-red-600"
                                                    />
                                                    <span
                                                        class="font-semibold text-base text-gray-900"
                                                        >CVSS Score:
                                                        {{ report.Severity.Severity }}</span
                                                    >
                                                </div>
                                                <div
                                                    class="text-sm space-y-2 bg-gray-50 p-3 rounded-lg"
                                                >
                                                    <div class="font-medium text-gray-900">
                                                        Common Vulnerability Scoring System
                                                    </div>
                                                    <div class="text-gray-600">
                                                        Industry standard for assessing
                                                        vulnerability severity (0.0-10.0 scale)
                                                    </div>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <!-- VLAI Sources -->
                                <div class="flex gap-1">
                                    <div
                                        v-for="vla in report.VLAI"
                                        :key="vla.Source"
                                        class="flex items-center gap-1"
                                    >
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger as-child>
                                                    <div
                                                        class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border severity-badge-bg cursor-help"
                                                        :class="{
                                                            'severity-critical-bg':
                                                                vla.Score === 'critical',
                                                            'severity-high-bg':
                                                                vla.Score === 'high',
                                                            'severity-medium-bg':
                                                                vla.Score === 'medium',
                                                            'severity-low-bg': vla.Score === 'low',
                                                            'severity-none-bg':
                                                                vla.Score === 'none' || !vla.Score
                                                        }"
                                                    >
                                                        <!-- Source icon/name -->
                                                        <span
                                                            class="font-semibold"
                                                            :class="{
                                                                'text-severity-critical':
                                                                    vla.Score === 'critical',
                                                                'text-severity-high':
                                                                    vla.Score === 'high',
                                                                'text-severity-medium':
                                                                    vla.Score === 'medium',
                                                                'text-severity-low':
                                                                    vla.Score === 'low',
                                                                'text-severity-none':
                                                                    vla.Score === 'none' ||
                                                                    !vla.Score
                                                            }"
                                                        >
                                                            {{ vla.Source }}
                                                        </span>

                                                        <!-- Severity level indicator -->
                                                        <span
                                                            v-if="vla.Score"
                                                            class="ml-1 font-bold text-xs uppercase"
                                                            :class="{
                                                                'text-severity-critical':
                                                                    vla.Score === 'critical',
                                                                'text-severity-high':
                                                                    vla.Score === 'high',
                                                                'text-severity-medium':
                                                                    vla.Score === 'medium',
                                                                'text-severity-low':
                                                                    vla.Score === 'low',
                                                                'text-severity-none':
                                                                    vla.Score === 'none'
                                                            }"
                                                        >
                                                            {{ vla.Score.charAt(0) }}
                                                        </span>
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
                                                                    'text-green-600':
                                                                        vla.Confidence >= 0.9,
                                                                    'text-amber-600':
                                                                        vla.Confidence >= 0.5 &&
                                                                        vla.Confidence < 0.9,
                                                                    'text-red-600':
                                                                        vla.Confidence < 0.5
                                                                }"
                                                            />
                                                            <span
                                                                class="font-semibold text-base text-gray-900"
                                                                >{{ vla.Source }} Assessment
                                                                Confidence</span
                                                            >
                                                        </div>
                                                        <div
                                                            class="text-sm space-y-2 bg-gray-50 p-3 rounded-lg"
                                                        >
                                                            <div
                                                                class="flex justify-between items-center"
                                                            >
                                                                <span
                                                                    class="text-gray-700 font-medium"
                                                                    >Confidence Score:</span
                                                                >
                                                                <span
                                                                    class="font-bold text-gray-900"
                                                                    >{{
                                                                        Math.round(
                                                                            vla.Confidence * 100
                                                                        )
                                                                    }}%</span
                                                                >
                                                            </div>
                                                            <div
                                                                class="flex justify-between items-center"
                                                            >
                                                                <span
                                                                    class="text-gray-700 font-medium"
                                                                    >Severity Rating:</span
                                                                >
                                                                <span
                                                                    class="font-bold capitalize px-2 py-1 rounded text-xs severity-badge-bg"
                                                                    :class="{
                                                                        'severity-critical-bg text-severity-critical':
                                                                            vla.Score ===
                                                                            'critical',
                                                                        'severity-high-bg text-severity-high':
                                                                            vla.Score === 'high',
                                                                        'severity-medium-bg text-severity-medium':
                                                                            vla.Score === 'medium',
                                                                        'severity-low-bg text-severity-low':
                                                                            vla.Score === 'low',
                                                                        'severity-none-bg text-severity-none':
                                                                            vla.Score === 'none' ||
                                                                            !vla.Score
                                                                    }"
                                                                    >{{
                                                                        vla.Score ?? 'Not Available'
                                                                    }}</span
                                                                >
                                                            </div>
                                                        </div>
                                                        <div class="pt-2 border-t border-gray-200">
                                                            <p
                                                                v-if="vla.Confidence >= 0.9"
                                                                class="text-sm text-gray-800 font-medium flex items-center gap-1"
                                                            >
                                                                <span class="text-green-600"
                                                                    >✓</span
                                                                >
                                                                Highly reliable assessment with
                                                                strong confidence
                                                            </p>
                                                            <p
                                                                v-else-if="vla.Confidence >= 0.5"
                                                                class="text-sm text-gray-800 font-medium flex items-center gap-1"
                                                            >
                                                                <span class="text-amber-600"
                                                                    >⚠</span
                                                                >
                                                                Moderate reliability -
                                                                cross-reference recommended
                                                            </p>
                                                            <p
                                                                v-else
                                                                class="text-sm text-gray-800 font-medium flex items-center gap-1"
                                                            >
                                                                <span class="text-red-600">⚠</span>
                                                                Low confidence - verify with
                                                                additional sources
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
                                </div>
                            </div>
                        </td>

                        <!-- Dependency Column -->
                        <td class="px-4 py-3">
                            <div class="flex flex-col gap-1">
                                <div
                                    v-for="affected in report.Affected"
                                    :key="affected.AffectedDependency"
                                    class="flex items-center gap-2"
                                >
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger as-child>
                                                <div class="cursor-help">
                                                    <BubbleComponent
                                                        v-if="affected.PatchType === 'NONE'"
                                                        :not-patchable="true"
                                                        :slim="true"
                                                        class="text-xs"
                                                    >
                                                        <template #content>
                                                            <Icon
                                                                icon="material-symbols:crisis-alert"
                                                                class="w-3 h-3"
                                                            />
                                                            {{ affected.AffectedDependency }}@{{
                                                                affected.AffectedVersion
                                                            }}
                                                        </template>
                                                    </BubbleComponent>
                                                    <BubbleComponent
                                                        v-else-if="affected.PatchType === 'PARTIAL'"
                                                        :partially-patchable="true"
                                                        :slim="true"
                                                        class="text-xs"
                                                    >
                                                        <template #content>
                                                            <Icon
                                                                icon="material-symbols:crisis-alert"
                                                                class="w-3 h-3"
                                                            />
                                                            {{ affected.AffectedDependency }}@{{
                                                                affected.AffectedVersion
                                                            }}
                                                        </template>
                                                    </BubbleComponent>
                                                    <span v-else class="font-medium text-gray-900"
                                                        >{{ affected.AffectedDependency }}@{{
                                                            affected.AffectedVersion
                                                        }}</span
                                                    >
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                class="bg-white border border-gray-300 shadow-lg"
                                            >
                                                <div class="max-w-sm space-y-2 p-3">
                                                    <div class="font-semibold text-gray-900">
                                                        {{ affected.AffectedDependency }}@{{
                                                            affected.AffectedVersion
                                                        }}
                                                    </div>
                                                    <div class="text-sm text-gray-600">
                                                        <div>
                                                            <strong>Patch Status:</strong>
                                                            <span
                                                                :class="{
                                                                    'text-red-600':
                                                                        affected.PatchType ===
                                                                        'NONE',
                                                                    'text-amber-600':
                                                                        affected.PatchType ===
                                                                        'PARTIAL',
                                                                    'text-green-600':
                                                                        affected.PatchType ===
                                                                        'FULL'
                                                                }"
                                                            >
                                                                {{
                                                                    affected.PatchType === 'NONE'
                                                                        ? 'Not Patchable'
                                                                        : affected.PatchType ===
                                                                            'PARTIAL'
                                                                          ? 'Partially Patchable'
                                                                          : 'Fully Patchable'
                                                                }}
                                                            </span>
                                                        </div>
                                                        <div
                                                            v-if="affected.PatchType !== 'FULL'"
                                                            class="mt-2 text-xs"
                                                        >
                                                            {{
                                                                affected.PatchType === 'NONE'
                                                                    ? 'No patches available for this vulnerability'
                                                                    : 'Limited patches available - may require additional mitigations'
                                                            }}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </td>

                        <!-- Weakness Column with CWE tooltips -->
                        <td class="px-4 py-3">
                            <div class="flex flex-wrap gap-1">
                                <div v-if="report.Weaknesses" class="flex flex-wrap gap-1">
                                    <TooltipProvider
                                        v-for="weakness in report.Weaknesses"
                                        :key="weakness.WeaknessId"
                                    >
                                        <Tooltip>
                                            <TooltipTrigger as-child>
                                                <BubbleComponent
                                                    :slim="true"
                                                    class="cursor-help text-xs hover:bg-gray-200"
                                                >
                                                    <template #content>{{
                                                        weakness.WeaknessId
                                                    }}</template>
                                                </BubbleComponent>
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
                                                        <span
                                                            class="font-semibold text-base text-gray-900"
                                                            >{{ weakness.WeaknessId }}</span
                                                        >
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
                            </div>
                        </td>

                        <!-- OWASP Top 10 Column with enhanced tooltips -->
                        <td class="px-4 py-3">
                            <div class="flex flex-wrap gap-1">
                                <div
                                    v-if="
                                        report.Weaknesses &&
                                        report.Weaknesses.some(
                                            (weakness: any) => weakness.OWASPTop10Id !== ''
                                        )
                                    "
                                    class="flex flex-wrap gap-1"
                                >
                                    <div
                                        v-for="owaspID in getUniqueOWASP(report.Weaknesses)"
                                        :key="owaspID"
                                    >
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger as-child>
                                                    <div
                                                        :class="[
                                                            'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all hover:shadow-sm cursor-help',
                                                            getOwaspInfo(owaspID).color
                                                        ]"
                                                    >
                                                        <Icon
                                                            icon="simple-icons:owasp"
                                                            class="w-3 h-3"
                                                        />
                                                        <span>{{ getOwaspInfo(owaspID).id }}</span>
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
                                                                >OWASP
                                                                {{ getOwaspInfo(owaspID).id }}</span
                                                            >
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
                                                                    {{
                                                                        getOwaspInfo(owaspID).impact
                                                                    }}
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
                        </td>

                        <!-- Exploitability Column -->
                        <td class="px-4 py-3 hide-1300">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <div
                                            class="font-mono text-sm cursor-help text-gray-900 font-medium"
                                        >
                                            {{ report.Severity.Exploitability.toFixed(2) ?? 'N/A' }}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        class="bg-white border border-gray-300 shadow-lg"
                                    >
                                        <div class="max-w-sm space-y-2 p-3">
                                            <div class="font-semibold text-gray-900">
                                                Exploitability Score
                                            </div>
                                            <div class="text-sm text-gray-600">
                                                <div>
                                                    CVSS metric measuring how easily this
                                                    vulnerability can be exploited (0.0-10.0)
                                                </div>
                                                <div class="mt-2">
                                                    <strong>Score:</strong>
                                                    {{ report.Severity.Exploitability.toFixed(2) }}
                                                </div>
                                                <div class="text-xs mt-1">
                                                    {{
                                                        report.Severity.Exploitability >= 7.0
                                                            ? 'High exploitability'
                                                            : report.Severity.Exploitability >= 4.0
                                                              ? 'Medium exploitability'
                                                              : 'Low exploitability'
                                                    }}
                                                </div>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </td>

                        <!-- Impact Column with enhanced tooltips -->
                        <td class="px-4 py-3 hide-1450">
                            <div class="flex flex-col gap-1 text-sm">
                                <!-- Confidentiality Impact -->
                                <TooltipProvider
                                    v-if="
                                        report.Severity &&
                                        report.Severity.ConfidentialityImpact !== 'NONE' &&
                                        report.Severity.ConfidentialityImpact !== ''
                                    "
                                >
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <BubbleComponent
                                                title="Impacts Confidentiality"
                                                :slim="true"
                                                class="flex flex-row items-center gap-1 cursor-help text-xs"
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
                                                    <Icon
                                                        icon="tabler:shield-lock"
                                                        class="w-3 h-3"
                                                    />
                                                    <div>Confidentiality</div>
                                                </template>
                                            </BubbleComponent>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            class="bg-white text-gray-800 shadow-lg border max-w-sm"
                                        >
                                            <div class="space-y-3 p-2">
                                                <div class="flex items-center gap-2">
                                                    <Icon
                                                        icon="tabler:shield-lock"
                                                        class="w-4 h-4 text-blue-600"
                                                    />
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
                                                <div class="text-sm bg-gray-50 p-2 rounded-lg">
                                                    <div class="font-medium text-gray-900 mb-1">
                                                        {{
                                                            report.Severity
                                                                ?.ConfidentialityImpact ===
                                                                'HIGH' ||
                                                            report.Severity
                                                                ?.ConfidentialityImpact ===
                                                                'COMPLETE'
                                                                ? 'High Impact'
                                                                : 'Limited Impact'
                                                        }}
                                                    </div>
                                                    <div class="text-gray-600 text-xs">
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
                                                            Complete loss of confidentiality -
                                                            attackers can access all sensitive data.
                                                        </span>
                                                        <span v-else>
                                                            Partial confidentiality loss - limited
                                                            scope of information disclosure.
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <!-- Availability Impact -->
                                <TooltipProvider
                                    v-if="
                                        report.Severity &&
                                        report.Severity.AvailabilityImpact !== 'NONE' &&
                                        report.Severity.AvailabilityImpact !== ''
                                    "
                                >
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <BubbleComponent
                                                title="Impacts Availability"
                                                :slim="true"
                                                class="flex flex-row items-center gap-1 cursor-help text-xs"
                                                :class="{
                                                    'impact-high':
                                                        report.Severity?.AvailabilityImpact ===
                                                            'HIGH' ||
                                                        report.Severity?.AvailabilityImpact ===
                                                            'COMPLETE',
                                                    'impact-medium':
                                                        report.Severity?.AvailabilityImpact ===
                                                            'LOW' ||
                                                        report.Severity?.AvailabilityImpact ===
                                                            'PARTIAL'
                                                }"
                                            >
                                                <template #content>
                                                    <Icon icon="tabler:server" class="w-3 h-3" />
                                                    <div>Availability</div>
                                                </template>
                                            </BubbleComponent>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            class="bg-white text-gray-800 shadow-lg border max-w-sm"
                                        >
                                            <div class="space-y-3 p-2">
                                                <div class="flex items-center gap-2">
                                                    <Icon
                                                        icon="tabler:server"
                                                        class="w-4 h-4 text-purple-600"
                                                    />
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
                                                <div class="text-sm bg-gray-50 p-2 rounded-lg">
                                                    <div class="font-medium text-gray-900 mb-1">
                                                        {{
                                                            report.Severity?.AvailabilityImpact ===
                                                                'HIGH' ||
                                                            report.Severity?.AvailabilityImpact ===
                                                                'COMPLETE'
                                                                ? 'Complete Service Disruption'
                                                                : 'Performance Degradation'
                                                        }}
                                                    </div>
                                                    <div class="text-gray-600 text-xs">
                                                        <span
                                                            v-if="
                                                                report.Severity
                                                                    ?.AvailabilityImpact ===
                                                                    'HIGH' ||
                                                                report.Severity
                                                                    ?.AvailabilityImpact ===
                                                                    'COMPLETE'
                                                            "
                                                        >
                                                            Total shutdown or denial of service
                                                            causing sustained outages.
                                                        </span>
                                                        <span v-else>
                                                            Reduced performance but overall system
                                                            functionality is maintained.
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <!-- Integrity Impact -->
                                <TooltipProvider
                                    v-if="
                                        report.Severity &&
                                        report.Severity.IntegrityImpact !== 'NONE' &&
                                        report.Severity.IntegrityImpact !== ''
                                    "
                                >
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <BubbleComponent
                                                title="Impacts Integrity"
                                                :slim="true"
                                                class="flex flex-row items-center gap-1 cursor-help text-xs"
                                                :class="{
                                                    'impact-high':
                                                        report.Severity?.IntegrityImpact ===
                                                            'HIGH' ||
                                                        report.Severity?.IntegrityImpact ===
                                                            'COMPLETE',
                                                    'impact-medium':
                                                        report.Severity?.IntegrityImpact ===
                                                            'LOW' ||
                                                        report.Severity?.IntegrityImpact ===
                                                            'PARTIAL'
                                                }"
                                            >
                                                <template #content>
                                                    <Icon
                                                        icon="tabler:shield-check"
                                                        class="w-3 h-3"
                                                    />
                                                    <div>Integrity</div>
                                                </template>
                                            </BubbleComponent>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            class="bg-white text-gray-800 shadow-lg border max-w-sm"
                                        >
                                            <div class="space-y-3 p-2">
                                                <div class="flex items-center gap-2">
                                                    <Icon
                                                        icon="tabler:shield-check"
                                                        class="w-4 h-4 text-green-600"
                                                    />
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
                                                <div class="text-sm bg-gray-50 p-2 rounded-lg">
                                                    <div class="font-medium text-gray-900 mb-1">
                                                        {{
                                                            report.Severity?.IntegrityImpact ===
                                                                'HIGH' ||
                                                            report.Severity?.IntegrityImpact ===
                                                                'COMPLETE'
                                                                ? 'Complete Data Compromise'
                                                                : 'Limited Data Modification'
                                                        }}
                                                    </div>
                                                    <div class="text-gray-600 text-xs">
                                                        <span
                                                            v-if="
                                                                report.Severity?.IntegrityImpact ===
                                                                    'HIGH' ||
                                                                report.Severity?.IntegrityImpact ===
                                                                    'COMPLETE'
                                                            "
                                                        >
                                                            Total loss of data integrity - attackers
                                                            can modify or corrupt system data.
                                                        </span>
                                                        <span v-else>
                                                            Limited data modification capability
                                                            with constrained impact.
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </td>

                        <!-- Details Column -->
                        <td class="px-4 py-3">
                            <div class="flex flex-col gap-2">
                                <RouterLink
                                    class="open-details flex flex-row items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                                    :to="{
                                        name: 'results',
                                        query: {
                                            analysis_id: props.analysisID,
                                            project_id: props.projectID,
                                            finding_id: report.Vulnerability
                                        },
                                        params: { page: 'vulnerabilities_details' }
                                    }"
                                >
                                    <Icon icon="ic:outline-open-in-new" class="w-4 h-4" />
                                    <span>details</span>
                                </RouterLink>
                                <div class="flex flex-wrap gap-1">
                                    <CreateTicketButton
                                        :project-id="props.projectID"
                                        :vulnerability="{
                                            vulnerability_id: report.Vulnerability,
                                            severity_score: report.Severity?.Severity,
                                            severity_class:
                                                report.Severity?.Severity >= 9
                                                    ? 'CRITICAL'
                                                    : report.Severity?.Severity >= 7
                                                      ? 'HIGH'
                                                      : report.Severity?.Severity >= 4
                                                        ? 'MEDIUM'
                                                        : 'LOW',
                                            affected_package:
                                                report.Affected?.[0]?.AffectedDependency,
                                            affected_version: report.Affected?.[0]?.AffectedVersion,
                                            description: report.Description
                                        }"
                                        size="sm"
                                        variant="outline"
                                    />
                                    <AddToPolicyButton
                                        v-if="!report.is_blacklisted"
                                        :vulnerability-id="report.Vulnerability"
                                        size="sm"
                                        variant="outline"
                                    />
                                </div>
                            </div>
                        </td>
                    </tr>
                </template>
            </SortableTable>

            <!-- Empty State -->
            <div v-if="matchingItemsCount === 0" class="p-8 text-center">
                <Icon
                    :icon="filterApplied ? 'tabler:filter-off' : 'tabler:shield-check'"
                    class="w-12 h-12 text-gray-400 mx-auto mb-4"
                />
                <h3 class="text-lg font-medium text-gray-900 mb-2">
                    {{
                        filterApplied
                            ? 'No vulnerabilities match the filter'
                            : 'No vulnerabilities found'
                    }}
                </h3>
                <p class="text-gray-600">
                    {{
                        filterApplied
                            ? 'Try adjusting your filters to see more results.'
                            : 'Great news! No security vulnerabilities were detected in your dependencies.'
                    }}
                </p>
            </div>
        </div>

        <!-- Enhanced Pagination -->
        <div
            class="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-gray-50 rounded-lg border"
        >
            <div class="flex items-center gap-4 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                    <Icon icon="tabler:file-text" class="w-4 h-4" />
                    <span>Page {{ pageNumber + 1 }} of {{ totalPages }}</span>
                </div>
                <div class="text-xs">
                    Showing {{ Math.min(pageNumber * pageLimitSelected + 1, nmbEntriesTotal) }}-{{
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

        <!-- Error Alert -->
        <Alert v-if="error" variant="destructive">
            <Icon icon="ant-design:warning-twotone" />
            <AlertDescription> Failed to fetch vulnerabilities data </AlertDescription>
        </Alert>
    </div>
</template>

<style scoped lang="scss">
/* Enhanced table styling */
.vulnerability-table {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    border: 1px solid rgb(229 231 235);
}

/* Impact bubble styling */
.impact-bubble {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid;
}

.impact-high {
    background-color: rgb(254 242 242);
    color: rgb(185 28 28);
    border-color: rgb(254 202 202);
}

.impact-medium {
    background-color: rgb(255 247 237);
    color: rgb(194 65 12);
    border-color: rgb(253 186 116);
}

/* Hover effects for interactive elements */
.cursor-help:hover {
    transform: scale(1.05);
    transition: transform 150ms;
}

/* Table row hover effects */
tr:hover {
    background-color: rgba(249, 250, 251, 0.8);
}

/* Better spacing for table cells */
td {
    vertical-align: top;
    padding: 0.75rem 1rem;
}

/* Enhanced badge styles */
.severity-badge-bg {
    border: 1px solid;
}

.severity-critical-bg {
    background-color: rgb(254 242 242);
    border-color: rgb(254 202 202);
}

.severity-high-bg {
    background-color: rgb(255 247 237);
    border-color: rgb(253 186 116);
}

.severity-medium-bg {
    background-color: rgb(254 252 232);
    border-color: rgb(254 240 138);
}

.severity-low-bg {
    background-color: rgb(239 246 255);
    border-color: rgb(147 197 253);
}

.severity-none-bg {
    background-color: rgb(249 250 251);
    border-color: rgb(209 213 219);
}

/* Severity text colors */
.text-severity-critical {
    color: rgb(220 38 38);
}

.text-severity-high {
    color: rgb(234 88 12);
}

.text-severity-medium {
    color: rgb(202 138 4);
}

.text-severity-low {
    color: rgb(37 99 235);
}

.text-severity-none {
    color: rgb(107 114 128);
}
</style>
