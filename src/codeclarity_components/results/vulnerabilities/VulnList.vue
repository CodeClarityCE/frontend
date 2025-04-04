<script lang="ts" setup>
import { type Ref, ref, watch } from 'vue';
import SearchBar from '@/base_components/SearchBar.vue';
import BoxLoader from '@/base_components/BoxLoader.vue';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import type {
    VulnerabilityMerged,
    WeaknessInfo
} from '@/codeclarity_components/results/vulnerabilities/VulnStats';
import { Icon } from '@iconify/vue';
// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import PaginationComponent from '@/base_components/PaginationComponent.vue';
import {
    isNoneSeverity,
    isCriticalSeverity,
    isHighSeverity,
    isLowSeverity,
    isMediumSeverity
} from '@/utils/severity';
import BubbleComponent from '@/base_components/bubbles/BubbleComponent.vue';
import SeverityBubble from '@/base_components/bubbles/SeverityBubble.vue';
import InfoMarkdown from '@/base_components/markdown/InfoMarkdown.vue';
import UtilitiesSort from '@/base_components/UtilitiesSort.vue';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import UtilitiesFilters, {
    createNewFilterState,
    FilterType,
    type FilterState
} from '@/base_components/UtilitiesFilters.vue';
import ActiveFilterBar from '@/base_components/ActiveFilterBar.vue';
import { ProjectsSortInterface } from '@/codeclarity_components/projects/project.repository';
import { Badge } from '@/shadcn/ui/badge';

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

const selectionPageLimit = [5, 10, 20, 30, 40, 50, 75, 100];
const placeholder = 'Search by dependency, dependency version, or cve';

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

const sortByOptions = [
    { label: 'CVE', key: 'cve' },
    { label: 'Severity', key: 'severity' },
    { label: 'Dependency Name', key: 'dep_name' },
    { label: 'Dependency Version', key: 'dep_version' },
    { label: 'Weakness', key: 'weakness' },
    { label: 'Owasp Top 10', key: 'owasp_top_10' }
];

const resultsRepository: ResultsRepository = new ResultsRepository();

watch([pageLimitSelected, searchKey, sortKey, sortDirection, pageNumber], () => {
    init();
});

function getUniqueOWASP(weaknessInfo: WeaknessInfo[]) {
    const owaspIds = weaknessInfo.map((weakness) => weakness.OWASPTop10Id);
    const uniqueOwaspIds = Array.from(new Set(owaspIds));

    return uniqueOwaspIds;
}

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
            workspace: '.',
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
        console.log(error);
        render.value = false;
    }
}

init();
</script>

