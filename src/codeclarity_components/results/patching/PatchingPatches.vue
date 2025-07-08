<script lang="ts" setup>
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import { ref, type Ref, watch } from 'vue';
import { Icon } from '@iconify/vue';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import { PatchedManifestData } from '@/codeclarity_components/results/patching/Patching';
import type { PatchInfo, UpgradeInfo } from '@/codeclarity_components/results/patching/Patching';
import BubbleComponent from '@/base_components/data-display/bubbles/BubbleComponent.vue';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';

export interface Props {
    analysisID?: string;
    projectID?: string;
}

const props = withDefaults(defineProps<Props>(), {
    analysisID: '',
    projectID: ''
});

const patches: Ref<Array<PatchInfo>> = ref([]);
const error: Ref<boolean> = ref(false);
const render: Ref<boolean> = ref(false);
const sortOptionSelected: Ref<string> = ref('patch_type');
const pageLimitSelected: Ref<number> = ref(5);
const nmbEntriesShowing = ref(pageLimitSelected.value);
const matchingItemsCount: Ref<number> = ref(0);
const nmbEntriesTotal: Ref<number> = ref(0);
const pageNumber: Ref<number> = ref(0);
const totalPages: Ref<number> = ref(0);
const searchKey: Ref<string> = ref('');
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);

const patchedManifestData: Ref<PatchedManifestData> = ref(new PatchedManifestData());

watch([pageNumber, pageLimitSelected, sortOptionSelected, sortDirection, pageNumber], () => {
    init();
});

const resultsRepository: ResultsRepository = new ResultsRepository();

function copyPatchedManfiest() {
    navigator.clipboard.writeText(
        JSON.stringify(patchedManifestData.value.patched_manifest_raw, null, '\t')
    );
}

function copyPatchedText(text: string) {
    navigator.clipboard.writeText(text);
}

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();
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
        const res = await resultsRepository.getPatches({
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
                sortKey: sortOptionSelected.value,
                sortDirection: sortDirection.value
            },
            active_filters: '',
            search_key: searchKey.value
        });
        patches.value = res.data;

        render.value = true;
        pageNumber.value = res.page;
        pageLimitSelected.value = res.entries_per_page;
        nmbEntriesShowing.value = res.entry_count;
        matchingItemsCount.value = res.matching_count;
        nmbEntriesTotal.value = res.total_entries;
        totalPages.value = res.total_pages;
    } catch (_err) {
        console.error('error', _err);
        render.value = false;
        error.value = true;
    }

    try {
        const res = await resultsRepository.getPatchesManifest({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: '.',
            bearerToken: authStore.getToken
        });
        patchedManifestData.value = res.data;
        render.value = true;
    } catch (_err) {
        console.error('error', _err);
        render.value = false;
        error.value = true;
    }
}

init();
</script>

