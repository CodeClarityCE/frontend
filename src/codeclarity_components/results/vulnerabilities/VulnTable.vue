<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import SearchBar from '@/base_components/SearchBar.vue';
import { Icon } from '@iconify/vue';
import SeverityBubble from '@/base_components/bubbles/SeverityBubble.vue';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import PaginationComponent from '@/base_components/PaginationComponent.vue';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import type { VulnerabilityMerged } from '@/codeclarity_components/results/vulnerabilities/VulnStats';
import BubbleComponent from '@/base_components/bubbles/BubbleComponent.vue';
import SortableTable, { type TableHeader } from '@/base_components/tables/SortableTable.vue';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import UtilitiesSort from '@/base_components/UtilitiesSort.vue';
import UtilitiesFilters, {
    createNewFilterState,
    FilterType,
    type FilterState
} from '@/base_components/UtilitiesFilters.vue';
import ActiveFilterBar from '@/base_components/ActiveFilterBar.vue';
import { ProjectsSortInterface } from '@/codeclarity_components/projects/project.repository';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';

export interface Props {
    [key: string]: any;
    highlightElem: string;
    forceOpenNewTab?: boolean;
    analysisID?: string;
    projectID?: string;
}

const props = withDefaults(defineProps<Props>(), {
    forceOpenNewTab: false,
    analysisID: '',
    projectID: ''
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

const findings: Ref<Array<VulnerabilityMerged>> = ref([]);
const sortKey = ref(ProjectsSortInterface.SEVERITY);
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);

const selected_workspace = defineModel<string>('selected_workspace', { default: '.' });

function isNoneSeverity(n: number) {
    return n == 0.0 || n == undefined;
}
function isLowSeverity(n: number) {
    return n < 4.0 && n > 0.0;
}
function isMediumSeverity(n: number) {
    return n >= 4.0 && n < 7.0;
}
function isHighSeverity(n: number) {
    return n >= 7.0 && n < 9.0;
}
function isCriticalSeverity(n: number) {
    return n >= 9.0;
}

// DEFINE THE OPTIONS IN FILTER
interface Options {
    [key: string]: any;
}
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
    for (const option in options.value[category]['data']) {
        options.value[category]['data'][option]['value'] = false;
    }
}

function updateSort(_sortKey: ProjectsSortInterface, _sortDirection: SortDirection) {
    sortKey.value = _sortKey;
    sortDirection.value = _sortDirection;
    init();
}

const resultsRepository: ResultsRepository = new ResultsRepository();

watch([pageLimitSelected, searchKey, sortKey, sortDirection, pageNumber], async () => {
    init();
});

// Filters
const filterState: Ref<FilterState> = ref(
    createNewFilterState({
        ImportState: {
            name: 'Language',
            type: FilterType.RADIO,
            data: {
                js: {
                    title: 'JavaScript',
                    value: true
                }
            }
        }
    })
);

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
            active_filters: '',
            search_key: searchKey.value
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

init();

watch(selected_workspace, async () => await init());
</script>

