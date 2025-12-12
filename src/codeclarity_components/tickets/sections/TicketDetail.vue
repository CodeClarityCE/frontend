<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { Icon } from '@iconify/vue';
import { Button } from '@/shadcn/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/shadcn/ui/dropdown-menu';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/shadcn/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn/ui/tooltip';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { TicketsRepository } from '../tickets.repository';
import {
    type TicketDetails,
    type VulnerabilityDetailsReport,
    TicketStatusLabels,
    TicketStatusColors,
    TicketPriorityLabels,
    TicketPriorityColors,
    TicketTypeLabels,
    TicketTypeColors,
    TicketStatus,
    ExternalTicketProvider,
    ExternalProviderLabels,
    ExternalProviderIcons,
    type IntegrationConfigSummary
} from '../tickets.entity';
import RiskScoreGauge from '../components/RiskScoreGauge.vue';
import ScoreProgressBar from '../components/ScoreProgressBar.vue';
import { getOwaspInfoById } from '@/utils/owasp';

const props = defineProps<{
    ticket: TicketDetails;
    isLoading: boolean;
    vulnerabilityDetails?: VulnerabilityDetailsReport | null;
    isLoadingVulnDetails?: boolean;
}>();

const emit = defineEmits<{
    close: [];
    updated: [];
}>();

const { defaultOrg } = storeToRefs(useUserStore());
const auth = useAuthStore();
const ticketsRepository = new TicketsRepository();

const isOpen = ref(true);
const isSyncing = ref(false);
const isUnlinking = ref<string | null>(null);
const isSyncingFromExternal = ref<string | null>(null);
const isUpdatingStatus = ref(false);
const availableIntegrations = ref<IntegrationConfigSummary[]>([]);
const openAccordionItems = ref<string[]>([]);

