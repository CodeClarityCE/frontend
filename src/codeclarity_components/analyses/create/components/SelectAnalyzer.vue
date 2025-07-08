<script setup lang="ts">
import { ref, type Ref } from 'vue';
import LoadingContainer from '@/base_components/ui/loaders/LoadingContainer.vue';
import AnalyzerComp from './AnalyzerComp.vue';
import { Analyzer } from '@/codeclarity_components/organizations/analyzers/Analyzer';
import { AnalyzerRepository } from '@/codeclarity_components/organizations/analyzers/AnalyzerRepository';

import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import type { PaginatedResponse } from '@/utils/api/responses/PaginatedResponse';
import Button from '@/shadcn/ui/button/Button.vue';
const user = useUserStore();
const auth = useAuthStore();

const selected_analyzers = defineModel<Array<number>>('selected_analyzers', { default: [] });
const analyzers_list: Ref<Array<Analyzer>> = ref([]);
const analyzers_list_loading_ref: Ref<typeof LoadingContainer | undefined> = ref();
const analyzers_list_loading_error: Ref<any> = ref(null);

const projectRepository: AnalyzerRepository = new AnalyzerRepository();

const emit = defineEmits<{
    (e: 'next'): void;
    (e: 'previous'): void;
}>();

function click(event: Event) {
    if (event.currentTarget) {
        event.currentTarget.children[0].checked =
            event.currentTarget.children[0].checked == true ? false : true;
    }
    select();
}

function select() {
    const inputs = document.getElementsByClassName('checkboxInput');
    for (let index = 0; index < inputs.length; index++) {
        const element = inputs[index];
        if (element.checked) {
            selected_analyzers.value.push(element.value);
        } else if (selected_analyzers.value.includes(element.value)) {
            selected_analyzers.value = selected_analyzers.value.filter(
                (value) => value != element.value
            );
        }
    }
    emit('next');
}

// Fetch projects
async function fetchAnalyzers() {
    if (auth.getAuthenticated && auth.getToken) {
        if (user.defaultOrg?.id === undefined) {
            return;
        }
        let res: PaginatedResponse<Analyzer>;
        try {
            res = await projectRepository.getAnalyzers({
                orgId: user.defaultOrg?.id,
                page: 0,
                entries_per_page: 0,
                search_key: '',
                bearerToken: auth.getToken,
                handleBusinessErrors: true
            });
            analyzers_list.value = res?.data;
        } catch (err) {
            analyzers_list_loading_error.value = err;
            analyzers_list_loading_ref.value?.showError();
            return;
        } finally {
            analyzers_list_loading_ref.value?.showContent();
        }
        return res;
    }
}

fetchAnalyzers();
</script>
<template>
    <Transition>
        <div v-if="true" class="w-fit">
            <div class="text-2xl font-medium mb-8">
                Select the analyzers to run on the project.
                <div class="text-sm text-gray-500 mt-1">
                    Select one or more of our analyzers to run on the project.
                </div>
            </div>

            <div id="error_analyzers_selection" class="input_error_box mb-5"></div>
            <LoadingContainer ref="analyzers_list_loading_ref">
                <template #content>
                    <div>
                        <template v-for="analyzer in analyzers_list" :key="analyzer">
                            <div class="flex flex-row gap-5 cursor-pointer" @click="click">
                                <input
                                    v-model="selected_analyzers"
                                    type="checkbox"
                                    :value="analyzer.id"
                                    class="checkboxInput cursor-pointer"
                                />
                                <AnalyzerComp :analyzer-data="analyzer" />
                            </div>
                        </template>
                        <div v-if="analyzers_list.length == 0">
                            You need to create an analyzer before you can select it.
                        </div>
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: {
                                    action: 'add',
                                    page: 'analyzers',
                                    orgId: user.defaultOrg?.id
                                }
                            }"
                        >
                            <div class="mt-10">
                                You can create a new analyzer
                                <Button variant="link" class="px-0">here</Button> !
                            </div>
                        </RouterLink>
                    </div>
                </template>

                <template #error>
                    {{ analyzers_list_loading_error }}
                </template>
            </LoadingContainer>
        </div>
    </Transition>
</template>

<style scoped>
div:has(> input) {
    margin-top: 8px;
    border: 2px;
    border-color: white;
    border-style: solid;
    border-radius: 5px;
    padding: 8px;
}

div:has(> input:checked) {
    border-color: #008491;
}

div:has(> input:not(:checked)):hover {
    border-color: lightgray;
}

input {
    visibility: hidden;
}
</style>