<template>
    <div class="flex flex-col gap-7">
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
        <div class="overflow-x-auto">
            <SortableTable
                :headers="headers"
                :sort-key="sortKey"
                :sort-direction="sortDirection"
                :on-sort-change="updateSort"
            >
                <template #data>
                    <tr v-for="report in findings" :key="report.Id">
                        <td>
                            <BubbleComponent :slim="true">
                                <template #content>
                                    <div class="text-nowrap whitespace-nowrap">
                                        {{ report.Vulnerability }}
                                    </div>
                                </template>
                            </BubbleComponent>
                        </td>
                        <td>
                            <SeverityBubble
                                :critical="isCriticalSeverity(report.Severity.Severity)"
                                :high="isHighSeverity(report.Severity.Severity)"
                                :medium="isMediumSeverity(report.Severity.Severity)"
                                :low="isLowSeverity(report.Severity.Severity)"
                                :none="isNoneSeverity(report.Severity.Severity)"
                            >
                                <template #content>{{ report.Severity.Severity }}</template>
                            </SeverityBubble>
                        </td>
                        <td>
                            <div
                                v-for="affected in report.Affected"
                                :key="affected.AffectedDependency"
                                class="flex flex-row gap-2"
                            >
                                <BubbleComponent
                                    v-if="affected.PatchType == 'NONE'"
                                    :not-patchable="true"
                                    :slim="true"
                                >
                                    <template #content>
                                        <Icon :icon="'material-symbols:crisis-alert'"></Icon> Not
                                        patchable : {{ affected.AffectedDependency }}
                                    </template>
                                </BubbleComponent>
                                <BubbleComponent
                                    v-else-if="affected.PatchType == 'PARTIAL'"
                                    :partially-patchable="true"
                                    :slim="true"
                                >
                                    <template #content>
                                        <div
                                            class="flex flex-row gap-1 items-center whitespace-nowrap"
                                        >
                                            <Icon :icon="'material-symbols:crisis-alert'"></Icon>
                                            Partially patchable : {{ affected.AffectedDependency }}
                                        </div>
                                    </template>
                                </BubbleComponent>
                                <span v-else>{{ affected.AffectedDependency }}</span>
                            </div>
                        </td>
                        <td>
                            <div v-if="report.Weaknesses">
                                <BubbleComponent
                                    v-for="weakness in report.Weaknesses"
                                    :key="weakness.WeaknessId"
                                    :slim="true"
                                >
                                    <template #content>
                                        {{ weakness.WeaknessId }}
                                    </template>
                                </BubbleComponent>
                            </div>
                        </td>
                        <td>
                            <div
                                v-if="
                                    report.Weaknesses &&
                                    report.Weaknesses.some(
                                        (weakness) => weakness.OWASPTop10Id != ''
                                    )
                                "
                            >
                                <div
                                    v-for="weakness in report.Weaknesses"
                                    :key="weakness.WeaknessId"
                                    class="flex flex-row gap-2 items-center text-[#5e5e5e] w-fit"
                                >
                                    <div>
                                        <Icon :icon="'simple-icons:owasp'"></Icon>
                                    </div>
                                    <div
                                        v-if="weakness.OWASPTop10Id == '1345'"
                                        class="whitespace-nowrap"
                                    >
                                        A01: Broken Access Control
                                    </div>
                                    <div
                                        v-else-if="weakness.OWASPTop10Id == '1346'"
                                        class="whitespace-nowrap"
                                    >
                                        A02: Cryptographic Failures
                                    </div>
                                    <div
                                        v-else-if="weakness.OWASPTop10Id == '1347'"
                                        class="whitespace-nowrap"
                                    >
                                        A03: Injection
                                    </div>
                                    <div
                                        v-else-if="weakness.OWASPTop10Id == '1348'"
                                        class="whitespace-nowrap"
                                    >
                                        A04: Insecure Design
                                    </div>
                                    <div
                                        v-else-if="weakness.OWASPTop10Id == '1349'"
                                        class="whitespace-nowrap"
                                    >
                                        A05: Security Misconfiguration
                                    </div>
                                    <div
                                        v-else-if="weakness.OWASPTop10Id == '1352'"
                                        class="whitespace-nowrap"
                                    >
                                        A06: Vulnerable and Outdated Components
                                    </div>
                                    <div
                                        v-else-if="weakness.OWASPTop10Id == '1353'"
                                        class="whitespace-nowrap"
                                    >
                                        A07: Identification and Authentication Failures
                                    </div>
                                    <div
                                        v-else-if="weakness.OWASPTop10Id == '1354'"
                                        class="whitespace-nowrap"
                                    >
                                        A08: Software and Data Integrity Failures
                                    </div>
                                    <div
                                        v-else-if="weakness.OWASPTop10Id == '1355'"
                                        class="whitespace-nowrap"
                                    >
                                        A09: Security Logging and Monitoring Failures
                                    </div>
                                    <div
                                        v-else-if="weakness.OWASPTop10Id == '1356'"
                                        class="whitespace-nowrap"
                                    >
                                        A10: Server-Side Request Forgery
                                    </div>
                                    <div v-else class="whitespace-nowrap">Other</div>
                                </div>
                            </div>
                        </td>
                        <td class="hide-1300">
                            <div>
                                {{ report.Severity.Exploitability.toFixed(2) ?? 'N/A' }}
                            </div>
                        </td>
                        <td class="hide-1450">
                            <div class="flex flex-col gap-1 text-sm text-[#444444]">
                                <BubbleComponent
                                    v-if="
                                        report.Severity &&
                                        report.Severity.ConfidentialityImpact != 'NONE' &&
                                        report.Severity.AvailabilityImpact != ''
                                    "
                                    title="Impacts Confidentiality"
                                    :slim="true"
                                    class="flex flex-row items-center gap-2"
                                >
                                    <template #content>
                                        <Icon :icon="'prime:angle-double-down'"></Icon>
                                        <div>Confidentiality</div>
                                    </template>
                                </BubbleComponent>
                                <BubbleComponent
                                    v-if="
                                        report.Severity &&
                                        report.Severity.AvailabilityImpact != 'NONE' &&
                                        report.Severity.AvailabilityImpact != ''
                                    "
                                    title="Impacts Availability"
                                    :slim="true"
                                    class="flex flex-row items-center gap-2"
                                >
                                    <template #content>
                                        <Icon :icon="'prime:angle-double-down'"></Icon>
                                        <div>Availability</div>
                                    </template>
                                </BubbleComponent>
                                <BubbleComponent
                                    v-if="
                                        report.Severity &&
                                        report.Severity.IntegrityImpact != 'NONE' &&
                                        report.Severity.AvailabilityImpact != ''
                                    "
                                    title="Impacts Integrity"
                                    :slim="true"
                                    class="flex flex-row items-center gap-2"
                                >
                                    <template #content>
                                        <Icon :icon="'prime:angle-double-down'"></Icon>
                                        <div>Integrity</div>
                                    </template>
                                </BubbleComponent>
                            </div>
                        </td>
                        <td>
                            <div>
                                <RouterLink
                                    class="open-details flex flex-row items-center gap-1"
                                    :to="{
                                        name: 'results',
                                        query: {
                                            analysis_id: props.analysisID,
                                            project_id: props.projectID,
                                            finding_id: report.Id
                                        },
                                        params: { page: 'vulnerabilities_details' }
                                    }"
                                >
                                    <Icon :icon="'ic:outline-open-in-new'"></Icon> details
                                </RouterLink>
                            </div>
                        </td>
                    </tr>
                </template>
            </SortableTable>
            <div v-if="matchingItemsCount == 0 && filterApplied" style="margin-top: 20px">
                <div style="text-align: center">No findings match the filter</div>
            </div>
            <div v-if="matchingItemsCount == 0 && !filterApplied" style="margin-top: 20px">
                <div style="text-align: center">No findings</div>
            </div>
        </div>
        <div
            style="color: #484848; font-weight: 400; display: flex; justify-content: space-between"
        >
            <div style="">Showing {{ nmbEntriesShowing }} out of {{ nmbEntriesTotal }} entries</div>
            <PaginationComponent
                v-model:page="pageNumber"
                v-model:nmb-entries-showing="pageLimitSelected"
                v-model:nmb-entries-total="nmbEntriesTotal"
                v-model:total-pages="totalPages"
            />
        </div>
    </div>
    <Alert v-if="error" variant="destructive">
        <Icon :icon="'ant-design:warning-twotone'"></Icon>
        <AlertDescription> Failed to fetch vulnerabilities data </AlertDescription>
    </Alert>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';
</style>
