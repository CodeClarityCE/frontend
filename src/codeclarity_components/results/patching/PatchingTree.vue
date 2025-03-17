<script lang="ts" setup>
import { ref, type Ref, watch } from 'vue';
import BoxLoader from '@/base_components/BoxLoader.vue';
import { Icon } from '@iconify/vue';

import Tree from './location_subtree/PatchingTree.vue';
import { TreeGenerator } from '@/utils/tree/patching/TreeGenerator';
import type { TreeNode } from '@/utils/tree/patching/TreeNode';
import { ResultsRepository } from '@/codeclarity_components/results/results.repository';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';

export interface Props {
    analysisID: string;
    projectID: string;
}
const props = withDefaults(defineProps<Props>(), {
    projectID: '',
    analysisID: ''
});

const resultsRepository: ResultsRepository = new ResultsRepository();

const error: Ref<boolean> = ref(false);
const render: Ref<boolean> = ref(false);
const nodes_array: Ref<Array<TreeNode>> = ref([]);

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';

watch(
    () => props.projectID,
    () => init()
);

watch(
    () => props.analysisID,
    () => init()
);

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
    if (props.projectID == null || props.analysisID == null) {
        return;
    }
    try {
        const res = await resultsRepository.getPatchingGraph({
            orgId: userStore.getDefaultOrg.id,
            projectId: props.projectID,
            analysisId: props.analysisID,
            workspace: '.',
            bearerToken: authStore.getToken
        });
        try {
            nodes_array.value = nodes_array.value = new TreeGenerator().generateTree(
                Object.values(res.data)
            );
        } catch (err) {
            console.error(`Encountered problem during dependency data parsing: ${err}`);
        }
        render.value = true;
    } catch {
        console.error('error');
        render.value = false;
        error.value = false;
    }
    // fetch();
}

init();
</script>

<template>
    <!-- <div style="display:flex;column-gap:1em;margin-bottom:20px;">
        <SearchBar 
            :search="search"
            :searchbar_placeholder="placeholder"
            @search="apply_search($event)"
            />
        <Filters
            :options="options"
            @options="apply_options($event)"
        />
    </div> -->
    <!-- <div style="color: #484848; font-weight: 400;margin-bottom: 20px;margin-top: 40px;display:flex;flex-direction: row; justify-content:space-between;align-items: center;">
        <div style="display:flex;flex-direction: row;white-space: nowrap;align-items: center;column-gap: 10px;">
            Showing 
            <select class="drop-down-box no-shadow" style="padding: 5px;height: fit-content;margin:0px;" v-model="page_limit_selected" @click="page_number = 1;fetch();">
                <option v-for="(page_limit_option, index) in selection_page_limit" :value="page_limit_option" :key="index">{{ page_limit_option }}</option>
            </select> 
            entries per page
        </div>
        <div style="">Showing {{nmb_entries_showing}} out of {{nmb_entries_total}} entries</div>
    </div>
	 -->
    <Tree v-if="render" :nodes="nodes_array" style="font-size: 0.9em" :show-vuln-i-ds="true" />

    <!-- <div style="color: #484848; font-weight: 400;display:flex;justify-content: space-between;margin-top:40px;" >
        <div style="">Showing {{nmb_entries_showing}} out of {{nmb_entries_total}} entries</div>
        <div class="pagination">
            <button @click="page_number = 1;fetch();" class="prev-button" v-bind:disabled="page_number == 1"><v-icon name="bi-chevron-double-left"></v-icon></button>
            <button @click="page_number = page_number-1;fetch();" v-bind:disabled="page_number == 1"><v-icon name="bi-chevron-left"></v-icon></button>
            <span v-for="page in [...Array(total_pages+1).keys()].filter((elem) => elem != 0)">
                <button v-if="showPageButton(page)" @click="page_number = page;fetch();" v-bind:class="{ 'active': page_number==page  }" >
                    {{page}}
                </button>
            </span>
            <button @click="page_number = page_number+1;fetch();" v-bind:disabled="page_number == total_pages"><v-icon name="bi-chevron-right"></v-icon></button>
            <button @click="page_number = total_pages;fetch();" class="next-button" v-bind:disabled="page_number == total_pages"><v-icon name="bi-chevron-double-right"></v-icon></button>
        </div>
    </div> -->
    <div v-if="!render && !error">
        <div style="display: flex; flex-direction: column; row-gap: 10px">
            <BoxLoader :dimensions="{ width: '150px', height: '30px' }" />
            <BoxLoader :dimensions="{ width: '150px', height: '30px' }" style="margin-left: 50px" />
            <BoxLoader :dimensions="{ width: '150px', height: '30px' }" style="margin-left: 50px" />
            <BoxLoader :dimensions="{ width: '150px', height: '30px' }" style="margin-left: 50px" />
            <BoxLoader
                :dimensions="{ width: '150px', height: '30px' }"
                style="margin-left: 100px"
            />
            <BoxLoader
                :dimensions="{ width: '150px', height: '30px' }"
                style="margin-left: 100px"
            />
            <BoxLoader
                :dimensions="{ width: '150px', height: '30px' }"
                style="margin-left: 150px"
            />
            <BoxLoader
                :dimensions="{ width: '150px', height: '30px' }"
                style="margin-left: 100px"
            />
            <BoxLoader
                :dimensions="{ width: '150px', height: '30px' }"
                style="margin-left: 150px"
            />
            <BoxLoader
                :dimensions="{ width: '150px', height: '30px' }"
                style="margin-left: 200px"
            />
            <BoxLoader :dimensions="{ width: '150px', height: '30px' }" style="margin-left: 50px" />
        </div>
    </div>
    <Alert v-if="error" variant="destructive">
        <Icon icon="ic:twotone-warning" />
        <AlertDescription>
            Encountered Error during the rendering of the dependency tree.
        </AlertDescription>
    </Alert>
</template>