<template>
    <div class="flex flex-col gap-7">
        <!--------------------------------------------------------------------------->
        <!--                            Search and Filters                         -->
        <!--------------------------------------------------------------------------->

        <Card v-if="render">
            <CardHeader>
                <CardTitle>Package Manifest</CardTitle>
                <CardDescription>{{
                    patchedManifestData.other_info?.relative_package_file
                }}</CardDescription>
            </CardHeader>
            <CardContent v-if="patchedManifestData.patched_manifest">
                <div class="bg-[#f4f8ff] p-4 relative rounded flex gap-y-5 font-code">
                    <!-- <div style="color: #939090;">
                        <div v-for="index in getPatchedManifestLineCount()" style="height:1.39em">
                            {{ index }}.
                        </div>
                    </div> -->
                    <div style="font-size: 1em" class="patched-manifest">
                        <div class="line">
                            <span style="margin-left: 5px">&#123;</span>
                        </div>
                        <div class="line">
                            <span style="margin-left: 25px"
                                >"name": "{{ patchedManifestData.patched_manifest?.name }}",</span
                            >
                        </div>
                        <div class="line">
                            <span style="margin-left: 25px"
                                >"version": "{{
                                    patchedManifestData.patched_manifest?.version
                                }}",</span
                            >
                        </div>
                        <div
                            v-for="field in [
                                'dependencies',
                                'devDependencies',
                                'peerDependencies',
                                'bundleDependencies',
                                'bundledDependencies',
                                'optionalDependencies'
                            ]"
                            :key="field"
                        >
                            <div v-if="patchedManifestData.patched_manifest[field]">
                                <div class="line">
                                    <span style="margin-left: 25px">{{ field }}": &#123;</span>
                                </div>
                                <div
                                    v-for="(direct_dep, direct_dep_key) in patchedManifestData
                                        .patched_manifest[field]"
                                    :key="direct_dep_key"
                                    class="line"
                                >
                                    <span style="margin-left: 45px">
                                        <div
                                            v-if="
                                                (direct_dep as UpgradeInfo).vulnerable == true &&
                                                (direct_dep as UpgradeInfo).patch_type == 'FULL'
                                            "
                                            style="
                                                display: flex;
                                                flex-direction: row;
                                                column-gap: 5px;
                                                align-items: center;
                                            "
                                        >
                                            <div>
                                                {{ direct_dep_key }}": "{{
                                                    (direct_dep as UpgradeInfo).original_constraint
                                                }}" ->
                                            </div>
                                            <span class="text-patched font-black">
                                                "{{ (direct_dep as UpgradeInfo).upgrade_to }}"
                                            </span>
                                        </div>
                                        <div
                                            v-if="
                                                (direct_dep as UpgradeInfo).vulnerable == true &&
                                                (direct_dep as UpgradeInfo).patch_type == 'PARTIAL'
                                            "
                                            class="flex gap-y-1 items-center"
                                        >
                                            <div>
                                                {{ direct_dep_key }}": "{{
                                                    (direct_dep as UpgradeInfo).original_constraint
                                                }}" ->
                                            </div>
                                            <span class="text-partiallyPatched font-black">
                                                "{{ (direct_dep as UpgradeInfo).upgrade_to }}"
                                            </span>
                                        </div>
                                        <div
                                            v-if="
                                                (direct_dep as UpgradeInfo).vulnerable == true &&
                                                (direct_dep as UpgradeInfo).patch_type == 'NONE'
                                            "
                                            class="flex gap-y-1 items-center"
                                        >
                                            <div>
                                                {{ direct_dep_key }}": "{{
                                                    (direct_dep as UpgradeInfo).original_constraint
                                                }}"
                                            </div>
                                            <span class="text-notPatched">
                                                <Icon icon="bi:shield-fill-exclamation" />
                                            </span>
                                            <div class="text-notPatched">Not Patchable</div>
                                        </div>
                                        <div
                                            v-if="(direct_dep as UpgradeInfo).vulnerable == false"
                                            class="flex gap-y-1 items-center"
                                        >
                                            <div>
                                                {{ direct_dep_key }}": "{{
                                                    (direct_dep as UpgradeInfo).original_constraint
                                                }}"
                                            </div>
                                            <span class="text-patched">
                                                <Icon icon="bi:shield-fill-check" />
                                            </span>
                                            <div class="text-patched">Not Vulnerable</div>
                                        </div>
                                    </span>
                                </div>
                                <div class="line">
                                    <span class="ml-6">&#125;,</span>
                                </div>
                            </div>
                        </div>
                        <div class="line">&#125;</div>
                        <div
                            class="absolute top-4 right-4 cursor-pointer bg-white border border-[#d3d3d3] text-[#a4a2a2] p-1 rounded"
                        >
                            <tippy
                                content="Copied!"
                                :trigger="'click'"
                                :placement="'top'"
                                :animation="'scale'"
                            >
                                <Icon
                                    class="m-2"
                                    icon="ic:round-content-copy"
                                    @click="copyPatchedManfiest()"
                                />
                            </tippy>
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; row-gap: 1em; margin-top: 30px">
                    <div class="flex flex-row gap-2 items-center">
                        <BubbleComponent :slim="true">
                            <template #content> 1 </template>
                        </BubbleComponent>
                        <div>
                            Copy Patched Manifest and replace it in
                            <span
                                style="background-color: #f4f8ff; padding: 5px; border-radius: 5px"
                                >{{ patchedManifestData.other_info.relative_package_file }}</span
                            >
                        </div>
                    </div>
                    <div style="width: fit-content">
                        <div
                            class="bg-f4f8ff border rounded py-2 px-5 cursor-pointer text-center font-medium flex items-center gap-2"
                            @click="copyPatchedManfiest()"
                        >
                            Copy Patched Manifest
                            <tippy
                                content="Copied!"
                                :trigger="'click'"
                                :placement="'top'"
                                :animation="'scale'"
                            >
                                <Icon class="hover:text-lg" icon="ic:round-content-copy" />
                            </tippy>
                        </div>
                    </div>
                    <div
                        style="
                            display: flex;
                            flex-direction: row;
                            column-gap: 8px;
                            align-items: center;
                        "
                    >
                        <BubbleComponent :slim="true">
                            <template #content> 2 </template>
                        </BubbleComponent>
                        <div>Run the following command</div>
                    </div>
                    <div
                        v-if="patchedManifestData.other_info.package_manager == 'NPM'"
                        style="
                            font-family: 'Courier New', Courier, monospace;
                            display: flex;
                            flex-direction: row;
                            column-gap: 10px;
                            align-items: center;
                            border: 1px solid #eee;
                            border-radius: 5px;
                            padding: 10px;
                            width: fit-content;
                        "
                    >
                        <Icon :icon="'material-symbols:chevron-right'" />
                        <div style="margin-top: 2px">
                            rm package-lock.json ; npm install . --prefer-online
                        </div>
                        <tippy
                            content="Copied!"
                            :trigger="'click'"
                            :placement="'top'"
                            :animation="'scale'"
                        >
                            <Icon
                                icon="ic:round-content-copy"
                                class="click-scale"
                                style="cursor: pointer"
                                @click="
                                    copyPatchedText(
                                        'rm package-lock.json ; npm install . --prefer-online'
                                    )
                                "
                            />
                        </tippy>
                    </div>
                    <div
                        v-if="patchedManifestData.other_info.package_manager == 'YARN'"
                        style="
                            font-family: 'Courier New', Courier, monospace;
                            display: flex;
                            flex-direction: row;
                            column-gap: 10px;
                            align-items: center;
                            border: 1px solid #eee;
                            border-radius: 5px;
                            padding: 10px;
                            width: fit-content;
                        "
                    >
                        <Icon :icon="'material-symbols:chevron-right'" />
                        <div style="margin-top: 2px">
                            rm yarn.lock ; yarn install --prefer-online
                        </div>
                        <tippy
                            content="Copied!"
                            :trigger="'click'"
                            :placement="'top'"
                            :animation="'scale'"
                        >
                            <Icon
                                icon="ic:round-content-copy"
                                class="cursor-pointer"
                                style="cursor: pointer"
                                @click="
                                    copyPatchedText('rm yarn.lock ; yarn install --prefer-online')
                                "
                            />
                        </tippy>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!--------------------------------------------------------------------------->
        <!--                            Loading skeleton                           -->
        <!--------------------------------------------------------------------------->

        <div v-if="!render">
            <div style="display: flex; flex-direction: column; row-gap: 10px">
                <BoxLoader
                    v-for="index in 3"
                    :key="index"
                    :dimensions="{ width: '100%', height: '150px' }"
                />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';

.patched-manifest {
    counter-reset: linecount;
}

.patched-manifest .line {
    position: relative;
    display: flex;
}

.patched-manifest .line::before {
    display: inline-block;
    counter-increment: linecount;
    content: counter(linecount) '.';
    width: 50px;
}
</style>