<template>
    <div style="display: flex; flex-direction: column; row-gap: 30px">
        <!--------------------------------------------------------------------------->
        <!--                            Search and Filters                         -->
        <!--------------------------------------------------------------------------->

        <div style="display: flex; column-gap: 1em">
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

        <!--------------------------------------------------------------------------->
        <!--                           Vulnerabilities List                        -->
        <!--------------------------------------------------------------------------->

        <div v-if="render" class="flex flex-col gap-y-6">
            <div v-for="report in findings" :key="report.Id">
                <RouterLink
                    class="flex flex-col gap-2 transition-all hover:scale-105"
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
                    <div title="View vulnerability details" style="font-size: 1.05rem">
                        <div class="relative">
                            <div class="short_listing_vulnerability mb-4 flex gap-x-4 p-2">
                                <!--------------------------------------------------------------------------->
                                <!--                     Side severity class indicator                     -->
                                <!--------------------------------------------------------------------------->

                                <div class="flex w-12 flex-shrink-0">
                                    <div
                                        class="[writing-mode:vertical-lr] flex items-center self-start"
                                    >
                                        <div
                                            v-if="isCriticalSeverity(report.Severity.Severity)"
                                            class="px-1 py-5 font-semibold text-white bg-severityCritical"
                                        >
                                            CRITICAL
                                        </div>
                                        <div
                                            v-if="isHighSeverity(report.Severity.Severity)"
                                            class="px-1 py-5 font-semibold text-white bg-severityHigh"
                                        >
                                            HIGH
                                        </div>
                                        <div
                                            v-if="isMediumSeverity(report.Severity.Severity)"
                                            class="px-1 py-5 font-semibold text-white bg-severityMedium"
                                        >
                                            MODERATE
                                        </div>
                                        <div
                                            v-if="isLowSeverity(report.Severity.Severity)"
                                            class="px-1 py-5 font-semibold text-white bg-severityLow"
                                        >
                                            LOW
                                        </div>
                                        <div
                                            v-if="isNoneSeverity(report.Severity.Severity)"
                                            class="px-1 py-5 font-semibold text-white bg-severityNone"
                                        >
                                            NONE
                                        </div>
                                    </div>
                                </div>

                                <!--------------------------------------------------------------------------->
                                <!--                       Vulnerability information                       -->
                                <!--------------------------------------------------------------------------->

                                <div class="flex flex-col gap-4 py-1 pr-16 w-full shrink-0">
                                    <div class="flex gap-2 justify-between">
                                        <div v-if="report.Weaknesses.length > 0">
                                            <div
                                                style="
                                                    margin-bottom: -10px;
                                                    font-size: 1.25em;
                                                    font-weight: 400;
                                                "
                                            >
                                                {{ report.Weaknesses[0].WeaknessName || '' }}
                                            </div>
                                        </div>
                                    </div>

                                    <!--------------------------------------------------------------------------->
                                    <!--                               Vulnerability Id                        -->
                                    <!--------------------------------------------------------------------------->

                                    <div class="text-xl font-normal">
                                        {{ report.Vulnerability }}
                                    </div>

                                    <div class="flex gap-5 items-center">
                                        <div class="flex gap-y-5 gap-x-2 flex-wrap">
                                            <!--------------------------------------------------------------------------->
                                            <!--                              Severity indicator                       -->
                                            <!--------------------------------------------------------------------------->
                                            <SeverityBubble
                                                :critical="
                                                    isCriticalSeverity(report.Severity.Severity)
                                                "
                                                :high="isHighSeverity(report.Severity.Severity)"
                                                :medium="isMediumSeverity(report.Severity.Severity)"
                                                :low="isLowSeverity(report.Severity.Severity)"
                                                :none="isNoneSeverity(report.Severity.Severity)"
                                            >
                                                <template #content>{{
                                                    report.Severity.Severity
                                                }}</template>
                                            </SeverityBubble>

                                            <!--------------------------------------------------------------------------->
                                            <!--                                CWE Info                               -->
                                            <!--------------------------------------------------------------------------->

                                            <div
                                                v-if="report.Weaknesses"
                                                class="flex gap-1 justify-between items-center"
                                            >
                                                <Badge
                                                    v-for="weakness in report.Weaknesses"
                                                    :key="weakness.WeaknessId"
                                                    :cwe="true"
                                                >
                                                    {{ weakness.WeaknessId }}
                                                </Badge>
                                            </div>

                                            <!--------------------------------------------------------------------------->
                                            <!--                            Owasp Top 10 Info                          -->
                                            <!--------------------------------------------------------------------------->
                                            <div
                                                v-if="
                                                    report.Weaknesses &&
                                                    report.Weaknesses.some(
                                                        (weakness) => weakness.OWASPTop10Id != ''
                                                    )
                                                "
                                                class="flex gap-1 justify-between items-center"
                                            >
                                                <div>
                                                    <Icon :icon="'simple-icons:owasp'"></Icon>
                                                </div>
                                                <div
                                                    v-for="owaspID in getUniqueOWASP(
                                                        report.Weaknesses
                                                    )"
                                                    :key="owaspID"
                                                    class="flex gap-2 items-center font-bold text-[#5e5e5e]"
                                                >
                                                    <div v-if="owaspID == '1345'">
                                                        A01: Broken Access Control
                                                    </div>
                                                    <div v-if="owaspID == '1346'">
                                                        A02: Cryptographic Failures
                                                    </div>
                                                    <div v-if="owaspID == '1347'">
                                                        A03: Injection
                                                    </div>
                                                    <div v-if="owaspID == '1348'">
                                                        A04: Insecure Design
                                                    </div>
                                                    <div v-if="owaspID == '1349'">
                                                        A05: Security Misconfiguration
                                                    </div>
                                                    <div v-if="owaspID == '1352'">
                                                        A06: Vulnerable and Outdated Components
                                                    </div>
                                                    <div v-if="owaspID == '1353'">
                                                        A07: Identification and Authentication
                                                        Failures
                                                    </div>
                                                    <div v-if="owaspID == '1354'">
                                                        A08: Software and Data Integrity Failures
                                                    </div>
                                                    <div v-if="owaspID == '1355'">
                                                        A09: Security Logging and Monitoring
                                                        Failures
                                                    </div>
                                                    <div v-if="owaspID == '1356'">
                                                        A10: Server-Side Request Forgery
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!--------------------------------------------------------------------------->
                                        <!--                              Impact info                              -->
                                        <!--------------------------------------------------------------------------->

                                        <div
                                            class="flex gap-5 gap-y-5 gap-x-1 flex-wrap text-[#444] text-sm"
                                        >
                                            <BubbleComponent
                                                v-if="
                                                    report.Severity &&
                                                    report.Severity.ConfidentialityImpact !=
                                                        'NONE' &&
                                                    report.Severity.AvailabilityImpact != ''
                                                "
                                                title="Impacts Confidentiality"
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
                                            >
                                                <template #content>
                                                    <Icon :icon="'prime:angle-double-down'"></Icon>
                                                    <div>Integrity</div>
                                                </template>
                                            </BubbleComponent>
                                        </div>
                                    </div>

                                    <!--------------------------------------------------------------------------->
                                    <!--                           Affected dep info                           -->
                                    <!--------------------------------------------------------------------------->

                                    <div v-if="report.Affected.length == 1">
                                        Vulnerable library:
                                    </div>
                                    <div v-else>Vulnerable libraries:</div>
                                    <div
                                        v-for="info in report.Affected"
                                        :key="info.AffectedDependency"
                                    >
                                        {{ info.AffectedDependency }}@{{ info.AffectedVersion }}
                                    </div>

                                    <!--------------------------------------------------------------------------->
                                    <!--                       Vulnerability description                       -->
                                    <!--------------------------------------------------------------------------->

                                    <InfoMarkdown
                                        :markdown="report.Description.trim()"
                                    ></InfoMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </RouterLink>
            </div>

            <!--------------------------------------------------------------------------->
            <!--                     Filter result empty indicator                     -->
            <!--------------------------------------------------------------------------->

            <div v-if="matchingItemsCount == 0 && filterApplied && render" style="margin-top: 20px">
                <div style="text-align: center">No findings match the filter</div>
            </div>
            <div
                v-if="matchingItemsCount == 0 && !filterApplied && render"
                style="margin-top: 20px"
            >
                <div style="text-align: center">No findings</div>
            </div>

            <!--------------------------------------------------------------------------->
            <!--                          Pagination buttons                           -->
            <!--------------------------------------------------------------------------->
            <PaginationComponent
                v-model:page="pageNumber"
                v-model:nmb-entries-showing="pageLimitSelected"
                v-model:nmb-entries-total="nmbEntriesTotal"
                v-model:total-pages="totalPages"
            />
        </div>

        <!--------------------------------------------------------------------------->
        <!--                            Loading skeleton                           -->
        <!--------------------------------------------------------------------------->

        <div v-else>
            <div style="display: flex; flex-direction: column; row-gap: 10px">
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
@use '@/assets/colors.scss';
@use '@/assets/common/summary.scss';
@use '@/assets/common/cvss.scss';
</style>
