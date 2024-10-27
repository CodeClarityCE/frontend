<template>
    <section>
        <h2 class="font-black"><span class="text-primary text-3xl">D</span>ependency Health</h2>

        <div class="flex flex-col gap-5">
            <!-- <div v-if="dependency.deprecated == true" class="mt-2 border-l-4 border-red pl-5">
                <div class="text-destructive font-black">Deprecated</div>
                <div class="mt-2 flex items-center gap-1">
                    <b>Author message</b>: {{ dependency.deprecated_message }}
                </div>
            </div> -->
            <!-- <div v-if="dependency.outdated == true" class="mt-2 border-l-4 border-yellow pl-5">
                <div class="text-yellow font-black">Outdated</div>
                <div class="mt-2 flex items-center gap-1">
                    {{ dependency.outdated_message }} We suggest that you upgrade your version of
                    {{ dependency.name }}.
                </div>
            </div> -->
            <div v-if="dependency.license == ''" class="mt-2 border-l-4 border-blue-500 pl-5">
                <div class="text-blue-500 font-black">Unlicensed</div>
                <div class="mt-2">
                    The dependency appears to be unlicensed. Authors of unlicensed dependencies hold
                    exclusive rights to their use, redistribution and modification.
                </div>
            </div>
        </div>

        <!-- <div class="flex flex-col gap-5 mt-6" v-if="dependency.vulnerable">
            <div v-if="dependency.unlicensed == true" class="mt-2 border-l-4 border-red pl-5">
                <div class="text-destructive font-black">Vulnerable</div>
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
        </div> -->
    </section>
</template>

<script lang="ts" setup>
import SeverityBubble from '@/common_components/bubbles/SeverityBubble.vue';
import { DependencyDetails } from '@/repositories/types/entities/SbomDetails';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import type { PropType } from 'vue';

defineProps({
    dependency: {
        type: Object as PropType<DependencyDetails>,
        required: true
    }
});
</script>
