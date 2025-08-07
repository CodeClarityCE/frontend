<script lang="ts" setup>
import { type Ref, ref, h } from 'vue';

import { useStateStore } from '@/stores/state';
import { PageHeader } from '@/base_components';

// API imports
import { AnalysisRepository } from '@/codeclarity_components/analyses/analysis.repository';
import { AnalyzerRepository } from '@/codeclarity_components/organizations/analyzers/AnalyzerRepository';
import { BusinessLogicError } from '@/utils/api/BaseRepository';

import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import type { Analyzer } from '@/codeclarity_components/organizations/analyzers/Analyzer';
import { watchDeep } from '@vueuse/core';
import { Form } from 'vee-validate';
import FormItem from '@/shadcn/ui/form/FormItem.vue';
import FormLabel from '@/shadcn/ui/form/FormLabel.vue';
import FormControl from '@/shadcn/ui/form/FormControl.vue';
import Input from '@/shadcn/ui/input/Input.vue';
import FormDescription from '@/shadcn/ui/form/FormDescription.vue';
import FormMessage from '@/shadcn/ui/form/FormMessage.vue';
import { FormField } from '@/shadcn/ui/form';
import SelectLicensePolicy from './components/SelectLicensePolicy.vue';
import ScheduleSelector from './components/ScheduleSelector.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import { toast } from '@/shadcn/ui/toast';
import router from '@/router';
import { RouterLink } from 'vue-router';
import type { DataResponse } from '@/utils/api/responses/DataResponse';
import { Icon } from '@iconify/vue';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import { AlertCircle } from 'lucide-vue-next';
import AlertTitle from '@/shadcn/ui/alert/AlertTitle.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/shadcn/ui/select';

// Project info imports
import type { Project } from '@/codeclarity_components/projects/project.entity';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
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
const projectRepo: ProjectRepository = new ProjectRepository();

const selected_branch: Ref<string> = ref('');
const selected_commit_hash: Ref<string> = ref('');
const selected_analyzers: Ref<Array<number>> = ref([]);
const selected_license_policy: Ref<Array<string>> = ref(['']);
const selected_analyzers_list: Ref<Array<Analyzer>> = ref([]);
const availableAnalyzers: Ref<Array<any>> = ref([]);

const configuration: Ref<Record<string, any>> = ref({});

// Schedule data
const scheduleData = ref({
    schedule_type: 'once' as 'once' | '10min' | 'hourly' | 'daily' | 'weekly' | 'monthly',
    next_scheduled_run: undefined as Date | undefined,
    is_active: true
});

const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const errorMessage: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(false);

const project_id: Ref<string> = ref('');
const project: Ref<Project | undefined> = ref();

const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');
if (projectId == null) {
    throw new Error('Project id not found');
}
project_id.value = projectId;

// Fetch project info
async function getProject() {
    if (auth.getAuthenticated && auth.getToken) {
        if (user.defaultOrg?.id === undefined) {
            return;
        }
        try {
            const res: DataResponse<Project> = await projectRepo.getProjectById({
                orgId: user.defaultOrg?.id,
                projectId: project_id.value,
                bearerToken: auth.getToken,
                handleBusinessErrors: true
            });
            project.value = res.data;
        } catch (err) {
            error.value = true;
            if (err instanceof BusinessLogicError) {
                errorCode.value = err.error_code;
                errorMessage.value = err.error_message;
            }
        }
    }
}

// Initialize
getProject();
fetchAvailableAnalyzers();

// Fetch available analyzers
async function fetchAvailableAnalyzers() {
    if (auth.getAuthenticated && auth.getToken && user.defaultOrg?.id) {
        try {
            const res = await analyzerRepository.getAnalyzers({
                orgId: user.defaultOrg.id,
                page: 0,
                entries_per_page: 0,
                search_key: '',
                bearerToken: auth.getToken,
                handleBusinessErrors: true
            });

            // Transform the data to include display names
            availableAnalyzers.value = res.data.map((analyzer: any) => ({
                id: analyzer.id,
                name: analyzer.name,
                displayName: analyzer.name === 'JS' ? 'JavaScript Analyzer' : analyzer.name,
                description: analyzer.description || 'SBOM, vulnerabilities and licenses'
            }));
        } catch (err) {
            console.error('Failed to fetch analyzers:', err);
        }
    }
}

