<script lang="ts" setup>
import { ref, type Ref } from 'vue';
import { cvssV2_fields_map, cvssV3_fields_map } from '@/utils/cvss';

import CenteredModal from '../../../base_components/CenteredModal.vue';
// import { buildDependencyTree } from "../../../dependency-tree.js";

import moment from 'moment';
import { Chart, registerables, type ChartData } from 'chart.js';
import VulnDetailsHeader from './VulnDetails/VulnDetailsHeader.vue';
import VulnSummaryContent from './VulnDetails/VulnSummaryContent.vue';
import VulnerabilitySeverities from './VulnDetails/VulnerabilitySeverities.vue';
import VulnDetailsLoader from './VulnDetails/VulnDetailsLoader.vue';

import PositionedModal from '../../../base_components/PositionedModal.vue';
// import { AnalysisRepository } from '@/repositories/AnalysisRepository';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import type { DataResponse } from '@/utils/api/responses/DataResponse';

import { Icon } from '@iconify/vue';

import { VulnerabilityDetails } from '@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails';
import router from '@/router';
import { getRadarChartData as getCVSSRadarChartData } from './cvssChart';
import { getRadarChartData as getImpactChartData } from './impactChart';
import InfoMarkdown from '@/base_components/markdown/InfoMarkdown.vue';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import Button from '@/shadcn/ui/button/Button.vue';

Chart.register(...registerables);

type Props = {
    [key: string]: any;
    showBack?: boolean;
    analysisID: string;
    projectID: string;
};

const props = withDefaults(defineProps<Props>(), {
    showBack: false
});

const render: Ref<boolean> = ref(false);
const finding: Ref<VulnerabilityDetails> = ref(new VulnerabilityDetails());
const references_limit: Ref<number> = ref(8);
const versions_modal_ref: Ref<typeof PositionedModal> = ref(PositionedModal);
const cvss_field: Ref<string> = ref('');
const cvss_field_value: Ref<string> = ref('');
const cvss_field_version: Ref<string> = ref('');
const cvss_info: Ref<any> = ref({});
const cvss_field_info_modal_ref: Ref<typeof CenteredModal> = ref(CenteredModal);
const active_view: Ref<string> = ref('patches');
const readme: Ref<string> = ref('');
const read_me_modal_ref: Ref<typeof CenteredModal> = ref(CenteredModal);
const chart_version: Ref<string> = ref('');

const colors = ['#7400B8', '#5E60CE', '#4EA8DE', '#56CFE1', '#80FFDB'];
const initChartData = {
    labels: [],
    datasets: [
        {
            borderColor: 'transparent',
            spacing: 3,
            borderRadius: 3,
            data: [],
            backgroundColor: colors
        }
    ]
};
const cvss_chart_data: Ref<ChartData<'radar'>> = ref(initChartData as ChartData<'radar'>);
const impact_chart_data: Ref<ChartData<'radar'>> = ref(initChartData as ChartData<'radar'>);

function getFavicon(url: string) {
    const host = getHost(url);
    return `https://s2.googleusercontent.com/s2/favicons?sz=64&domain=${host}`;
}

function getHost(url: string) {
    const host = new URL(url).hostname;
    return host;
}

function getReferences() {
    return finding.value.references.slice(0, references_limit.value);
}

function toggleReferences() {
    if (references_limit.value != finding.value.references.length)
        references_limit.value = finding.value.references.length;
    else references_limit.value = 8;
}

function goBack() {
    router.back();
}

const resultsRepository: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

function openModal(data: any) {
    cvss_field.value = data.cvss_field;
    cvss_field_value.value = data.cvss_field_value;
    cvss_field_version.value = data.cvss_field_version;
    cvss_info.value = data.cvss_info;
    cvss_field_info_modal_ref.value.show();
}