async function loadIntegrations() {
    if (!defaultOrg?.value?.id || !auth.getToken) return;

    try {
        const response = await ticketsRepository.getIntegrations({
            orgId: defaultOrg.value.id,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        availableIntegrations.value = response.data.filter((i) => i.enabled);
    } catch {
        console.error('Failed to load integrations');
    }
}

async function syncToProvider(provider: ExternalTicketProvider) {
    if (!defaultOrg?.value?.id || !auth.getToken) return;

    isSyncing.value = true;
    try {
        await ticketsRepository.syncTicket({
            orgId: defaultOrg.value.id,
            ticketId: props.ticket.id,
            provider,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        emit('updated');
    } catch (error) {
        console.error('Failed to sync ticket:', error);
    } finally {
        isSyncing.value = false;
    }
}

async function unlinkFromProvider(linkId: string) {
    if (!defaultOrg?.value?.id || !auth.getToken) return;

    isUnlinking.value = linkId;
    try {
        await ticketsRepository.unlinkTicket({
            orgId: defaultOrg.value.id,
            ticketId: props.ticket.id,
            linkId,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        emit('updated');
    } catch (error) {
        console.error('Failed to unlink ticket:', error);
    } finally {
        isUnlinking.value = null;
    }
}

async function syncFromExternalLink(linkId: string) {
    if (!defaultOrg?.value?.id || !auth.getToken) return;

    isSyncingFromExternal.value = linkId;
    try {
        const result = await ticketsRepository.syncFromExternal({
            orgId: defaultOrg.value.id,
            ticketId: props.ticket.id,
            linkId,
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        if (result.data.updated) {
            emit('updated');
        }
    } catch (error) {
        console.error('Failed to sync from external:', error);
    } finally {
        isSyncingFromExternal.value = null;
    }
}

async function updateStatus(newStatus: TicketStatus) {
    if (!defaultOrg?.value?.id || !auth.getToken) return;

    isUpdatingStatus.value = true;
    try {
        await ticketsRepository.updateTicket({
            orgId: defaultOrg.value.id,
            ticketId: props.ticket.id,
            data: { status: newStatus },
            bearerToken: auth.getToken,
            handleBusinessErrors: true,
            handleHTTPErrors: true,
            handleOtherErrors: true
        });
        emit('updated');
    } catch (error) {
        console.error('Failed to update ticket status:', error);
    } finally {
        isUpdatingStatus.value = false;
    }
}

function close() {
    isOpen.value = false;
    setTimeout(() => emit('close'), 300);
}

function formatDate(date: Date | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Get providers that aren't already linked
const availableSyncProviders = computed(() => {
    const linkedProviders = new Set(props.ticket.external_links.map((link) => link.provider));
    return availableIntegrations.value.filter(
        (integration) => !linkedProviders.has(integration.provider as ExternalTicketProvider)
    );
});

// Get the best available CVSS score (prefer v3.1 > v3 > v2)
const cvssData = computed((): { version: string; data: any } | null => {
    if (!props.vulnerabilityDetails?.severities) return null;
    const { cvss_31, cvss_3, cvss_2 } = props.vulnerabilityDetails.severities;
    if (cvss_31) return { version: '3.1', data: cvss_31 };
    if (cvss_3) return { version: '3.0', data: cvss_3 };
    if (cvss_2) return { version: '2.0', data: cvss_2 };
    return null;
});

// Format EPSS score as percentage
const epssFormatted = computed(() => {
    const score = props.vulnerabilityDetails?.other?.epss_score;
    const percentile = props.vulnerabilityDetails?.other?.epss_percentile;
    if (score === undefined || score === null) return null;
    return {
        score: (score * 100).toFixed(2) + '%',
        scoreRaw: score * 100,
        percentile: percentile !== undefined ? (percentile * 100).toFixed(1) + '%' : null,
        percentileRaw: percentile !== undefined ? percentile * 100 : null
    };
});

// Get color for CVSS vector value
function getCvssValueColor(value: string | undefined): string {
    if (!value) return 'text-gray-500';
    const lowRisk = ['LOCAL', 'PHYSICAL', 'HIGH', 'REQUIRED', 'NONE', 'UNCHANGED'];
    const highRisk = ['NETWORK', 'LOW', 'CHANGED'];
    if (highRisk.some((h) => value.toUpperCase().includes(h))) return 'text-red-600';
    if (lowRisk.some((l) => value.toUpperCase().includes(l))) return 'text-green-600';
    return 'text-yellow-600';
}

// Convert VLAI score string to numeric value for gauge
function getVlaiNumericScore(vlaiScore: string | undefined): number {
    if (!vlaiScore) return 0;
    const mapping: Record<string, number> = {
        CRITICAL: 10,
        HIGH: 7.5,
        MEDIUM: 5,
        LOW: 2.5
    };
    return mapping[vlaiScore.toUpperCase()] || 0;
}

// Get overall risk level
const overallRiskLevel = computed(() => {
    const cvss = cvssData.value?.data.base_score || 0;
    if (cvss >= 9.0) return 'critical';
    if (cvss >= 7.0) return 'high';
    if (cvss >= 4.0) return 'medium';
    if (cvss >= 0.1) return 'low';
    return 'none';
});

// Risk banner styling
type RiskConfig = { bg: string; text: string; icon: string; label: string; recommendation: string };
const riskBannerConfig = computed((): RiskConfig => {
    const configs: { [K in 'critical' | 'high' | 'medium' | 'low' | 'none']: RiskConfig } = {
        critical: {
            bg: 'bg-black',
            text: 'text-white',
            icon: 'solar:danger-triangle-bold',
            label: 'Critical',
            recommendation: 'Immediate action required'
        },
        high: {
            bg: 'bg-red-600',
            text: 'text-white',
            icon: 'solar:shield-warning-bold',
            label: 'High',
            recommendation: 'Address as soon as possible'
        },
        medium: {
            bg: 'bg-amber-500',
            text: 'text-white',
            icon: 'solar:shield-warning-linear',
            label: 'Medium',
            recommendation: 'Plan remediation in upcoming cycle'
        },
        low: {
            bg: 'bg-green-600',
            text: 'text-white',
            icon: 'solar:shield-check-bold',
            label: 'Low',
            recommendation: 'Monitor and address when convenient'
        },
        none: {
            bg: 'bg-gray-100',
            text: 'text-gray-700',
            icon: 'solar:info-circle-bold',
            label: 'Info',
            recommendation: 'No immediate action required'
        }
    };
    return configs[overallRiskLevel.value as keyof typeof configs] ?? configs.none;
});

// Check if we have any scores to show in risk overview
const hasRiskScores = computed(() => {
    return cvssData.value || epssFormatted.value || props.vulnerabilityDetails?.other?.vlai_score;
});

// Get OWASP info if available
const owaspInfo = computed(() => {
    const owasp = props.vulnerabilityDetails?.owasp_top_10;
    if (!owasp?.id) return null;
    return getOwaspInfoById(owasp.id);
});

onMounted(() => {
    loadIntegrations();
});
</script>

<template>
    <Teleport to="body">
        <!-- Backdrop -->
        <div
            class="fixed inset-0 bg-black/50 z-40 transition-opacity"
            :class="isOpen ? 'opacity-100' : 'opacity-0'"
            @click="close"
        />

        <!-- Slide-over Panel -->
        <div
            class="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-xl transition-transform duration-300"
            :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
        >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-lg flex items-center justify-center"
                        :class="TicketTypeColors[ticket.type]"
                    >
                        <Icon
                            v-if="ticket.type === 'VULNERABILITY'"
                            icon="solar:shield-warning-bold"
                            class="w-5 h-5"
                        />
                        <Icon
                            v-else-if="ticket.type === 'LICENSE'"
                            icon="solar:document-bold"
                            class="w-5 h-5"
                        />
                        <Icon v-else icon="solar:upload-bold" class="w-5 h-5" />
                    </div>
                    <div>
                        <span class="text-xs text-gray-500 uppercase tracking-wide">
                            {{ TicketTypeLabels[ticket.type] }}
                        </span>
                        <h2 class="text-lg font-semibold text-gray-900">Ticket Details</h2>
                    </div>
                </div>
                <button
                    class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    @click="close"
                >
                    <Icon icon="solar:close-circle-linear" class="w-6 h-6" />
                </button>
            </div>

            <!-- Content -->
            <div class="overflow-y-auto h-[calc(100vh-140px)] px-6 py-6 space-y-6">
                <!-- Title & Status -->
                <div>
                    <h3 class="text-xl font-semibold text-gray-900 mb-3">
                        {{ ticket.title }}
                    </h3>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span
                            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            :class="TicketStatusColors[ticket.status]"
                        >
                            {{ TicketStatusLabels[ticket.status] }}
                        </span>
                        <span
                            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            :class="TicketPriorityColors[ticket.priority]"
                        >
                            {{ TicketPriorityLabels[ticket.priority] }}
                        </span>
                    </div>
                    <!-- CVE ID Link (only if not already in title) -->
                    <a
                        v-if="
                            ticket.vulnerability_id &&
                            !ticket.title.includes(ticket.vulnerability_id)
                        "
                        :href="`https://nvd.nist.gov/vuln/detail/${ticket.vulnerability_id}`"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 mt-2 font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        {{ ticket.vulnerability_id }}
                        <Icon icon="solar:arrow-right-up-linear" class="w-3.5 h-3.5" />
                    </a>
                </div>

                <!-- Risk Banner (shown when vulnerability details available) -->
                <div
                    v-if="vulnerabilityDetails && hasRiskScores && !isLoadingVulnDetails"
                    :class="[
                        'flex items-center gap-3 p-4 rounded-lg',
                        riskBannerConfig.bg,
                        riskBannerConfig.text
                    ]"
                >
                    <Icon :icon="riskBannerConfig.icon" class="w-6 h-6 flex-shrink-0" />
                    <div>
                        <p class="font-semibold">{{ riskBannerConfig.label }} Risk</p>
                        <p class="text-sm opacity-90">{{ riskBannerConfig.recommendation }}</p>
                    </div>
                </div>

                <!-- Risk Overview Section -->
                <div
                    v-if="vulnerabilityDetails && hasRiskScores && !isLoadingVulnDetails"
                    class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200"
                >
                    <h4 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Icon icon="solar:chart-2-bold" class="w-5 h-5" />
                        Risk Overview
                    </h4>

                    <!-- Score Gauges Grid -->
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <!-- CVSS Gauge -->
                        <TooltipProvider v-if="cvssData">
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <div class="cursor-help">
                                        <RiskScoreGauge
                                            :score="cvssData.data.base_score || 0"
                                            :max-score="10"
                                            :label="'CVSS v' + cvssData.version"
                                            type="cvss"
                                            size="md"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent
                                    class="max-w-xs !bg-white !text-gray-900 border shadow-lg p-4"
                                    side="bottom"
                                >
                                    <div class="space-y-2">
                                        <h5 class="font-semibold">CVSS Score</h5>
                                        <p class="text-sm text-gray-600">
                                            Common Vulnerability Scoring System - industry standard
                                            for assessing severity.
                                        </p>
                                        <div class="text-xs space-y-1 mt-2">
                                            <div class="flex items-center gap-2">
                                                <span
                                                    class="w-2.5 h-2.5 rounded bg-black flex-shrink-0"
                                                ></span>
                                                <span>Critical: 9.0-10.0</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span
                                                    class="w-2.5 h-2.5 rounded bg-red-600 flex-shrink-0"
                                                ></span>
                                                <span>High: 7.0-8.9</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span
                                                    class="w-2.5 h-2.5 rounded bg-amber-500 flex-shrink-0"
                                                ></span>
                                                <span>Medium: 4.0-6.9</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span
                                                    class="w-2.5 h-2.5 rounded bg-green-500 flex-shrink-0"
                                                ></span>
                                                <span>Low: 0.1-3.9</span>
                                            </div>
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <!-- EPSS Gauge -->
                        <TooltipProvider v-if="epssFormatted">
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <div class="cursor-help">
                                        <RiskScoreGauge
                                            :score="epssFormatted.scoreRaw"
                                            :max-score="100"
                                            label="EPSS"
                                            type="epss"
                                            size="md"
                                            :sublabel="
                                                epssFormatted.percentile
                                                    ? 'Top ' + epssFormatted.percentile
                                                    : ''
                                            "
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent
                                    class="max-w-xs !bg-white !text-gray-900 border shadow-lg p-4"
                                    side="bottom"
                                >
                                    <div class="space-y-2">
                                        <h5 class="font-semibold">EPSS Score</h5>
                                        <p class="text-sm text-gray-600">
                                            Exploit Prediction Scoring System - probability this
                                            vulnerability will be exploited in the wild within 30
                                            days.
                                        </p>
                                        <div
                                            v-if="epssFormatted.percentile"
                                            class="text-xs text-gray-500 mt-2"
                                        >
                                            Percentile: {{ epssFormatted.percentile }} of all CVEs
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <!-- VLAI Gauge -->
                        <TooltipProvider v-if="vulnerabilityDetails.other?.vlai_score">
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <div class="cursor-help">
                                        <RiskScoreGauge
                                            :score="
                                                getVlaiNumericScore(
                                                    vulnerabilityDetails.other.vlai_score
                                                )
                                            "
                                            :max-score="10"
                                            label="VLAI"
                                            type="vlai"
                                            size="md"
                                            :sublabel="vulnerabilityDetails.other.vlai_score"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent
                                    class="max-w-xs !bg-white !text-gray-900 border shadow-lg p-4"
                                    side="bottom"
                                >
                                    <div class="space-y-2">
                                        <h5 class="font-semibold">VLAI Score</h5>
                                        <p class="text-sm text-gray-600">
                                            AI-powered risk assessment considering real-world
                                            exploitability and context.
                                        </p>
                                        <div
                                            v-if="vulnerabilityDetails.other.vlai_confidence"
                                            class="text-xs text-gray-500 mt-2"
                                        >
                                            Confidence:
                                            {{
                                                (
                                                    vulnerabilityDetails.other.vlai_confidence * 100
                                                ).toFixed(0)
                                            }}%
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <!-- OWASP Badge -->
                    <div
                        v-if="vulnerabilityDetails.owasp_top_10?.id"
                        class="pt-4 border-t border-gray-200"
                    >
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <div
                                        :class="[
                                            'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium cursor-help',
                                            owaspInfo?.color ||
                                                'bg-gray-50 border-gray-200 text-gray-800'
                                        ]"
                                    >
                                        <Icon icon="simple-icons:owasp" class="w-4 h-4" />
                                        <span>
                                            OWASP {{ vulnerabilityDetails.owasp_top_10.id }}:
                                            {{ vulnerabilityDetails.owasp_top_10.name }}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent
                                    class="max-w-sm !bg-white !text-gray-900 border shadow-lg p-4"
                                    side="bottom"
                                >
                                    <div class="space-y-2">
                                        <div class="flex items-center gap-2">
                                            <Icon
                                                icon="simple-icons:owasp"
                                                class="w-4 h-4 text-orange-600"
                                            />
                                            <span class="font-semibold">
                                                OWASP Top 10 - {{ owaspInfo?.id }}
                                            </span>
                                        </div>
                                        <h5 class="font-medium">{{ owaspInfo?.name }}</h5>
                                        <p class="text-sm text-gray-600">
                                            {{ owaspInfo?.description }}
                                        </p>
                                        <div class="pt-2 border-t border-gray-100">
                                            <p class="text-xs font-medium text-gray-700">
                                                Potential Impact:
                                            </p>
                                            <p class="text-xs text-gray-600">
                                                {{ owaspInfo?.impact }}
                                            </p>
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <!-- Affected Component (Compact) -->
                <div v-if="ticket.affected_package" class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 class="text-sm font-medium text-gray-700">Affected Component</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500">Package</p>
                            <p
                                class="text-sm text-gray-900 truncate"
                                :title="ticket.affected_package"
                            >
                                {{ ticket.affected_package }}
                            </p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Version</p>
                            <p class="text-sm text-gray-900">
                                {{ ticket.affected_version || 'N/A' }}
                                <span v-if="ticket.recommended_version" class="text-green-600">
                                    → {{ ticket.recommended_version }}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Loading vulnerability details -->
                <div v-if="isLoadingVulnDetails" class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center gap-2 text-gray-500">
                        <Icon icon="solar:spinner-outline" class="w-4 h-4 animate-spin" />
                        <span class="text-sm">Loading vulnerability details...</span>
                    </div>
                </div>

                <!-- Detailed Breakdowns (Accordion) -->
                <Accordion
                    v-if="vulnerabilityDetails && !isLoadingVulnDetails"
                    v-model="openAccordionItems"
                    type="multiple"
                    class="space-y-2"
                >
                    <!-- CVSS Details Section -->
                    <AccordionItem
                        v-if="cvssData"
                        value="cvss-details"
                        class="border rounded-lg overflow-hidden"
                    >
                        <AccordionTrigger
                            class="px-4 py-3 hover:no-underline hover:bg-gray-50 data-[state=open]:bg-gray-50"
                        >
                            <div class="flex items-center gap-2 text-sm font-medium">
                                <Icon
                                    icon="solar:shield-check-bold"
                                    class="w-4 h-4 text-gray-600"
                                />
                                CVSS v{{ cvssData.version }} Breakdown
                            </div>
                        </AccordionTrigger>
                        <AccordionContent class="px-4 pb-4 pt-2">
                            <!-- Exploitability & Impact Sub-scores -->
                            <div class="grid grid-cols-2 gap-3 mb-4">
                                <div
                                    v-if="cvssData.data.exploitability_score"
                                    class="bg-white rounded-lg p-3 border"
                                >
                                    <ScoreProgressBar
                                        :value="cvssData.data.exploitability_score"
                                        :max="3.9"
                                        label="Exploitability"
                                        color-scheme="severity"
                                        size="sm"
                                    />
                                </div>
                                <div
                                    v-if="cvssData.data.impact_score"
                                    class="bg-white rounded-lg p-3 border"
                                >
                                    <ScoreProgressBar
                                        :value="cvssData.data.impact_score"
                                        :max="6.1"
                                        label="Impact"
                                        color-scheme="severity"
                                        size="sm"
                                    />
                                </div>
                            </div>

                            <!-- CVSS Vector Components -->
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div
                                    v-if="cvssData.data.attack_vector"
                                    class="flex justify-between py-1"
                                >
                                    <span class="text-gray-500">Attack Vector</span>
                                    <span
                                        class="font-medium"
                                        :class="getCvssValueColor(cvssData.data.attack_vector)"
                                    >
                                        {{ cvssData.data.attack_vector }}
                                    </span>
                                </div>
                                <div
                                    v-if="cvssData.data.attack_complexity"
                                    class="flex justify-between py-1"
                                >
                                    <span class="text-gray-500">Attack Complexity</span>
                                    <span
                                        class="font-medium"
                                        :class="getCvssValueColor(cvssData.data.attack_complexity)"
                                    >
                                        {{ cvssData.data.attack_complexity }}
                                    </span>
                                </div>
                                <div
                                    v-if="cvssData.data.privileges_required"
                                    class="flex justify-between py-1"
                                >
                                    <span class="text-gray-500">Privileges Required</span>
                                    <span
                                        class="font-medium"
                                        :class="
                                            getCvssValueColor(cvssData.data.privileges_required)
                                        "
                                    >
                                        {{ cvssData.data.privileges_required }}
                                    </span>
                                </div>
                                <div
                                    v-if="cvssData.data.user_interaction"
                                    class="flex justify-between py-1"
                                >
                                    <span class="text-gray-500">User Interaction</span>
                                    <span
                                        class="font-medium"
                                        :class="getCvssValueColor(cvssData.data.user_interaction)"
                                    >
                                        {{ cvssData.data.user_interaction }}
                                    </span>
                                </div>
                                <div v-if="cvssData.data.scope" class="flex justify-between py-1">
                                    <span class="text-gray-500">Scope</span>
                                    <span
                                        class="font-medium"
                                        :class="getCvssValueColor(cvssData.data.scope)"
                                    >
                                        {{ cvssData.data.scope }}
                                    </span>
                                </div>
                                <div
                                    v-if="cvssData.data.confidentiality_impact"
                                    class="flex justify-between py-1"
                                >
                                    <span class="text-gray-500">Confidentiality</span>
                                    <span
                                        class="font-medium"
                                        :class="
                                            getCvssValueColor(cvssData.data.confidentiality_impact)
                                        "
                                    >
                                        {{ cvssData.data.confidentiality_impact }}
                                    </span>
                                </div>
                                <div
                                    v-if="cvssData.data.integrity_impact"
                                    class="flex justify-between py-1"
                                >
                                    <span class="text-gray-500">Integrity</span>
                                    <span
                                        class="font-medium"
                                        :class="getCvssValueColor(cvssData.data.integrity_impact)"
                                    >
                                        {{ cvssData.data.integrity_impact }}
                                    </span>
                                </div>
                                <div
                                    v-if="cvssData.data.availability_impact"
                                    class="flex justify-between py-1"
                                >
                                    <span class="text-gray-500">Availability</span>
                                    <span
                                        class="font-medium"
                                        :class="
                                            getCvssValueColor(cvssData.data.availability_impact)
                                        "
                                    >
                                        {{ cvssData.data.availability_impact }}
                                    </span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <!-- CWE Weaknesses Section -->
                    <AccordionItem
                        v-if="vulnerabilityDetails.weaknesses?.length"
                        value="weaknesses"
                        class="border rounded-lg overflow-hidden"
                    >
                        <AccordionTrigger
                            class="px-4 py-3 hover:no-underline hover:bg-gray-50 data-[state=open]:bg-gray-50"
                        >
                            <div class="flex items-center gap-2 text-sm font-medium">
                                <Icon icon="solar:bug-bold" class="w-4 h-4 text-gray-600" />
                                Weaknesses ({{ vulnerabilityDetails.weaknesses.length }})
                            </div>
                        </AccordionTrigger>
                        <AccordionContent class="px-4 pb-4 pt-2">
                            <div class="space-y-3">
                                <div
                                    v-for="weakness in vulnerabilityDetails.weaknesses"
                                    :key="weakness.id"
                                    class="bg-white rounded-lg p-3 border"
                                >
                                    <div class="flex items-start gap-2">
                                        <span
                                            class="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                                        >
                                            {{ weakness.id }}
                                        </span>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-gray-900">
                                                {{ weakness.name }}
                                            </p>
                                            <p
                                                v-if="weakness.description"
                                                class="text-xs text-gray-500 mt-1 line-clamp-2"
                                            >
                                                {{ weakness.description }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <!-- Affected Locations Section -->
                    <AccordionItem
                        v-if="vulnerabilityDetails.location?.length"
                        value="locations"
                        class="border rounded-lg overflow-hidden"
                    >
                        <AccordionTrigger
                            class="px-4 py-3 hover:no-underline hover:bg-gray-50 data-[state=open]:bg-gray-50"
                        >
                            <div class="flex items-center gap-2 text-sm font-medium">
                                <Icon
                                    icon="solar:folder-path-connect-bold"
                                    class="w-4 h-4 text-gray-600"
                                />
                                Affected Locations ({{ vulnerabilityDetails.location.length }})
                            </div>
                        </AccordionTrigger>
                        <AccordionContent class="px-4 pb-4 pt-2">
                            <div class="space-y-2 max-h-48 overflow-y-auto">
                                <div
                                    v-for="(path, index) in vulnerabilityDetails.location"
                                    :key="index"
                                    class="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border font-mono text-xs"
                                >
                                    <Icon
                                        icon="solar:document-text-linear"
                                        class="w-4 h-4 text-gray-400 flex-shrink-0"
                                    />
                                    <span class="truncate text-gray-700" :title="path">{{
                                        path
                                    }}</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <!-- References Section -->
                    <AccordionItem
                        v-if="vulnerabilityDetails.references?.length"
                        value="references"
                        class="border rounded-lg overflow-hidden"
                    >
                        <AccordionTrigger
                            class="px-4 py-3 hover:no-underline hover:bg-gray-50 data-[state=open]:bg-gray-50"
                        >
                            <div class="flex items-center gap-2 text-sm font-medium">
                                <Icon icon="solar:link-bold" class="w-4 h-4 text-gray-600" />
                                References ({{ vulnerabilityDetails.references.length }})
                            </div>
                        </AccordionTrigger>
                        <AccordionContent class="px-4 pb-4 pt-2">
                            <div class="space-y-1 max-h-48 overflow-y-auto">
                                <a
                                    v-for="(reference, index) in vulnerabilityDetails.references"
                                    :key="index"
                                    :href="reference.url"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Icon
                                        icon="solar:arrow-right-up-linear"
                                        class="w-3 h-3 flex-shrink-0"
                                    />
                                    <span class="truncate">{{ reference.url }}</span>
                                </a>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <!-- Description -->
                <div>
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <p class="text-sm text-gray-600 whitespace-pre-wrap">
                        {{ ticket.description }}
                    </p>
                </div>

                <!-- Remediation Notes -->
                <div v-if="ticket.remediation_notes">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Remediation Notes</h4>
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p class="text-sm text-blue-800 whitespace-pre-wrap">
                            {{ ticket.remediation_notes }}
                        </p>
                    </div>
                </div>

                <!-- Metadata -->
                <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                        <p class="text-xs text-gray-500">Project</p>
                        <p class="text-sm text-gray-900">{{ ticket.project_name }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Created By</p>
                        <p class="text-sm text-gray-900">{{ ticket.created_by_name }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Assigned To</p>
                        <p class="text-sm text-gray-900">
                            {{ ticket.assigned_to_name || 'Unassigned' }}
                        </p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Due Date</p>
                        <p class="text-sm text-gray-900">{{ formatDate(ticket.due_date) }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Created On</p>
                        <p class="text-sm text-gray-900">{{ formatDate(ticket.created_on) }}</p>
                    </div>
                    <div v-if="ticket.resolved_on">
                        <p class="text-xs text-gray-500">Resolved On</p>
                        <p class="text-sm text-green-600">{{ formatDate(ticket.resolved_on) }}</p>
                    </div>
                </div>

                <!-- Occurrence Stats (only shown if there are occurrences) -->
                <div
                    v-if="ticket.occurrence_count > 0"
                    class="flex items-center gap-4 pt-4 border-t border-gray-200"
                >
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:document-bold" class="w-4 h-4 text-gray-400" />
                        <span class="text-sm text-gray-600">
                            <strong>{{ ticket.occurrence_count }}</strong> total occurrences
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <Icon icon="solar:danger-triangle-bold" class="w-4 h-4 text-orange-400" />
                        <span class="text-sm text-gray-600">
                            <strong>{{ ticket.active_occurrence_count }}</strong> active
                        </span>
                    </div>
                </div>

                <!-- External Links -->
                <div v-if="ticket.external_links.length > 0" class="pt-4 border-t border-gray-200">
                    <h4 class="text-sm font-medium text-gray-700 mb-3">External Links</h4>
                    <div class="space-y-2">
                        <div
                            v-for="link in ticket.external_links"
                            :key="link.id"
                            class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                        >
                            <a
                                :href="link.external_url"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                            >
                                <div
                                    class="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200"
                                >
                                    <Icon
                                        :icon="
                                            ExternalProviderIcons[
                                                link.provider as ExternalTicketProvider
                                            ] || 'solar:link-bold'
                                        "
                                        class="w-4 h-4"
                                        :class="{
                                            'text-purple-600': link.provider === 'CLICKUP',
                                            'text-blue-600': link.provider === 'JIRA',
                                            'text-indigo-600': link.provider === 'LINEAR',
                                            'text-gray-400': ![
                                                'CLICKUP',
                                                'JIRA',
                                                'LINEAR'
                                            ].includes(link.provider)
                                        }"
                                    />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900">
                                        {{
                                            ExternalProviderLabels[
                                                link.provider as ExternalTicketProvider
                                            ] || link.provider
                                        }}
                                    </p>
                                    <p class="text-xs text-gray-500 truncate">
                                        {{ link.external_id }}
                                    </p>
                                </div>
                                <Icon
                                    icon="solar:arrow-right-up-linear"
                                    class="w-4 h-4 text-gray-400"
                                />
                            </a>
                            <!-- Sync from external button -->
                            <button
                                class="p-1.5 text-gray-400 hover:text-blue-500 rounded-md hover:bg-blue-50 transition-colors"
                                title="Sync status from external"
                                :disabled="isSyncingFromExternal === link.id"
                                @click.stop="syncFromExternalLink(link.id)"
                            >
                                <Icon
                                    v-if="isSyncingFromExternal === link.id"
                                    icon="solar:spinner-outline"
                                    class="w-4 h-4 animate-spin"
                                />
                                <Icon v-else icon="solar:refresh-linear" class="w-4 h-4" />
                            </button>
                            <!-- Unlink button -->
                            <button
                                class="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                                title="Unlink from external"
                                :disabled="isUnlinking === link.id"
                                @click.stop="unlinkFromProvider(link.id)"
                            >
                                <Icon
                                    v-if="isUnlinking === link.id"
                                    icon="solar:spinner-outline"
                                    class="w-4 h-4 animate-spin"
                                />
                                <Icon v-else icon="solar:link-broken-linear" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Actions -->
            <div
                class="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3"
            >
                <Button variant="outline" @click="close">Close</Button>
                <div class="flex items-center gap-2">
                    <!-- Sync Button -->
                    <DropdownMenu v-if="availableSyncProviders.length > 0">
                        <DropdownMenuTrigger as-child>
                            <Button variant="outline" :disabled="isSyncing">
                                <Icon
                                    v-if="isSyncing"
                                    icon="solar:spinner-outline"
                                    class="w-4 h-4 mr-2 animate-spin"
                                />
                                <Icon v-else icon="solar:link-linear" class="w-4 h-4 mr-2" />
                                Sync
                                <Icon icon="solar:alt-arrow-down-linear" class="w-3 h-3 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                v-for="integration in availableSyncProviders"
                                :key="integration.provider"
                                @click="
                                    syncToProvider(integration.provider as ExternalTicketProvider)
                                "
                            >
                                <Icon
                                    :icon="
                                        ExternalProviderIcons[
                                            integration.provider as ExternalTicketProvider
                                        ]
                                    "
                                    class="w-4 h-4 mr-2"
                                />
                                Sync to
                                {{
                                    ExternalProviderLabels[
                                        integration.provider as ExternalTicketProvider
                                    ]
                                }}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <!-- Start Progress (shown for OPEN tickets) -->
                    <Button
                        v-if="ticket.status === TicketStatus.OPEN"
                        variant="outline"
                        class="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                        :disabled="isUpdatingStatus"
                        @click="updateStatus(TicketStatus.IN_PROGRESS)"
                    >
                        <Icon
                            v-if="isUpdatingStatus"
                            icon="solar:spinner-outline"
                            class="w-4 h-4 mr-2 animate-spin"
                        />
                        <Icon v-else icon="solar:play-bold" class="w-4 h-4 mr-2" />
                        Start Progress
                    </Button>

                    <!-- Mark Resolved (shown for IN_PROGRESS tickets) -->
                    <Button
                        v-if="ticket.status === TicketStatus.IN_PROGRESS"
                        class="bg-green-600 hover:bg-green-700"
                        :disabled="isUpdatingStatus"
                        @click="updateStatus(TicketStatus.RESOLVED)"
                    >
                        <Icon
                            v-if="isUpdatingStatus"
                            icon="solar:spinner-outline"
                            class="w-4 h-4 mr-2 animate-spin"
                        />
                        <Icon v-else icon="solar:check-circle-bold" class="w-4 h-4 mr-2" />
                        Mark Resolved
                    </Button>

                    <!-- Won't Fix (shown for OPEN or IN_PROGRESS tickets) -->
                    <Button
                        v-if="
                            ticket.status === TicketStatus.OPEN ||
                            ticket.status === TicketStatus.IN_PROGRESS
                        "
                        variant="outline"
                        class="text-gray-600 border-gray-300 hover:bg-gray-50"
                        :disabled="isUpdatingStatus"
                        @click="updateStatus(TicketStatus.WONT_FIX)"
                    >
                        <Icon
                            v-if="isUpdatingStatus"
                            icon="solar:spinner-outline"
                            class="w-4 h-4 mr-2 animate-spin"
                        />
                        <Icon v-else icon="solar:close-circle-bold" class="w-4 h-4 mr-2" />
                        Won't Fix
                    </Button>

                    <!-- Close (shown for RESOLVED tickets) -->
                    <Button
                        v-if="ticket.status === TicketStatus.RESOLVED"
                        variant="outline"
                        class="text-blue-600 border-blue-600 hover:bg-blue-50"
                        :disabled="isUpdatingStatus"
                        @click="updateStatus(TicketStatus.CLOSED)"
                    >
                        <Icon
                            v-if="isUpdatingStatus"
                            icon="solar:spinner-outline"
                            class="w-4 h-4 mr-2 animate-spin"
                        />
                        <Icon v-else icon="solar:archive-bold" class="w-4 h-4 mr-2" />
                        Close
                    </Button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
