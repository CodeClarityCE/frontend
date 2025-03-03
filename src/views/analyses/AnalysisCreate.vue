<template>
    <div class="h-full">
        <div class="w-full h-full flex flex-col gap-8 justify-center">
            <AnalysisCreateHeader />
            <div class="flex flex-col items-center" v-if="!loading">
                <SelectAnalyzer v-model:selected_analyzers="selected_analyzers"></SelectAnalyzer>
                <div v-if="error" class="mt-10 text-2xl w-3/4">
                    <Alert variant="destructive">
                        <AlertCircle class="w-4 h-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {{ errorCode }}
                            {{ errorMessage }}
                        </AlertDescription>
                    </Alert>
                </div>
                <div v-if="selected_analyzers.length > 0" class="mt-10 text-2xl w-3/4">
                    <div class="text-2xl font-medium mb-8">
                        Configure you analyzer
                        <div class="text-sm text-gray-500 mt-1">
                            Each analyzer requires different configuration depending on what plugin
                            you activated.
                        </div>
                    </div>
                    <div
                        v-for="analyzer in selected_analyzers_list"
                        :key="analyzer.id"
                        class="flex flex-col gap-4 items-center"
                    >
                        <!-- Configuration for : {{ analyzer.name }} -->
                        <div class="grid grid-cols-3 gap-4">
                            <div v-for="(step, index) in analyzer.steps" :key="index">
                                <div v-for="plugin in step" :key="plugin.name">
                                    <div v-if="Object.keys(plugin.config).length > 0">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    {{ plugin.name }}
                                                </CardTitle>
                                                <CardDescription>
                                                    {{ plugin.version }}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Form
                                                    @submit="
                                                        (values) => onSubmit(values, plugin.name)
                                                    "
                                                >
                                                    <FormField
                                                        v-for="config in plugin.config"
                                                        :key="config"
                                                        v-slot="{ componentField }"
                                                        :name="config.name"
                                                    >
                                                        <FormItem>
                                                            <FormLabel>{{ config.name }}</FormLabel>
                                                            <FormControl>
                                                                <SelectLicensePolicy
                                                                    v-model:selected_license_policy="
                                                                        selected_license_policy
                                                                    "
                                                                    v-if="
                                                                        config.name ===
                                                                        'License Policy'
                                                                    "
                                                                />
                                                                <Input
                                                                    :placeholder="config.name"
                                                                    v-bind="componentField"
                                                                    v-else
                                                                />
                                                            </FormControl>
                                                            <FormDescription>{{
                                                                config.description
                                                            }}</FormDescription>
                                                            <FormMessage>Message</FormMessage>
                                                        </FormItem>
                                                    </FormField>
                                                    <Button
                                                        type="submit"
                                                        @click="(e) => addIcon(e)"
                                                    >
                                                        Validate configuration
                                                    </Button>
                                                </Form>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                            <Button @click="createAnalysisStart">Create Analysis</Button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-4xl self-center flex flex-col gap-4 items-center mt-20" v-else>
                <span>Starting analysis</span>
                <Icon icon="eos-icons:loading" class="animate-spin"></Icon>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { type Ref, ref, h } from 'vue';

import { useStateStore } from '@/stores/state';
import AnalysisCreateHeader from './components/AnalysisCreateHeader.vue';

// API imports
import { AnalysisRepository } from '@/repositories/AnalysisRepository';
import { AnalyzerRepository } from '@/repositories/AnalyzerRepository';
import { BusinessLogicError } from '@/repositories/BaseRepository';