async function getFinding(projectID: string, analysisID: string) {
    const urlParams = new URLSearchParams(window.location.search);
    const finding_id_param = urlParams.get('finding_id');
    let finding_id = '';

    if (finding_id_param) {
        finding_id = finding_id_param;
    } else {
        finding_id = props.findingID;
    }

    if (finding_id == '') {
        return;
    }

    let res: DataResponse<VulnerabilityDetails>;
    try {
        if (userStore.getDefaultOrg == null) {
            throw new Error('No default org');
        }

        if (authStore.getToken == null) {
            throw new Error('No token');
        }

        res = await resultsRepository.getFinding({
            orgId: userStore.getDefaultOrg.id,
            projectId: projectID,
            analysisId: analysisID,
            vulnerability_id: finding_id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            workspace: '.'
        });
        finding.value = res.data;
        if (finding.value.severities.cvss_31 != null) {
            chart_version.value = 'cvss31';
        } else if (finding.value.severities.cvss_3 != null) {
            chart_version.value = 'cvss3';
        } else if (finding.value.severities.cvss_2 != null) {
            chart_version.value = 'cvss2';
        }

        if (finding.value) {
            const cvss_chart_config = getCVSSRadarChartData(finding.value);
            cvss_chart_data.value = cvss_chart_config as unknown as ChartData<'radar'>;
            if (finding.value.severities.cvss_31 != null) {
                chart_version.value = 'cvss31';
            } else if (finding.value.severities.cvss_3 != null) {
                chart_version.value = 'cvss3';
            } else if (finding.value.severities.cvss_2 != null) {
                chart_version.value = 'cvss2';
            }
        }
        if (finding.value) {
            const impact_chart_config = getImpactChartData(finding.value);
            impact_chart_data.value = impact_chart_config as unknown as ChartData<'radar'>;
            if (finding.value.severities.cvss_31 != null) {
                chart_version.value = 'cvss31';
            } else if (finding.value.severities.cvss_3 != null) {
                chart_version.value = 'cvss3';
            } else if (finding.value.severities.cvss_2 != null) {
                chart_version.value = 'cvss2';
            }
        }

        render.value = true;
    } catch (_err) {
        console.error(_err);

        // error.value = true;
        // if (_err instanceof BusinessLogicError) {
        //     errorCode.value = _err.error_code;
        // }
    } finally {
        // loading.value = false;
        // createDepTypeChart();
        // createDepStatusDistChart();
    }
}

getFinding(props.projectID, props.analysisID);
</script>

