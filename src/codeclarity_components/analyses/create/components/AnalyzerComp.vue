<template>
    <div class="flex flex-row items-center text-sm">
        <div class="analyzer-outer-icon">
            <Icon :icon="'devicon:javascript'" class="text-5xl relative z-10"></Icon>
        </div>

        <div class="rounded pl-6 flex flex-col gap-1">
            <div class="text-2xl font-extrabold text-grayTitle">
                <span v-if="analyzerData.name == 'JS'">SCA Analyzer for Javascript</span>
                <span v-else>{{ analyzerData.name }}</span>
            </div>
            <div>
                <span>{{ analyzerData.description }}</span>
                <!-- <span class="cursor-pointer" @click="centered_modal_ref.toggle()">What does it do?</span> -->
                <!-- <CenteredModal ref="centered_modal_ref">
                    <template #title> Software Composition Analyzer for JavaScript </template>
                    <template #subtitle> What does this analyzer do? </template>
                    <template #content>
                        <div class="flex flex-col gap-12">
                            <div class="flex flex-row items-center justify-between">
                                <div style="font-weight: 500; color: #737373; max-width: 70%">
                                    Full insight into dependency composition
                                    <ul style="font-size: 0.9em">
                                        <li>Produces a full Software Bill Of Materials</li>
                                        <li>
                                            Package managed and non-package managed dependencies
                                        </li>
                                        <li>
                                            Provides visualizations of the SBOM and search
                                            capabilities
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <Icon
                                        class="text-5xl text-gray-400"
                                        :icon="'clarity:blocks-group-solid-badged'"
                                    ></Icon>
                                </div>
                            </div>
                            <div class="flex flex-row items-center justify-between">
                                <div>
                                    <Icon
                                        class="text-5xl text-gray-400"
                                        :icon="'clarity:blocks-group-solid-alerted'"
                                    ></Icon>
                                </div>
                                <div style="font-weight: 500; color: #737373; max-width: 70%">
                                    Full insight into vulnerabilities residing within application
                                    dependencies
                                    <ul style="font-size: 0.9em">
                                        <li>Overview of vulnerabilities and severities</li>
                                        <li>
                                            Details on vulnerabilities such as attack vectors,
                                            attack complexity, availability impact, ...
                                        </li>
                                        <li>
                                            Insight into where vulnerabilities reside within the
                                            dependency tree
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div
                                style="
                                    display: flex;
                                    flex-direction: row;
                                    align-items: center;
                                    justify-content: space-between;
                                "
                            >
                                <div style="font-weight: 500; color: #737373; max-width: 70%">
                                    Actionable remediation for vulnerabilities
                                    <ul style="font-size: 0.9em">
                                        <li>Automated dependency tree patch generation</li>
                                        <li>
                                            Patches are verified to remedy the vulnerabilities and
                                            to prevent introducing other vulnerabilities
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div
                                style="
                                    display: flex;
                                    flex-direction: row;
                                    align-items: center;
                                    justify-content: space-between;
                                "
                            >
                                <div></div>
                                <div style="font-weight: 500; color: #737373; max-width: 70%">
                                    Complete visibility into the licenses used by the dependencies
                                    <ul style="font-size: 0.9em">
                                        <li>Full insight into what licenses are used and where</li>
                                        <li>
                                            Details on licenses, such as their permissions,
                                            obligations, and conditions they carry for their use
                                        </li>
                                        <li>
                                            Avoid legal risks by disallowing licenses in your
                                            projects
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template #buttons>
                        <BlueButton @click="centered_modal_ref.toggle()">
                            <template #text>Close</template>
                        </BlueButton>
                    </template>
                </CenteredModal> -->
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { Icon } from '@iconify/vue/dist/iconify.js';

export interface Props {
    analyzerData: any;
}

withDefaults(defineProps<Props>(), {
    analyzerData: null
});
</script>