import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import SelectAnalyzer from './components/SelectAnalyzer.vue';
import type { Analyzer } from '@/repositories/types/entities/Analyzer';
import { watchDeep } from '@vueuse/core';
import Card from '@/shadcn/ui/card/Card.vue';
import CardHeader from '@/shadcn/ui/card/CardHeader.vue';
import CardContent from '@/shadcn/ui/card/CardContent.vue';
import CardTitle from '@/shadcn/ui/card/CardTitle.vue';
import CardDescription from '@/shadcn/ui/card/CardDescription.vue';
import { Form } from 'vee-validate';
import FormItem from '@/shadcn/ui/form/FormItem.vue';
import FormLabel from '@/shadcn/ui/form/FormLabel.vue';
import FormControl from '@/shadcn/ui/form/FormControl.vue';
import Input from '@/shadcn/ui/input/Input.vue';
import FormDescription from '@/shadcn/ui/form/FormDescription.vue';
import FormMessage from '@/shadcn/ui/form/FormMessage.vue';
import { FormField } from '@/shadcn/ui/form';
import SelectLicensePolicy from './components/SelectLicensePolicy.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import { toast } from '@/shadcn/ui/toast';
import router from '@/router';
import type { DataResponse } from '@/repositories/types/responses/DataResponse';
import { Icon } from '@iconify/vue/dist/iconify.js';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import { AlertCircle } from 'lucide-vue-next';
import AlertTitle from '@/shadcn/ui/alert/AlertTitle.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';
const user = useUserStore();
const auth = useAuthStore();

const state = useStateStore();
state.$reset();

state.page = 'add';

/*****************************************************************************/
/*                                    Data                                   */
/*****************************************************************************/
const projectRepository: AnalysisRepository = new AnalysisRepository();
const analyzerRepository: AnalyzerRepository = new AnalyzerRepository();

const selected_branch: Ref<string> = ref('');
const selected_commit_hash: Ref<string> = ref('');
const selected_analyzers: Ref<Array<number>> = ref([]);
const selected_license_policy: Ref<Array<string>> = ref(['']);
const selected_analyzers_list: Ref<Array<Analyzer>> = ref([]);

const configuration: Ref<Object> = ref({});

const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const errorMessage: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(false);

const project_id: Ref<string> = ref('');

const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');
if (projectId == null) {
    throw new Error('Project id not found');
}
project_id.value = projectId;

function onSubmit(values: any, plugin_name: string) {
    console.log('Form submitted!', values, selected_license_policy.value);
    if (values === undefined) configuration.value[plugin_name] = {};
    else configuration.value[plugin_name] = values;

    if (plugin_name === 'js-license') {
        configuration.value[plugin_name]['licensePolicy'] = selected_license_policy.value;
    }

    if (plugin_name === 'js-sbom') {
        configuration.value[plugin_name]['project'] =
            `${user.defaultOrg?.id}/projects/${project_id.value}/${values.branch}`;
        selected_branch.value = values.branch;
    }

    toast({
        title: 'You submitted the following values:',
        description: h(
            'pre',
            { class: 'mt-2 w-[340px] rounded-md bg-slate-950 p-4' },
            h('code', { class: 'text-white' }, JSON.stringify(configuration.value, null, 2))
        )
    });
}

watchDeep(selected_analyzers, () => {
    selected_analyzers_list.value = [];
    if (selected_analyzers.value.length > 0) {
        getAnalyzer(selected_analyzers.value[0].toString());
    }
});

function addIcon(element: Event) {
    element.target.innerHTML = '✓ Configuration validated';
}

async function getAnalyzer(analyzer_id: string) {
    loading.value = true;
    let response: DataResponse<Analyzer>;
    try {
        response = await analyzerRepository.getAnalyzer({
            analyzer_id: analyzer_id,
            orgId: user.defaultOrg?.id!,
            bearerToken: auth.getToken!,
            handleBusinessErrors: true
        });
        selected_analyzers_list.value.push(response.data);
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        loading.value = false;
    }
}

// Fetch projects
async function createAnalysisStart() {
    loading.value = true;
    if (selected_commit_hash.value == '') selected_commit_hash.value = ' ';
    if (selected_branch.value == '') selected_branch.value = ' ';
    try {
        if (auth.getAuthenticated && auth.getToken) {
            if (user.defaultOrg?.id === undefined) {
                throw new Error('Organization id not found');
            }

            await projectRepository.createAnalysis({
                orgId: user.defaultOrg?.id,
                projectId: project_id.value,
                bearerToken: auth.getToken,
                handleBusinessErrors: true,
                data: {
                    analyzer_id: selected_analyzers.value[0].toString(),
                    branch: selected_branch.value,
                    commit_hash: selected_commit_hash.value,
                    config: configuration.value
                }
            });
            toast({
                title: 'Analysis created successfully'
            });
            router.push({ name: 'projects' });
        }
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
            errorMessage.value = _err.error_message;
        }
    } finally {
        loading.value = false;
    }
}
</script>
