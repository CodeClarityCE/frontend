<script setup lang="ts">
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue';
import ErrorComponent from '@/base_components/utilities/ErrorComponent.vue';
import type { AnalysisStats } from '@/codeclarity_components/results/stats.entity';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/ui/card';
import { Icon } from '@iconify/vue';
import { defineAsyncComponent, ref, watch } from 'vue';

const SecurityImpact = defineAsyncComponent({
    loader: () => import('./components/SecurityImpact.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const VulnerabilitiesInfo = defineAsyncComponent({
    loader: () => import('./components/VulnerabilitiesInfo.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

const OwaspTopTen = defineAsyncComponent({
    loader: () => import('./components/OwaspTopTen.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

export interface Props {
    analysisID?: string;
    projectID?: string;
    stats: AnalysisStats;
}
const props = withDefaults(defineProps<Props>(), {
    projectID: '',
    analysisID: ''
});

const owaspTopTotalCount = ref(0);

function init() {
    calculateOwaspTopTotalCount();
}

init();

watch(props.stats, () => {
    init();
});

function calculateOwaspTopTotalCount() {
    const count =
        props.stats.number_of_owasp_top_10_2021_a1 +
        props.stats.number_of_owasp_top_10_2021_a2 +
        props.stats.number_of_owasp_top_10_2021_a3 +
        props.stats.number_of_owasp_top_10_2021_a4 +
        props.stats.number_of_owasp_top_10_2021_a5 +
        props.stats.number_of_owasp_top_10_2021_a6 +
        props.stats.number_of_owasp_top_10_2021_a7 +
        props.stats.number_of_owasp_top_10_2021_a8 +
        props.stats.number_of_owasp_top_10_2021_a9 +
        props.stats.number_of_owasp_top_10_2021_a10;

    owaspTopTotalCount.value = count;
}
</script>

<template>
    <div class="space-y-6">
        <!-- Enhanced Vulnerability Analysis Section -->
        <div class="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-6 border">
            <div class="flex items-center gap-3 mb-6">
                <div class="bg-slate-600 p-3 rounded-xl">
                    <Icon icon="tabler:chart-bar" class="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 class="text-xl font-bold text-slate-900">
                        Detailed Vulnerability Analysis
                    </h2>
                    <p class="text-sm text-slate-600">
                        In-depth breakdown of security vulnerabilities and their impact
                    </p>
                </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-3">
                <!-- Vulnerability Distribution Card -->
                <Card class="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
                    <CardHeader class="pb-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <CardTitle
                                    class="text-lg font-bold text-blue-900 flex items-center gap-2"
                                >
                                    <Icon icon="tabler:chart-donut" class="w-5 h-5" />
                                    {{ stats.number_of_vulnerabilities }} Vulnerabilities
                                </CardTitle>
                                <p class="text-sm text-blue-700 mt-1">
                                    Severity distribution breakdown
                                </p>
                            </div>
                            <div class="bg-blue-500 p-2 rounded-lg">
                                <Icon icon="tabler:bug" class="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent class="flex items-center justify-center flex-grow min-h-[200px]">
                        <VulnerabilitiesInfo :stats="stats" />
                    </CardContent>
                </Card>

                <!-- OWASP Top 10 Card -->
                <Card class="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader class="pb-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <CardTitle
                                    class="text-lg font-bold text-purple-900 flex items-center gap-2"
                                >
                                    <Icon icon="simple-icons:owasp" class="w-5 h-5" />
                                    OWASP Top 10
                                </CardTitle>
                                <p class="text-sm text-purple-700 mt-1">
                                    {{ owaspTopTotalCount }} categorized vulnerabilities
                                </p>
                            </div>
                            <div class="bg-purple-500 p-2 rounded-lg">
                                <Icon icon="tabler:list-check" class="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent class="flex items-center justify-center flex-grow min-h-[200px]">
                        <OwaspTopTen :stats="stats" />
                    </CardContent>
                </Card>

                <!-- Security Impact Card -->
                <Card class="bg-gradient-to-br from-red-50 to-rose-100 border-red-200">
                    <CardHeader class="pb-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <CardTitle
                                    class="text-lg font-bold text-red-900 flex items-center gap-2"
                                >
                                    <Icon icon="tabler:radar-2" class="w-5 h-5" />
                                    Security Impact
                                </CardTitle>
                                <p class="text-sm text-red-700 mt-1">CIA triad impact assessment</p>
                            </div>
                            <div class="bg-red-500 p-2 rounded-lg">
                                <Icon icon="tabler:shield-exclamation" class="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent class="flex items-center justify-center flex-grow min-h-[200px]">
                        <SecurityImpact :stats="stats" />
                    </CardContent>
                </Card>
            </div>

            <!-- Additional Analysis Metrics -->
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                <!-- Direct vs Transitive Vulnerabilities -->
                <div class="bg-white/60 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="bg-indigo-500 p-2 rounded-lg">
                            <Icon icon="tabler:git-branch" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 text-sm">
                                Vulnerability Sources
                            </h4>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">Direct Dependencies</span>
                            <span class="font-semibold text-indigo-600">{{
                                stats.number_of_direct_vulnerabilities ?? 0
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">Transitive Dependencies</span>
                            <span class="font-semibold text-blue-600">{{
                                stats.number_of_transitive_vulnerabilities ?? 0
                            }}</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                            {{
                                Math.round(
                                    ((stats.number_of_transitive_vulnerabilities ?? 0) /
                                        Math.max(
                                            (stats.number_of_direct_vulnerabilities ?? 0) +
                                                (stats.number_of_transitive_vulnerabilities ?? 0),
                                            1
                                        )) *
                                        100
                                )
                            }}% from transitive deps
                        </div>
                    </div>
                </div>

                <!-- CIA Impact Analysis -->
                <div class="bg-white/60 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="bg-purple-500 p-2 rounded-lg">
                            <Icon icon="tabler:shield-half" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 text-sm">CIA Impact Analysis</h4>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">Confidentiality</span>
                            <span class="font-semibold text-purple-600">{{
                                stats.mean_confidentiality_impact?.toFixed(1) ?? '0.0'
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">Integrity</span>
                            <span class="font-semibold text-purple-600">{{
                                stats.mean_integrity_impact?.toFixed(1) ?? '0.0'
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">Availability</span>
                            <span class="font-semibold text-purple-600">{{
                                stats.mean_availability_impact?.toFixed(1) ?? '0.0'
                            }}</span>
                        </div>
                    </div>
                </div>

                <!-- OWASP Coverage -->
                <div class="bg-white/60 rounded-lg p-4 border border-gray-200">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="bg-emerald-500 p-2 rounded-lg">
                            <Icon icon="simple-icons:owasp" class="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-900 text-sm">OWASP Coverage</h4>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">Categorized</span>
                            <span class="font-semibold text-emerald-600">{{
                                owaspTopTotalCount
                            }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-gray-600">Uncategorized</span>
                            <span class="font-semibold text-gray-600">{{
                                (stats.number_of_vulnerabilities ?? 0) - owaspTopTotalCount
                            }}</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                            {{
                                Math.round(
                                    (owaspTopTotalCount /
                                        Math.max(stats.number_of_vulnerabilities ?? 1, 1)) *
                                        100
                                )
                            }}% coverage
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
