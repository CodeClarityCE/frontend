<template>
    <!--------------------------------------------------------------------------->
    <!--                      Vulnerability summary content                    -->
    <!--------------------------------------------------------------------------->
    <section class="summary-content">
        <div class="vuln-details-wrapper">
            <!--------------------------------------------------------------------------->
            <!--                         Vulnerability description                     -->
            <!--------------------------------------------------------------------------->
            <div>
                <div class="flex flex-col gap-5">
                    <h2 class="font-black">
                        <span style="color: teal; font-size: 1.9em">V</span>ulnerability Information
                    </h2>
                    <div style="position: relative">
                        <div class="w-full">
                            <div class="flex flex-col gap-2 mb-5 max-w-96 w-full">
                                <div>
                                    <span class="font-normal">Published:</span>
                                    {{ moment(finding.vulnerability_info.published).format('LL') }}
                                </div>
                                <div>
                                    <div>
                                        <span class="font-normal">Last modified:</span>
                                        {{
                                            moment(finding.vulnerability_info.last_modified).format(
                                                'LL'
                                            )
                                        }}
                                    </div>
                                </div>
                                <div class="flex flex-row items-center gap-2">
                                    <div class="font-normal">Aliases:</div>
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
                                <div class="flex flex-row items-center gap-2">
                                    <div class="font-normal">Sources:</div>
                                    <div class="flex gap-2 text-sm">
                                        <div
                                            v-for="source in finding.vulnerability_info.sources"
                                            :key="source.name"
                                        >
                                            <div v-if="source.name == 'NVD'">
                                                <BubbleComponent :slim="true">
                                                    <template #content>
                                                        <a :href="source.vuln_url" target="_blank"
                                                            >NVD</a
                                                        >
                                                    </template>
                                                </BubbleComponent>
                                            </div>
                                            <div v-if="source.name == 'OSV'">
                                                <BubbleComponent :slim="true">
                                                    <template #content>
                                                        <a :href="source.vuln_url" target="_blank"
                                                            >OSV</a
                                                        >
                                                    </template>
                                                </BubbleComponent>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-row items-center gap-2">
                                    <div class="font-normal">Status:</div>
                                    <div class="flex gap-2 text-sm">
                                        <div>
                                            <!-- <BubbleComponent
                                                v-if="
                                                    finding.patch &&
                                                    finding.patch.patch_type == 'NONE'
                                                "
                                                :not-patchable="true"
                                            >
                                                <template #content>
                                                    <Icon
                                                        :icon="'material-symbols:crisis-alert'"
                                                    ></Icon>
                                                    Not patchable
                                                </template>
                                            </BubbleComponent>
                                            <BubbleComponent
                                                v-if="
                                                    finding.patch &&
                                                    finding.patch.patch_type == 'PARTIAL'
                                                "
                                                :partially-patchable="true"
                                            >
                                                <template #content>
                                                    <Icon
                                                        :icon="'material-symbols:crisis-alert'"
                                                    ></Icon>
                                                    Partially patchable
                                                </template>
                                            </BubbleComponent>
                                            <BubbleComponent
                                                v-if="
                                                    finding.patch &&
                                                    finding.patch.patch_type == 'FULL'
                                                "
                                                :patchable="true"
                                            >
                                                <template #content> Patchable </template>
                                            </BubbleComponent> -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="text-sm font-normal">Description</div>
                            <div class="overflow-y-auto">
                                <InfoMarkdown
                                    class="w-full"
                                    :markdown="finding.vulnerability_info.description"
                                ></InfoMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="self-stretch bg-[#e8e8e8]"></div>

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
                        <h2 style="font-family: lato; font-weight: 900">
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
                        <h2 class="font-black">
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
                <h2 class="font-black"><span class="text-primary text-3xl">D</span>ependency</h2>
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
                                {{ moment(finding.dependency_info?.published).format('LL') }})
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
                        <BorderCard v-if="readme != ''" :title="true" class="mt-5">
                            <template #title>
                                <div class="title flex items-center gap-2 justify-between">
                                    <div class="flex gap-2 items-center">
                                        <Icon :icon="'tabler:markdown'"></Icon>
                                        <div>Readme</div>
                                    </div>
                                    <div>
                                        <Icon
                                            :icon="'bi:box-arrow-up-right'"
                                            class="cursor-pointer"
                                            @click="read_me_modal_ref.toggle()"
                                        ></Icon>
                                    </div>
                                </div>
                            </template>
                            <template #content>
                                <div class="content max-h-60 overflow-y-auto relative">
                                    <InfoMarkdown class="w-full" :markdown="readme"></InfoMarkdown>
                                </div>
                            </template>
                        </BorderCard>
                    </div>
                </div>
            </div>

            <div style="align-self: stretch; background-color: #e8e8e8"></div>

            <!--------------------------------------------------------------------------->
            <!--                         Vulnerability patch summary                   -->
            <!--------------------------------------------------------------------------->
            <div>
                <div class="patching-summary flex flex-col gap-5">
                    <div class="title">
                        <h2 class="font-black">
                            <span class="text-primary text-3xl">P</span>atching
                        </h2>
                        <!-- <span
                            v-if="
                                finding.patch &&
                                finding.patch.patch_type &&
                                finding.patch.patch_type == 'FULL'
                            "
                            class="findings-patch-type-indicator-full"
                        >
                            <Icon :icon="'bi:shield-check'"></Icon>
                            Full patch available
                        </span> -->
                        <!-- <span
                            v-if="
                                finding.patch &&
                                finding.patch.patch_type &&
                                finding.patch.patch_type == 'PARTIAL'
                            "
                            class="findings-patch-type-indicator-partial"
                        >
                            <Icon :icon="'bi:shield-minus'"></Icon>
                            Partial patch available
                        </span> -->
                        <!-- <span
                            v-if="!finding.patch || finding.patch.patch_type == 'NONE'"
                            class="findings-patch-type-indicator-none"
                        >
                            <Icon :icon="'bi:shield-exclamation'"></Icon>
                            No patch available
                        </span> -->
                    </div>

                    <div style="position: relative">
                        <!-- <div
                            v-if="
                                !finding.patch ||
                                (finding.patch && finding.patch.patch_type == 'NONE')
                            "
                        >
                            There is no patch for the integration of this vulnerable dependency. To
                            mitigate the risk, you may look into removing the dependency or its
                            importing dependency from your project.
                        </div> -->
                        <!-- <div
                            v-if="
                                finding.patch &&
                                finding.patch.patch_type &&
                                finding.patch.patch_type != 'NONE'
                            "
                            class="flex flex-col gap-4"
                        >
                            <div class="flex gap-2 w-full text-center font-medium text-[#5b5b5b]">
                                <div
                                    class="w-1/2 bg-[#f5f2f2] rounded-md py-2 cursor-pointer flex flex.row items-center justify-center gap-2"
                                    @click="active_view_ref = 'patches'"
                                >
                                    <Icon :icon="'bi:list'"></Icon>
                                    Patches
                                </div>
                                <div
                                    class="w-1/2 bg-[#f5f2f2] rounded-md py-2 cursor-pointer flex flex.row items-center justify-center gap-2"
                                    @click="active_view_ref = 'tree'"
                                >
                                    <Icon :icon="'ri:node-tree'"></Icon>
                                    Tree
                                </div>
                            </div>

                            <div v-if="active_view_ref == 'patches'" class="patches-wrapper">
                                <div
                                    v-for="(patch, index) in finding.patch.patches"
                                    :key="index"
                                    class="patch"
                                >
                                    <BorderCard v-if="patch.patch_type == 'FULL'">
                                        <template #content>
                                            <div class="findings-patch-container-header">
                                                <div class="font-black flex gap-2 items-center">
                                                    <span>{{ patch.direct_dep_name }}</span>
                                                    <span
                                                        class="findings-patch-type-indicator-full"
                                                    >
                                                        <Icon :icon="'bi:shield-check'"></Icon>
                                                        Full
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <div>
                                                    Upgrading direct dependency
                                                    <b>{{ patch.direct_dep_name }}</b>
                                                    to version
                                                    <b>{{ patch.direct_dep_upgrade_version }}</b>
                                                    will upgrade
                                                    <b>{{ finding.dependency_info?.name }}</b>
                                                    to a patched version.
                                                </div>
                                            </div>
                                            <div class="collapsible-content"></div>
                                        </template>
                                    </BorderCard>

                                    <BorderCard v-if="patch.patch_type == 'PARTIAL'">
                                        <template #content>
                                            <div class="findings-patch-container-header">
                                                <div class="font-black flex gap-2 items-center">
                                                    <span>{{ patch.direct_dep_name }}</span>
                                                    <span
                                                        class="findings-patch-type-indicator-partial"
                                                    >
                                                        <Icon :icon="'bi:shield-minus'"></Icon>
                                                        Partial
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <div>
                                                    Upgrading direct dependency
                                                    <b>{{ patch.direct_dep_name }}</b>
                                                    to version
                                                    <b>{{ patch.direct_dep_upgrade_version }}</b>
                                                    will upgrade some occurences of
                                                    <b>{{ finding.dependency_info?.name }}</b>
                                                    to a patched version, but will leave some
                                                    instances unpatched.
                                                    <a href="">More info</a>
                                                </div>
                                            </div>
                                            <div class="collapsible-content"></div>
                                        </template>
                                    </BorderCard>

                                    <BorderCard v-if="patch.patch_type == 'NONE'" collapsible-box>
                                        <template #content>
                                            <div class="findings-patch-container-header">
                                                <div class="font-black flex gap-2 items-center">
                                                    <span>{{ patch.direct_dep_name }}</span>
                                                    <span
                                                        class="findings-patch-type-indicator-none"
                                                    >
                                                        <Icon
                                                            :icon="'bi:shield-exclamation'"
                                                        ></Icon>
                                                        None
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <div>
                                                    The direct dependency
                                                    <b>{{ patch.direct_dep_name }}</b>
                                                    cannot be upgraded such that
                                                    <b>{{ finding.dependency_info?.name }}</b>
                                                    is upgraded to a patched version.
                                                </div>
                                            </div>
                                            <div class="collapsible-content"></div>
                                        </template>
                                    </BorderCard>
                                </div>
                            </div>
                            <div v-if="active_view == 'tree'">
                                <Tree
                                    :nodes="nodes_array"
                                    :show-vuln-i-ds="false"
                                    style="font-size: 0.9em"
                                />
                            </div>
                        </div> -->
                        <div>
                            <!-- <div
                                v-if="
                                    finding.patch.patch_type == 'PARTIAL' ||
                                    finding.patch.patch_type == 'FULL'
                                "
                                class="finding-patching-info-box"
                                style="margin-top: 2em"
                            >
                                We suggest to apply our suggested patches via the patching page:
                                <a
                                    title="Open 'Patching' page in a new tab"
                                    :href="getPatchingUrl()"
                                    target="_blank"
                                    ><span style="text-decoration: underline">here</span></a
                                >
                            </div> -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { VulnerabilityDetails } from '@/repositories/types/entities/VulnDetails';
