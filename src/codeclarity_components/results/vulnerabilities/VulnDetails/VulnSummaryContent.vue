<script setup lang="ts">
import type { VulnerabilityDetails } from '@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails';
import { formatDate } from '@/utils/dateUtils';
import { Icon } from '@iconify/vue';
import type CenteredModalVue from '@/base_components/ui/modals/CenteredModal.vue';
import BubbleComponent from '@/base_components/data-display/bubbles/BubbleComponent.vue';
import InfoMarkdown from '@/base_components/ui/InfoMarkdown.vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';

defineProps<{
    finding: VulnerabilityDetails;
    readMeModalRef: typeof CenteredModalVue;
    readme: string;
    activeView: string;
}>();
</script>

<template>
    <!--------------------------------------------------------------------------->
    <!--                      Vulnerability summary content                    -->
    <!--------------------------------------------------------------------------->
    <section class="bg-white shadow-md rounded-lg p-6">
        <div class="grid grid-cols-2 gap-6">
            <!--------------------------------------------------------------------------->
            <!--                         Vulnerability description                     -->
            <!--------------------------------------------------------------------------->
            <div>
                <div class="flex flex-col gap-5">
                    <h2 class="font-black text-xl text-gray-800">
                        <span class="text-primary text-3xl">V</span>ulnerability Information
                    </h2>
                    <div style="position: relative">
                        <div class="w-full">
                            <div class="flex flex-col gap-2 mb-5 max-w-96 w-full">
                                <div>
                                    <span class="font-normal text-gray-600">Published:</span>
                                    {{ formatDate(finding.vulnerability_info.published, 'LL') }}
                                </div>
                                <div>
                                    <div>
                                        <span class="font-normal text-gray-600"
                                            >Last modified:</span
                                        >
                                        {{
                                            formatDate(
                                                finding.vulnerability_info.last_modified,
                                                'LL'
                                            )
                                        }}
                                    </div>
                                </div>
                                <div class="flex flex-row items-center gap-2">
                                    <div class="font-normal text-gray-600">Aliases:</div>
                                    <div class="flex gap-2 text-sm">
                                        <div
                                            v-for="alias in finding.vulnerability_info.aliases"
                                            :key="alias"
                                        >
                                            <BubbleComponent :slim="true">
                                                <template #content>{{ alias }}</template>
                                            </BubbleComponent>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex flex-row items-center gap-2">
                                        <div class="font-normal text-gray-600">Sources:</div>
                                        <div class="flex gap-2 text-sm">
                                            <BubbleComponent :slim="true">
                                                <template #content>
                                                    <a
                                                        :href="
                                                            'https://vulnerability.circl.lu/vuln/' +
                                                            finding.vulnerability_info
                                                                .vulnerability_id
                                                        "
                                                        target="_blank"
                                                        >Vulnerability Lookup</a
                                                    >
                                                </template>
                                            </BubbleComponent>
                                            <div
                                                v-for="source in finding.vulnerability_info.sources"
                                                :key="source.name"
                                            >
                                                <div v-if="source.name == 'NVD'">
                                                    <BubbleComponent :slim="true">
                                                        <template #content>
                                                            <a
                                                                :href="source.vuln_url"
                                                                target="_blank"
                                                                >NVD</a
                                                            >
                                                        </template>
                                                    </BubbleComponent>
                                                </div>
                                                <div v-if="source.name == 'OSV'">
                                                    <BubbleComponent :slim="true">
                                                        <template #content>
                                                            <a
                                                                :href="source.vuln_url"
                                                                target="_blank"
                                                                >OSV</a
                                                            >
                                                        </template>
                                                    </BubbleComponent>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        v-if="finding.vulnerability_info.sources.length < 2"
                                        class="text-severityMedium flex gap-1 items-center"
                                    >
                                        <Icon icon="tabler:alert-triangle-filled"></Icon>
                                        NVD and OSV do not agree
                                    </div>
                                </div>
                            </div>
                            <div class="text-sm font-normal">Description</div>
                            <div class="overflow-y-auto">
                                <InfoMarkdown
                                    class="w-full"
                                    :markdown="finding.vulnerability_info.description"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!--------------------------------------------------------------------------->
            <!--                        Vulnerability weakness info                    -->
            <!--------------------------------------------------------------------------->
            <div>
                <div
                    v-if="
                        (!finding.weaknesses || finding.weaknesses.length == 0) &&
                        !finding.owasp_top_10
                    "
                >
                    <div class="flex flex-col gap-5">
                        <h2 class="text-xl">
                            <span class="text-primary text-3xl">W</span>eakness information
                        </h2>
                        <div>
                            No information on weaknesess. If the vulnerability has only recently
                            been published, then information on weaknesses may follow soon.
                        </div>
                    </div>
                </div>

                <div v-else class="flex">
                    <div class="flex flex-col gap-5">
                        <h2 class="font-black text-xl">
                            <span class="text-primary text-3xl">W</span>eakness information
                        </h2>
                        <div class="relative w-full">
                            <div class="mb-4">
                                The following aims to provide details on the type of flaw within the
                                dependency that enables the exploitation.
                            </div>
                            <div class="flex flex-col gap-8">
                                <div v-if="finding.owasp_top_10">
                                    <div class="flex flex-col gap-y-2">
                                        <div class="flex gap-2 items-center font-black">
                                            <Icon :icon="'simple-icons:owasp'"></Icon>
                                            <div class="flex items-center gap-1">
                                                Owasp Top 10 2021
                                                <Icon
                                                    :icon="'material-symbols:help-outline'"
                                                ></Icon>
                                            </div>
                                        </div>
                                        <div class="font-normal">
                                            {{ finding.owasp_top_10.name }}
                                        </div>
                                        <div>
                                            {{ finding.owasp_top_10.description }}
                                        </div>
                                        <div class="mt-2">
                                            <a
                                                class="flex items-center gap-1 text-primary"
                                                title="View owasp top 10 details (opens a owasp.org page)"
                                                :href="`https://owasp.org/Top10/${finding.owasp_top_10.name
                                                    .replace(': ', '_2021-')
                                                    .replace(' ', '_')}`"
                                                target="_blank"
                                            >
                                                <Icon :icon="'ic:outline-open-in-new'"></Icon>
                                                Owasp Top 10 Category Details
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="finding.weaknesses.length > 0">
                                    <div class="flex flex-col gap-4">
                                        <div class="flex flex-row items-center gap-2 font-black">
                                            Common Weakness Enumeration (CWE)
                                            <Icon :icon="'material-symbols:help-outline'"></Icon>
                                        </div>
                                        <div
                                            v-for="weakness in finding.weaknesses"
                                            :key="weakness.id"
                                            class="flex flex-col gap-2"
                                        >
                                            <div class="flex flex-col gap-y-2">
                                                <div class="font-normal">
                                                    {{ weakness.id }} -
                                                    {{ weakness.name }}
                                                </div>
                                                <div>
                                                    {{ weakness.description }}
                                                </div>
                                            </div>

                                            <div>
                                                <div
                                                    v-if="
                                                        weakness.id in
                                                            finding.common_consequences &&
                                                        finding.common_consequences[weakness.id]
                                                            .length > 0
                                                    "
                                                    class="mt-4"
                                                >
                                                    <span>Potential Consequences: </span>
                                                    <span
                                                        >{{
                                                            finding.common_consequences[weakness.id]
                                                                .map((conseq) =>
                                                                    conseq.impact.join(', ')
                                                                )
                                                                .join('; ')
                                                        }}.</span
                                                    >
                                                </div>
                                            </div>

                                            <div class="mt-2">
                                                <a
                                                    class="flex flex-row items-center gap-2 text-primary"
                                                    title="View cwe details (opens a mitre.org page)"
                                                    :href="`https://cwe.mitre.org/data/definitions/${weakness.id.replace(
                                                        'CWE-',
                                                        ''
                                                    )}`"
                                                    target="_blank"
                                                >
                                                    <Icon :icon="'ic:outline-open-in-new'"></Icon>
                                                    CWE Details
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!--------------------------------------------------------------------------->
            <!--                             Vulnerability Info                        -->
            <!--------------------------------------------------------------------------->
            <div class="flex flex-col gap-5">
                <h2 class="font-black text-xl">
                    <span class="text-primary text-3xl">D</span>ependency
                </h2>
                <div class="relative">
                    <div class="flex flex-col gap-3">
                        <div class="flex items-end gap-1">
                            <div class="text-xl font-bold">
                                <span
                                    >{{ finding.dependency_info?.name }}@{{
                                        finding.dependency_info?.version
                                    }}</span
                                >
                            </div>
                            <div class="text-[#6c6b6b]">
                                (published on
                                {{ formatDate(finding.vulnerability_info.published, 'LL') }})
                            </div>
                        </div>
                        <div>
                            {{ finding.dependency_info?.description }}
                        </div>
                        <div
                            v-if="
                                finding.other.package_manager == 'NPM' ||
                                finding.other.package_manager == 'YARN'
                            "
                            class="flex gap-6"
                        >
                            <div>
                                <a
                                    :href="`https://www.npmjs.com/package/${finding.dependency_info?.name}`"
                                    title="opens the npm package page (in a new tab)"
                                    target="_blank"
                                >
                                    <Icon :icon="'iconoir:npm'" class="text-5xl"></Icon>
                                </a>
                            </div>
                            <div>
                                <a
                                    :href="`https://www.yarnpkg.com/package/${finding.dependency_info?.name}`"
                                    title="opens the yarn package page (in a new tab)"
                                    target="_blank"
                                >
                                    <Icon :icon="'devicon:yarn-wordmark'" class="text-5xl"></Icon>
                                </a>
                            </div>
                            <div v-if="finding.dependency_info?.github_link">
                                <a
                                    :href="
                                        'https://' +
                                        finding.dependency_info?.github_link.repo_full_path
                                    "
                                    title="opens the github repo of the dependency (in a new tab)"
                                    target="_blank"
                                >
                                    <Icon :icon="'devicon:github-wordmark'" class="text-5xl"></Icon>
                                </a>
                            </div>
                            <div v-if="finding.dependency_info?.issues_link">
                                <a
                                    :href="'https://' + finding.dependency_info?.issues_link"
                                    title="opens the github issues of the dependency (in a new tab)"
                                    target="_blank"
                                    class="flex gap-1"
                                >
                                    <Icon :icon="'devicon:github-wordmark'" class="text-5xl"></Icon>
                                    Issues
                                </a>
                            </div>
                            <div v-if="finding.dependency_info?.homepage">
                                <a
                                    :href="finding.dependency_info?.homepage"
                                    title="opens the website of the dependency (in a new tab)"
                                    target="_blank"
                                    class="flex gap-1"
                                >
                                    <Icon :icon="'ph:link'" class="text-5xl"></Icon> Website
                                </a>
                            </div>
                        </div>
                        <div v-if="finding.dependency_info">
                            <div
                                v-if="finding.dependency_info.keywords.length > 0"
                                class="flex gap-2 items-center"
                            >
                                <div>Tags</div>
                                <div class="flex flex-wrap gap-1">
                                    <div
                                        v-for="keyword in finding.dependency_info?.keywords"
                                        :key="keyword"
                                    >
                                        <div
                                            v-if="
                                                finding.other.package_manager == 'NPM' ||
                                                finding.other.package_manager == 'YARN'
                                            "
                                        >
                                            <BubbleComponent :slim="true">
                                                <template #content>
                                                    <a
                                                        title="opens npm with applied keyword search (in a new tab)"
                                                        :href="
                                                            'https://www.npmjs.com/search?q=keywords:' +
                                                            keyword
                                                        "
                                                        target="_blank"
                                                        >#{{ keyword }}</a
                                                    >
                                                </template>
                                            </BubbleComponent>
                                        </div>
                                        <BubbleComponent v-else>
                                            <template #content>#{{ keyword }}</template>
                                        </BubbleComponent>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Card v-if="readme != ''">
                            <CardHeader>
                                <CardTitle class="flex gap-2 items-center">
                                    <Icon :icon="'tabler:markdown'"></Icon>
                                    <div>Readme</div>
                                </CardTitle>
                                <CardDescription>
                                    <Icon
                                        :icon="'bi:box-arrow-up-right'"
                                        class="cursor-pointer"
                                        @click="readMeModalRef.toggle()"
                                    ></Icon>
                                </CardDescription>
                            </CardHeader>
                            <CardContent class="content max-h-60 overflow-y-auto relative">
                                <InfoMarkdown class="w-full" :markdown="readme"></InfoMarkdown>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';
@use '@/assets/common/finding-patch.scss';
</style>
