<script lang="ts" setup>
import SeverityBubble from '@/base_components/bubbles/SeverityBubble.vue';
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import Badge from '@/shadcn/ui/badge/Badge.vue';
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
    <section>
        <h2 class="font-black text-xl">
            <span class="text-primary text-3xl">D</span>ependency Health
        </h2>

        <div class="flex flex-col gap-5">
            <!-- <div v-if="dependency.deprecated == true" class="mt-2 border-l-4 border-red pl-5">
                <div class="text-destructive font-black">Deprecated</div>
                <div class="mt-2 flex items-center gap-1">
                    <b>Author message</b>: {{ dependency.deprecated_message }}
                </div>
            </div> -->
            <div
                v-if="
                    moment(dependency.lastest_release_date).diff(
                        moment(dependency.release_date),
                        'days'
                    ) > 182
                "
                class="mt-2 border-l-4 border-severityMedium pl-5"
            >
                <div class="text-severityMedium font-black">Outdated</div>
                <div class="flex flex-col">
                    <!-- {{ dependency.outdated_message }}  -->
                    <span>
                        There is a difference of
                        {{
                            moment(dependency.lastest_release_date).diff(
                                moment(dependency.release_date),
                                'days'
                            )
                        }}
                        days compared to the latest release.
                    </span>
                    <span> We suggest that you upgrade your version of{{ dependency.name }}. </span>
                </div>
            </div>
            <div v-if="dependency.license == ''" class="mt-2 border-l-4 border-blue-500 pl-5">
                <div class="text-blue-500 font-black">Unlicensed</div>
                <div class="mt-2">
                    The dependency appears to be unlicensed. Authors of unlicensed dependencies hold
                    exclusive rights to their use, redistribution and modification.
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-5 mt-6" v-if="dependency.vulnerabilities.length > 0">
            <div class="mt-2 border-l-4 border-severityHigh pl-5">
                <div class="text-severityHigh font-black">Vulnerable</div>
                <div class="mt-2">
                    <div v-for="vulnerability in dependency.vulnerabilities" :key="vulnerability">
                        <Badge variant="secondary">
                            {{ vulnerability }}
                        </Badge>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-1">
                <SeverityBubble
                    :critical="true"
                    :deactivated="dependency.severity_dist.critical == 0"
                >
                    <template #content>
                        {{ dependency.severity_dist.critical }}
                    </template>
                </SeverityBubble>
                <SeverityBubble :high="true" :deactivated="dependency.severity_dist.high == 0">
                    <template #content>
                        {{ dependency.severity_dist.high }}
                    </template>
                </SeverityBubble>
                <SeverityBubble :medium="true" :deactivated="dependency.severity_dist.medium == 0">
                    <template #content>
                        {{ dependency.severity_dist.medium }}
                    </template>
                </SeverityBubble>
                <SeverityBubble :low="true" :deactivated="dependency.severity_dist.low == 0">
                    <template #content>
                        {{ dependency.severity_dist.low }}
                    </template>
                </SeverityBubble>
                <SeverityBubble :none="true" :deactivated="dependency.severity_dist.none == 0">
                    <template #content>
                        {{ dependency.severity_dist.none }}
                    </template>
                </SeverityBubble>
            </div>
        </div>
    </section>
</template>