// import type { TreeNode } from '../../patching/location_subtree/TreeNode';
import Tree from '../../patching/location_subtree/PatchingTree.vue';
import moment from 'moment';
import { Icon } from '@iconify/vue';
import type CenteredModalVue from '@/common_components/CenteredModal.vue';
import { ref, type Ref } from 'vue';
import BubbleComponent from '@/common_components/bubbles/BubbleComponent.vue';
import BorderCard from '@/common_components/cards/BorderCard.vue';
import InfoMarkdown from '@/common_components/markdown/InfoMarkdown.vue';

const props = defineProps<{
    finding: VulnerabilityDetails;
    read_me_modal_ref: typeof CenteredModalVue;
    // nodes_array: TreeNode[];
    readme: string;
    active_view: string;
}>();

const active_view_ref: Ref<string> = ref(props.active_view);

function getPatchingUrl() {
    let paths = location.pathname.split('/');
    let url = `${paths[1]}/patching/${paths[2]}`;
    return `/${url}`;
}
// const readme = defineModel<string>('readme', { required: true })
// const active_view = defineModel<string>('active_view', { required: true })
</script>
<style scoped lang="scss">
@use '@/assets/colors.scss';
@use '@/assets/common/details.scss';
@use '@/assets/common/finding-patch.scss';
</style>