<template>
    <div style="position: relative">
        <!--------------------------------------------------------------------------->
        <!--                               Navigation                              -->
        <!--------------------------------------------------------------------------->
        <div v-if="showBack" class="content-header cursor-pointer">
            <Badge variant="secondary" title="Go back to preview page" @click="goBack()">
                <Icon :icon="'material-symbols:keyboard-backspace'"></Icon>
                Go back
            </Badge>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                                 Content                               -->
        <!--------------------------------------------------------------------------->
        <div v-if="render" class="details-container flex flex-col gap-10" style="font-size: 1rem">
            <VulnDetailsHeader :finding="finding" :versions-modal-ref="versions_modal_ref" />

            <VulnSummaryContent
                :finding="finding"
                :read-me-modal-ref="read_me_modal_ref"
                :readme="readme"
                :active-view="active_view"
            />

            <VulnerabilitySeverities
                :finding="finding"
                :cvss-v3-fields-map="cvssV3_fields_map"
                :cvss-v2-fields-map="cvssV2_fields_map"
                :chart-version="chart_version"
                :cvss-chart-data="cvss_chart_data"
                :impact-chart-data="impact_chart_data"
                :cvss-field-info-modal-ref="cvss_field_info_modal_ref"
                @open-modal="openModal"
            />

            <!--------------------------------------------------------------------------->
            <!--                            References section                         -->
            <!--------------------------------------------------------------------------->
            <section class="references-wrapper">
                <div class="flex flex-col gap-5">
                    <h2 style="font-family: lato; font-weight: 900">
                        <div><span style="color: teal; font-size: 1.9em">R</span>eferences</div>
                    </h2>
                    <div class="references-inner-wrapper">
                        <!--------------------------------------------------------------------------->
                        <!--                               Reference                               -->
                        <!--------------------------------------------------------------------------->
                        <div
                            v-for="reference in getReferences()"
                            :key="reference.url"
                            title="View reference (opens in a new tab)"
                        >
                            <a
                                :href="reference.url"
                                target="_blank"
                                class="reference p-5 rounded-lg"
                            >
                                <div class="reference-header">
                                    <div
                                        class="reference-header-wrapper flex flex-col items-center gap-5 font-medium text-sm"
                                    >
                                        <img :src="getFavicon(reference.url)" />
                                        <div>{{ getHost(reference.url) }}</div>
                                    </div>
                                    <div>
                                        <Icon :icon="'ion:open-outline'"></Icon>
                                    </div>
                                </div>
                                <div>{{ reference.url }}</div>
                                <div class="vulnerability-references-tags-container">
                                    <div
                                        v-for="tag in reference.tags"
                                        :key="tag"
                                        class="reference-tag"
                                    >
                                        {{ tag }}
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>

                    <!--------------------------------------------------------------------------->
                    <!--                         References load more                          -->
                    <!--------------------------------------------------------------------------->
                    <div
                        v-if="finding.references && finding.references.length > 8"
                        class="references-show-more-wrapper"
                    >
                        <div @click="toggleReferences()">
                            <span v-if="references_limit < finding.references.length" class="button"
                                >Show more</span
                            >
                            <span
                                v-if="references_limit == finding.references.length"
                                class="button"
                                >Show less</span
                            >
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                               Readme modal                            -->
        <!--------------------------------------------------------------------------->

        <CenteredModal ref="read_me_modal_ref">
            <template #title>
                <div
                    style="
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        column-gap: 7px;
                        justify-content: space-between;
                    "
                >
                    <div
                        style="
                            display: flex;
                            flex-direction: row;
                            column-gap: 8px;
                            align-items: center;
                        "
                    >
                        <Icon :icon="'tabler:markdown'"></Icon>
                        <div>Readme</div>
                    </div>
                </div>
            </template>
            <template #content>
                <div style="max-width: 1000px; max-height: 80vh; overflow-y: auto">
                    <InfoMarkdown class="w-full" :markdown="readme"></InfoMarkdown>
                </div>
            </template>
            <template #buttons>
                <Button @click="read_me_modal_ref.toggle()"> Close </Button>
            </template>
        </CenteredModal>

        <!--------------------------------------------------------------------------->
        <!--                              All versions modal                       -->
        <!--------------------------------------------------------------------------->

        <PositionedModal ref="versions_modal_ref" :tracker="'show-all-versions'" :position="'top'">
            <template #title>
                <div
                    style="
                        display: flex;
                        flex-direction: row;
                        column-gap: 1em;
                        justify-content: space-between;
                    "
                >
                    <div>Dependency Versions</div>
                    <Icon
                        :icon="'ic:round-close'"
                        style="cursor: pointer"
                        title="Close modal"
                        @click="versions_modal_ref.toggle()"
                    >
                        Close
                    </Icon>
                </div>
            </template>
            <template #subtitle>
                The following list highlights which versions are known to be affected and which are
                known to not be affected by the vulnerability.
            </template>
            <template #content>
                <div style="max-width: 1000px; max-height: 40vh; overflow-y: auto">
                    <div
                        style="
                            display: flex;
                            flex-direction: row;
                            column-gap: 40px;
                            font-weight: 400;
                            color: #737171;
                        "
                    >
                        <div style="width: 50%">
                            <div
                                style="
                                    color: #457905;
                                    font-weight: 400;
                                    margin-bottom: 10px;
                                    font-size: 1em;
                                    display: flex;
                                    align-items: center;
                                    flex-direction: row;
                                    column-gap: 6px;
                                "
                            >
                                <div>Not Affected</div>
                                <Icon :icon="'bi:shield-check'"></Icon>
                            </div>
                            <div
                                v-for="version_obj in finding.vulnerability_info.version_info
                                    .versions"
                                :key="version_obj.version"
                                :class="{
                                    affected: version_obj.status == 'affected',
                                    not_affected: version_obj.status == 'not_affected'
                                }"
                            >
                                <div v-if="version_obj.status == 'not_affected'">
                                    <div
                                        style="
                                            display: flex;
                                            flex-direction: row;
                                            justify-content: space-between;
                                            column-gap: 40px;
                                        "
                                    >
                                        <div>{{ version_obj.version }}</div>
                                        <div>
                                            {{ moment(version_obj.release).format('LL') }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="width: 50%">
                            <div
                                style="
                                    color: #8c0c0c;
                                    font-weight: 400;
                                    margin-bottom: 10px;
                                    font-size: 1em;
                                    display: flex;
                                    align-items: center;
                                    flex-direction: row;
                                    column-gap: 6px;
                                "
                            >
                                <div>Affected</div>
                                <Icon :icon="'bi:shield-exclamation'"></Icon>
                            </div>
                            <div
                                v-for="version_obj in finding.vulnerability_info.version_info
                                    .versions"
                                :key="version_obj.version"
                                :class="{
                                    affected: version_obj.status == 'affected',
                                    not_affected: version_obj.status == 'not_affected'
                                }"
                            >
                                <div v-if="version_obj.status == 'affected'">
                                    <div
                                        style="
                                            display: flex;
                                            flex-direction: row;
                                            justify-content: space-between;
                                            column-gap: 40px;
                                        "
                                        :style="{
                                            'font-weight':
                                                version_obj.version ==
                                                finding.dependency_info?.version
                                                    ? 'black'
                                                    : '400',
                                            color:
                                                version_obj.version ==
                                                finding.dependency_info?.version
                                                    ? '#8c0c0c'
                                                    : '#737171'
                                        }"
                                    >
                                        <div>{{ version_obj.version }}</div>
                                        <div>
                                            {{ moment(version_obj.release).format('LL') }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <template #buttons>
                <Button variant="outline" @click="versions_modal_ref.toggle()"> Close </Button>
            </template>
        </PositionedModal>

        <!--------------------------------------------------------------------------->
        <!--                           CVSS Details Model                          -->
        <!--------------------------------------------------------------------------->

        <CenteredModal ref="cvss_field_info_modal_ref">
            <template #title>
                <span>CVSS{{ cvss_field_version }} - </span>
                {{ cvss_info[cvss_field].full_name }}
            </template>
            <template #subtitle> What does this mean for you? </template>
            <template #content>
                <div style="max-width: 40vw">
                    <div style="margin-bottom: 20px">
                        {{ cvss_info[cvss_field].text.description }}
                    </div>
                    <div class="cvss-field-value" style="font-weight: 900">
                        <div v-for="field_value in cvss_info[cvss_field].values" :key="field_value">
                            <div
                                v-if="field_value[0] == cvss_field_value"
                                :class="cvss_info[cvss_field].class[cvss_field_value]"
                            >
                                {{ field_value }}
                            </div>
                            <div v-if="field_value[0] != cvss_field_value">
                                {{ field_value }}
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 20px">
                        {{ cvss_info[cvss_field].text.value_descriptions[cvss_field_value] }}
                    </div>
                </div>
            </template>
            <template #buttons>
                <Button variant="outline" @click="cvss_field_info_modal_ref.toggle()">
                    Close
                </Button>
            </template>
        </CenteredModal>

        <!--------------------------------------------------------------------------->
        <!--                            Loading skeleton                           -->
        <!--------------------------------------------------------------------------->

        <div v-if="!render">
            <VulnDetailsLoader />
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';
@use '@/assets/common/details.scss';
@use '@/assets/common/cvss.scss';
</style>