function onSubmit(values: any, plugin_name: string) {
    console.log('Form submitted!', values, selected_license_policy.value);
    if (values === undefined) configuration.value[plugin_name] = {};
    else configuration.value[plugin_name] = values;

    if (plugin_name === 'js-license') {
        configuration.value[plugin_name]['licensePolicy'] = selected_license_policy.value;
    }

    if (plugin_name === 'js-sbom' || plugin_name === 'codeql') {
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

function addIcon(element: any) {
    if (element.target) {
        element.target.innerHTML = '✓ Configuration validated';
    }
}

async function getAnalyzer(analyzer_id: string) {
    loading.value = true;
    let response: DataResponse<Analyzer>;
    try {
        response = await analyzerRepository.getAnalyzer({
            analyzer_id: analyzer_id,
            orgId: user.defaultOrg?.id ?? '',
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

            // Prepare analysis data with scheduling information
            const analysisData: any = {
                analyzer_id: selected_analyzers.value[0].toString(),
                branch: selected_branch.value,
                commit_hash: selected_commit_hash.value,
                config: configuration.value
            };

            // Add scheduling fields if not 'once'
            if (scheduleData.value.schedule_type !== 'once') {
                analysisData.schedule_type = scheduleData.value.schedule_type;
                analysisData.is_active = scheduleData.value.is_active;
                if (scheduleData.value.next_scheduled_run) {
                    // Convert local date to UTC for storage/transmission
                    analysisData.next_scheduled_run =
                        scheduleData.value.next_scheduled_run.toISOString();
                }
            }

            await projectRepository.createAnalysis({
                orgId: user.defaultOrg?.id,
                projectId: project_id.value,
                bearerToken: auth.getToken,
                handleBusinessErrors: true,
                data: analysisData
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
<template>
    <main class="min-h-screen bg-white p-6">
        <!-- Page Header -->
        <PageHeader
            title="Analysis"
            description="Select the analyzers to run on the project"
            :show-last-updated="false"
            :show-refresh="false"
        />

        <!-- Project Information - Simplified -->
        <div v-if="project" class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center gap-3">
                <Icon
                    v-if="project?.type == IntegrationProvider.GITHUB"
                    icon="simple-icons:github"
                    class="h-6 w-6 text-gray-700"
                />
                <Icon
                    v-else-if="project?.type == IntegrationProvider.GITLAB"
                    icon="simple-icons:gitlab"
                    class="h-6 w-6 text-gray-700"
                />
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-900">{{ project?.name }}</h3>
                    <p class="text-sm text-gray-600">{{ project?.type }}</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    class="text-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
                    as-child
                >
                    <a target="_blank" :href="project?.url" class="flex items-center gap-1">
                        <Icon icon="solar:external-link-linear" class="h-4 w-4" />
                        View
                    </a>
                </Button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
            <Icon icon="eos-icons:loading" class="h-12 w-12 text-theme-primary animate-spin mb-4" />
            <span class="text-xl font-medium text-theme-black">Starting analysis...</span>
        </div>

        <!-- Main Content -->
        <div v-else class="space-y-8">
            <!-- Error Alert -->
            <Alert v-if="error" variant="destructive" class="border-red-200 bg-red-50">
                <AlertCircle class="w-4 h-4 text-red-600" />
                <AlertTitle class="text-red-800 font-semibold">Error</AlertTitle>
                <AlertDescription class="text-red-700">
                    <div
                        v-if="
                            errorCode === 'AlreadyExists' && scheduleData.schedule_type !== 'once'
                        "
                    >
                        <p class="font-medium mb-2">
                            Only one scheduled analysis allowed per project
                        </p>
                        <p class="text-sm">
                            This project already has an active scheduled analysis. Please cancel the
                            existing scheduled analysis before creating a new one, or create a
                            one-time analysis instead.
                        </p>
                    </div>
                    <div v-else>{{ errorCode }} - {{ errorMessage }}</div>
                </AlertDescription>
            </Alert>

            <!-- Analyzer Selection - Much Simpler -->
            <div class="space-y-4">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Select Analyzers</h3>
                    <p class="text-sm text-gray-600 mb-4">
                        Choose the security analysis tools to run on your project
                    </p>
                </div>

                <!-- Simple List of Available Analyzers -->
                <div class="space-y-3">
                    <div v-for="analyzer in availableAnalyzers" :key="analyzer.id" class="relative">
                        <label
                            class="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all"
                            :class="{
                                'border-theme-primary bg-theme-primary/5':
                                    selected_analyzers.includes(analyzer.id)
                            }"
                        >
                            <input
                                v-model="selected_analyzers"
                                type="checkbox"
                                :value="analyzer.id"
                                class="w-4 h-4 text-theme-primary border-gray-300 rounded focus:ring-theme-primary focus:ring-2"
                            />
                            <div class="ml-4 flex items-center flex-1">
                                <div
                                    class="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mr-4"
                                >
                                    <Icon icon="devicon:javascript" class="w-8 h-8" />
                                </div>
                                <div class="flex-1">
                                    <h4 class="font-semibold text-gray-900">
                                        {{ analyzer.displayName }}
                                    </h4>
                                    <p class="text-sm text-gray-600">{{ analyzer.description }}</p>
                                </div>
                            </div>
                            <!-- Selection indicator -->
                            <div
                                v-if="selected_analyzers.includes(analyzer.id)"
                                class="text-theme-primary"
                            >
                                <Icon icon="solar:check-circle-bold" class="w-5 h-5" />
                            </div>
                        </label>
                    </div>

                    <!-- Empty state -->
                    <div
                        v-if="availableAnalyzers.length === 0"
                        class="text-center py-8 text-gray-500"
                    >
                        <Icon
                            icon="solar:settings-linear"
                            class="w-12 h-12 mx-auto mb-3 text-gray-400"
                        />
                        <p class="text-sm">No analyzers available.</p>
                        <Button variant="link" class="text-theme-primary mt-2" as-child>
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
                                Create a new analyzer
                            </RouterLink>
                        </Button>
                    </div>
                </div>

                <!-- Selection feedback -->
                <div
                    v-if="selected_analyzers.length > 0"
                    class="text-sm text-theme-primary font-medium"
                >
                    ✓ {{ selected_analyzers.length }} analyzer{{
                        selected_analyzers.length > 1 ? 's' : ''
                    }}
                    selected
                </div>
            </div>

            <!-- Analyzer Configuration - Simplified -->
            <div v-if="selected_analyzers.length > 0" class="space-y-6">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Configure Analysis</h3>
                    <p class="text-sm text-gray-600 mb-4">
                        Set up the configuration for your selected analyzers
                    </p>
                </div>

                <div class="space-y-4">
                    <div
                        v-for="analyzer in selected_analyzers_list"
                        :key="analyzer.id"
                        class="space-y-4"
                    >
                        <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                            <div v-for="(step, index) in analyzer.steps" :key="index">
                                <div v-for="plugin in step" :key="plugin.name">
                                    <div
                                        v-if="Object.keys(plugin.config).length > 0"
                                        class="h-full"
                                    >
                                        <div
                                            class="border border-gray-200 rounded-lg bg-white p-4 h-full"
                                        >
                                            <div class="mb-4">
                                                <h4 class="font-medium text-gray-900 mb-1">
                                                    {{ plugin.name }}
                                                </h4>
                                                <p class="text-xs text-gray-500">
                                                    {{ plugin.version }}
                                                </p>
                                            </div>

                                            <Form
                                                class="space-y-3"
                                                @submit="
                                                    (values: any) => onSubmit(values, plugin.name)
                                                "
                                            >
                                                <FormField
                                                    v-for="config in plugin.config"
                                                    :key="config"
                                                    v-slot="{ componentField }"
                                                    :name="config.name"
                                                >
                                                    <FormItem>
                                                        <FormLabel
                                                            class="text-sm font-medium text-gray-700"
                                                        >
                                                            {{ config.name }}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <SelectLicensePolicy
                                                                v-if="
                                                                    config.name === 'License Policy'
                                                                "
                                                                v-model:selected_license_policy="
                                                                    selected_license_policy
                                                                "
                                                            />
                                                            <Select
                                                                v-else-if="
                                                                    config.name === 'language'
                                                                "
                                                                v-bind="componentField"
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger
                                                                        class="border-gray-300 focus:ring-1 focus:ring-theme-primary focus:border-theme-primary"
                                                                    >
                                                                        <SelectValue
                                                                            placeholder="Select language"
                                                                        />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        <SelectItem
                                                                            value="javascript-typescript"
                                                                            >JavaScript/TypeScript</SelectItem
                                                                        >
                                                                        <SelectItem value="python"
                                                                            >Python</SelectItem
                                                                        >
                                                                        <SelectItem value="go"
                                                                            >Go</SelectItem
                                                                        >
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                            <Input
                                                                v-else
                                                                :placeholder="config.name"
                                                                v-bind="componentField"
                                                                class="border-gray-300 focus:ring-1 focus:ring-theme-primary focus:border-theme-primary"
                                                            />
                                                        </FormControl>
                                                        <FormDescription
                                                            v-if="config.description"
                                                            class="text-xs text-gray-500"
                                                        >
                                                            {{ config.description }}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                </FormField>
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    class="w-full bg-gray-900 hover:bg-gray-800 text-white"
                                                    @click="(e: any) => addIcon(e)"
                                                >
                                                    <Icon
                                                        icon="solar:check-circle-linear"
                                                        class="h-4 w-4 mr-1"
                                                    />
                                                    Validate
                                                </Button>
                                            </Form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Schedule Configuration -->
                <div class="space-y-4">
                    <ScheduleSelector v-model="scheduleData" />
                </div>

                <!-- Create Analysis Button - More prominent -->
                <div class="border-t border-gray-200 pt-6 mt-8">
                    <div class="flex justify-center">
                        <Button
                            size="lg"
                            class="px-8 bg-theme-primary hover:bg-theme-primary/90 text-white font-medium"
                            :disabled="loading"
                            @click="createAnalysisStart"
                        >
                            <Icon
                                v-if="loading"
                                icon="eos-icons:loading"
                                class="h-4 w-4 mr-2 animate-spin"
                            />
                            {{ loading ? 'Creating Analysis...' : 'Create Analysis' }}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
