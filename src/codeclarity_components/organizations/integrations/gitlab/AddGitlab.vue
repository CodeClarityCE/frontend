<script lang="ts" setup>
import LoadingSubmitButton from '@/base_components/ui/loaders/LoadingSubmitButton.vue';
import { Form } from 'vee-validate';
import { ref, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useRoute } from 'vue-router';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { IntegrationsRepository } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import { GitlabTokenType } from '@/codeclarity_components/organizations/integrations/integration_add.http';
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';
import * as yup from 'yup';
import { APIErrors } from '@/utils/api/ApiErrors';
import CenteredModal from '@/base_components/ui/modals/CenteredModal.vue';
import { ValidationError as YupValidationError } from 'yup';
import { successToast } from '@/utils/toasts';
import FormTextField from '@/base_components/forms/FormTextField.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';

enum FormMode {
    UPDATE = 'UPDATE',
    CREATE = 'CREATE'
}

// Constants
const gitlabPersonalAccessTokenRegex = /glpat-[0-9a-zA-Z\-_]{20}/;

// Stores
const authStore = useAuthStore();

// Repositories
const integrationRepo: IntegrationsRepository = new IntegrationsRepository();

// State
const validationError: Ref<ValidationError | undefined> = ref();
const selfHostedModalRef: any = ref(null);
const loadingButtonRef: any = ref(null);
const orgId: Ref<string> = ref('');
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const selfHosted: Ref<boolean> = ref(false);
const mode: Ref<FormMode> = ref(FormMode.CREATE);
const updateId: Ref<string | undefined> = ref();

// Form Data
const formPersonalAccessToken: Ref<string> = ref('');
const formGitlabInstanceUrl: Ref<string> = ref('https://gitlab.com');
const formGitlabInstanceUrlError: Ref<string> = ref('');

async function setSelfHosted(_selfHosted: boolean) {
    if (_selfHosted == true) {
        selfHosted.value = true;
        selfHostedModalRef.value.toggle();
    } else {
        selfHosted.value = false;
        formGitlabInstanceUrl.value = 'https://gitlab.com';
    }
}

async function submit() {
    loadingButtonRef.value.setLoading(true);
    loadingButtonRef.value.setDisabled(true);

    if (!orgId.value) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    validationError.value = undefined;

    try {
        let url = formGitlabInstanceUrl.value;
        url = url.endsWith('/') ? url.slice(0, -1) : url;

        if (mode.value == FormMode.CREATE) {
            await integrationRepo.addGitlabIntegration({
                orgId: orgId.value,
                bearerToken: authStore.getToken,
                data: {
                    token: formPersonalAccessToken.value,
                    token_type: GitlabTokenType.PERSONAL_ACCESS_TOKEN,
                    gitlab_instance_url: url
                }
            });
            successToast('Successfully added the integration');
            router.push({
                name: 'orgs',
                params: { orgId: orgId.value, page: 'integrations', action: 'manage' }
            });
        } else if (mode.value == FormMode.UPDATE) {
            await integrationRepo.updateGitlabIntegration({
                orgId: orgId.value,
                integrationId: updateId.value!,
                bearerToken: authStore.getToken,
                data: {
                    token: formPersonalAccessToken.value,
                    token_type: GitlabTokenType.PERSONAL_ACCESS_TOKEN,
                    gitlab_instance_url: url
                }
            });
            successToast('Successfully updated the integration');
            router.push({
                name: 'orgs',
                params: { orgId: orgId.value, page: 'integrations', action: 'manage' }
            });
        }

        formPersonalAccessToken.value = '';
        formGitlabInstanceUrl.value = 'https://gitlab.com';
    } catch (_err) {
        error.value = true;
        if (_err instanceof ValidationError) {
            errorCode.value = _err.error_code;
            validationError.value = _err;
        } else if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        loadingButtonRef.value.setLoading(false);
        loadingButtonRef.value.setDisabled(false);
    }
}

// Form Validation
const formValidationSchema = yup.object({
    token: yup
        .string()
        .required('Enter a GitLab personal access token')
        .matches(
            gitlabPersonalAccessTokenRegex,
            'Please enter a valid GitLab personal access token'
        )
});

const gitlabInstanceUrlValidationSchema = yup.object({
    url: yup
        .string()
        .required('Enter the url of the self-hosted GitLab instance')
        .url('Please enter a valid url')
});

async function validateGitlabInstanceUrl() {
    try {
        await gitlabInstanceUrlValidationSchema.validate({ url: formGitlabInstanceUrl.value });
        formGitlabInstanceUrlError.value = '';
    } catch (err) {
        if (err instanceof YupValidationError) {
            formGitlabInstanceUrlError.value = err.message;
        }
    }
}

async function init() {
    const route = useRoute();
    const _orgId = route.params.orgId;

    if (!_orgId) {
        router.back();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const _updateId = urlParams.get('update');

    if (typeof _updateId == 'string') {
        updateId.value = _updateId;
        mode.value = FormMode.UPDATE;
    }

    if (typeof _orgId == 'string') {
        orgId.value = _orgId;
    } else {
        router.back();
    }
}

init();
</script>
<template>
    <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Page Header -->
            <InfoCard
                title="GitLab Integration"
                description="Connect your GitLab repositories for comprehensive security analysis and vulnerability detection"
                icon="devicon:gitlab"
                variant="primary"
                class="mb-8 shadow-lg"
            />

            <div class="grid lg:grid-cols-2 gap-8">
                <!-- Left Column - Configuration Form -->
                <InfoCard
                    :title="
                        mode === FormMode.CREATE
                            ? 'Add GitLab Integration'
                            : 'Update GitLab Integration'
                    "
                    :description="
                        mode === FormMode.CREATE
                            ? 'Link your GitLab account by entering a personal access token with the required permissions'
                            : 'Update your GitLab integration credentials and permissions'
                    "
                    icon="solar:settings-bold"
                    variant="default"
                    class="shadow-md"
                >
                    <Alert v-if="error" variant="destructive" class="mb-6">
                        <AlertDescription class="flex flex-row gap-2 items-center">
                            <Icon icon="solar:danger-triangle-bold" class="text-red-500" />
                            <div v-if="errorCode">
                                <div
                                    v-if="
                                        errorCode == APIErrors.IntegrationTokenExpired ||
                                        errorCode == APIErrors.IntegrationInvalidToken ||
                                        errorCode == APIErrors.IntegrationWrongTokenType
                                    "
                                    class="text-red-700"
                                >
                                    Your token appears invalid or expired.
                                </div>
                                <div
                                    v-else-if="
                                        errorCode ==
                                        APIErrors.IntegrationIntegrationTokenMissingPermissions
                                    "
                                    class="text-red-700"
                                >
                                    Your token does not have the required permissions. Please select
                                    both
                                    <span class="px-2 py-1 bg-gray-200 rounded text-sm font-mono"
                                        >api</span
                                    >
                                    and
                                    <span class="px-2 py-1 bg-gray-200 rounded text-sm font-mono"
                                        >read_user</span
                                    >
                                    scopes.
                                </div>
                                <div
                                    v-else-if="errorCode == APIErrors.DuplicateIntegration"
                                    class="text-red-700"
                                >
                                    You already have an integration with GitLab for the same host.
                                </div>
                                <div
                                    v-else-if="errorCode == APIErrors.EntityNotFound"
                                    class="text-red-700"
                                >
                                    <div v-if="mode == FormMode.CREATE">
                                        This should not have happened. Please try again.
                                    </div>
                                    <div v-if="mode == FormMode.UPDATE">
                                        The integration you are trying to update does not exist.
                                    </div>
                                </div>
                                <div
                                    v-else-if="errorCode == APIErrors.ValidationFailed"
                                    class="text-red-700 whitespace-pre-line"
                                >
                                    {{ validationError!.toMessage('Invalid form:') }}
                                </div>
                                <div
                                    v-else-if="errorCode == APIErrors.NotAuthorized"
                                    class="text-red-700"
                                >
                                    You are not authorized to perform this action.
                                </div>
                                <div v-else class="text-red-700">
                                    An error occurred during the processing of the request.
                                </div>
                            </div>
                            <div v-else class="text-red-700">
                                An error occurred during the processing of the request.
                            </div>
                        </AlertDescription>
                    </Alert>

                    <Form
                        class="space-y-6"
                        :validation-schema="formValidationSchema"
                        @submit="submit"
                    >
                        <div class="space-y-2">
                            <FormTextField
                                v-model="formPersonalAccessToken"
                                placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                                type="password"
                                name="token"
                                class="bg-white border-gray-300 focus:border-theme-primary focus:ring-theme-primary/20 w-full"
                            >
                                <template #name>
                                    <div class="flex items-center gap-2">
                                        <Icon icon="solar:key-bold" class="text-theme-primary" />
                                        <span class="text-sm font-semibold text-theme-black"
                                            >Personal Access Token</span
                                        >
                                    </div>
                                </template>
                            </FormTextField>
                            <p class="text-xs text-theme-gray">
                                Your token should start with "glpat-" and have the required
                                permissions
                            </p>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <h4 class="text-lg font-semibold text-theme-black mb-2">
                                    GitLab Instance
                                </h4>
                                <p class="text-sm text-theme-gray mb-4">
                                    Choose your GitLab instance type
                                </p>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div
                                    class="relative cursor-pointer group"
                                    @click="setSelfHosted(false)"
                                >
                                    <Button
                                        type="button"
                                        class="w-full h-20 border-2 transition-all duration-200 hover:shadow-md"
                                        :class="
                                            !selfHosted
                                                ? 'border-theme-primary bg-theme-primary/5 shadow-md'
                                                : 'border-gray-300 hover:border-theme-primary/50'
                                        "
                                        variant="outline"
                                    >
                                        <div class="flex flex-col items-center gap-2">
                                            <Icon icon="devicon:gitlab" class="text-2xl" />
                                            <span class="font-medium">GitLab.com</span>
                                        </div>
                                    </Button>
                                </div>

                                <div
                                    class="relative cursor-pointer group"
                                    @click="setSelfHosted(true)"
                                >
                                    <Button
                                        type="button"
                                        class="w-full h-20 border-2 transition-all duration-200 hover:shadow-md"
                                        :class="
                                            selfHosted
                                                ? 'border-theme-primary bg-theme-primary/5 shadow-md'
                                                : 'border-gray-300 hover:border-theme-primary/50'
                                        "
                                        variant="outline"
                                    >
                                        <div class="flex flex-col items-center gap-2">
                                            <Icon
                                                icon="solar:server-bold"
                                                class="text-2xl text-gray-600"
                                            />
                                            <div class="text-center">
                                                <div class="font-medium">Self Hosted</div>
                                                <div
                                                    v-if="selfHosted"
                                                    class="text-xs text-theme-gray truncate max-w-[100px]"
                                                >
                                                    {{
                                                        formGitlabInstanceUrl.replace(
                                                            'https://',
                                                            ''
                                                        )
                                                    }}
                                                </div>
                                            </div>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <LoadingSubmitButton
                            ref="loadingButtonRef"
                            class="w-full bg-theme-black hover:bg-theme-gray text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                        >
                            <Icon icon="devicon:gitlab" class="mr-2 text-lg" />
                            <span v-if="mode == FormMode.CREATE">Connect GitLab Integration</span>
                            <span v-else-if="mode == FormMode.UPDATE"
                                >Update GitLab Integration</span
                            >
                        </LoadingSubmitButton>

                        <div
                            class="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                            <Icon
                                icon="solar:shield-check-bold"
                                class="text-blue-600 mt-0.5 flex-shrink-0"
                            />
                            <div class="text-xs text-blue-700">
                                <strong>Security Note:</strong> Your token is encrypted and stored
                                securely. We only use it to access your repositories for security
                                analysis.
                            </div>
                        </div>
                    </Form>
                </InfoCard>

                <!-- Right Column - Instructions -->
                <div class="space-y-6">
                    <InfoCard
                        title="Quick Setup"
                        description="Choose your access level and create a pre-configured token"
                        icon="solar:magic-stick-bold"
                        variant="primary"
                        class="shadow-md"
                    >
                        <div class="space-y-6">
                            <div
                                class="flex items-start gap-3 p-4 bg-gradient-to-r from-theme-primary/10 to-blue-50 rounded-lg border border-theme-primary/20"
                            >
                                <div
                                    class="flex-shrink-0 w-6 h-6 bg-theme-primary rounded-full flex items-center justify-center"
                                >
                                    <Icon icon="solar:star-bold" class="text-white text-sm" />
                                </div>
                                <div>
                                    <h4 class="font-semibold text-theme-black mb-1">
                                        Choose Your Access Level
                                    </h4>
                                    <p class="text-sm text-theme-gray">
                                        Select the appropriate token type based on the level of
                                        access you need for your GitLab repositories.
                                    </p>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <a
                                    target="_blank"
                                    :href="
                                        formGitlabInstanceUrl +
                                        '/-/user_settings/personal_access_tokens?name=CodeClarity+Full+Access&scopes=read_api,read_user,read_repository,self_rotate'
                                    "
                                    class="inline-block"
                                >
                                    <Button
                                        class="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        <Icon icon="mdi:gitlab" class="mr-2 text-lg text-white" />
                                        <div class="text-left">
                                            <div class="text-sm">Full Access</div>
                                            <div class="text-xs opacity-90">
                                                Complete API Access
                                            </div>
                                        </div>
                                    </Button>
                                </a>

                                <a
                                    target="_blank"
                                    :href="
                                        formGitlabInstanceUrl +
                                        '/-/user_settings/personal_access_tokens?name=CodeClarity+Repository+Only&scopes=read_repository'
                                    "
                                    class="inline-block"
                                >
                                    <Button
                                        variant="outline"
                                        class="w-full border-orange-600 text-orange-700 hover:bg-orange-50 font-semibold px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        <Icon icon="mdi:gitlab" class="mr-2 text-lg" />
                                        <div class="text-left">
                                            <div class="text-sm">Repository Only</div>
                                            <div class="text-xs opacity-70">
                                                Limited Repository Access
                                            </div>
                                        </div>
                                    </Button>
                                </a>
                            </div>

                            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div class="flex items-center gap-2 mb-3">
                                    <div
                                        class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                                    >
                                        <Icon
                                            icon="solar:list-check-bold"
                                            class="text-white text-xs"
                                        />
                                    </div>
                                    <h4 class="font-semibold text-theme-black">
                                        Follow these steps:
                                    </h4>
                                </div>
                                <ol class="space-y-2">
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-theme-primary text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >1</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Click "Add new token" on the top right</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-theme-primary text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >2</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Select an expiration time that fits your security
                                            policy</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-theme-primary text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >3</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Click "Create personal access token"</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-theme-primary text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >4</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Copy and paste the token in the form above</span
                                        >
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </InfoCard>

                    <InfoCard
                        title="Manual Setup"
                        description="Create a token manually with the required permissions"
                        icon="solar:settings-bold"
                        variant="default"
                        class="shadow-md"
                    >
                        <div class="space-y-6">
                            <div
                                class="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200"
                            >
                                <div
                                    class="flex-shrink-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                                >
                                    <Icon icon="solar:settings-bold" class="text-white text-sm" />
                                </div>
                                <div>
                                    <h4 class="font-semibold text-theme-black mb-1">
                                        Advanced Configuration
                                    </h4>
                                    <p class="text-sm text-theme-gray">
                                        For users who prefer to configure permissions manually or
                                        need custom settings.
                                    </p>
                                </div>
                            </div>

                            <div class="text-center">
                                <a
                                    target="_blank"
                                    :href="
                                        formGitlabInstanceUrl +
                                        '/-/user_settings/personal_access_tokens'
                                    "
                                    class="inline-block"
                                >
                                    <Button
                                        variant="outline"
                                        class="border-gray-300 hover:border-gray-400 font-semibold px-6 py-3 rounded-lg transition-all duration-200"
                                    >
                                        <Icon icon="devicon:gitlab" class="mr-2 text-lg" />
                                        Create Token Manually
                                    </Button>
                                </a>
                            </div>

                            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div class="flex items-center gap-2 mb-3">
                                    <div
                                        class="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
                                    >
                                        <Icon
                                            icon="solar:list-check-bold"
                                            class="text-white text-xs"
                                        />
                                    </div>
                                    <h4 class="font-semibold text-theme-black">
                                        Configuration steps:
                                    </h4>
                                </div>
                                <ol class="space-y-3">
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >1</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Click on "Add new token" on the top right</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >2</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Enter a descriptive name, such as "CodeClarity"</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >3</span
                                        >
                                        <div class="flex-1">
                                            <span class="text-sm text-theme-gray block mb-2"
                                                >Select these required scopes:</span
                                            >
                                            <div class="flex flex-wrap gap-2">
                                                <span
                                                    class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 border border-blue-200 rounded-full text-xs font-mono"
                                                >
                                                    <Icon
                                                        icon="solar:check-circle-bold"
                                                        class="text-theme-primary"
                                                    />
                                                    read_api
                                                </span>
                                                <span
                                                    class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-200 rounded-full text-xs font-mono"
                                                >
                                                    <Icon
                                                        icon="solar:check-circle-bold"
                                                        class="text-theme-primary"
                                                    />
                                                    read_user
                                                </span>
                                                <span
                                                    class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 border border-purple-200 rounded-full text-xs font-mono"
                                                >
                                                    <Icon
                                                        icon="solar:check-circle-bold"
                                                        class="text-theme-primary"
                                                    />
                                                    read_repository
                                                </span>
                                                <span
                                                    class="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 border border-orange-200 rounded-full text-xs font-mono"
                                                >
                                                    <Icon
                                                        icon="solar:check-circle-bold"
                                                        class="text-theme-primary"
                                                    />
                                                    self_rotate
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >4</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Select an expiration time that fits your security
                                            policy</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >5</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Click "Create personal access token"</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >6</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Copy and paste the token in the form on the left</span
                                        >
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </InfoCard>
                </div>
            </div>
        </div>
    </div>

    <!-- Self-hosted URL Modal -->
    <CenteredModal ref="selfHostedModalRef">
        <template #title>
            <div class="text-xl font-semibold text-theme-black">Self-hosted GitLab Instance</div>
        </template>
        <template #content>
            <div class="space-y-4 max-w-md">
                <p class="text-theme-gray">Enter the URL of your self-hosted GitLab instance:</p>
                <input
                    v-model="formGitlabInstanceUrl"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none transition-colors"
                    placeholder="https://gitlab.example.com"
                    @input="validateGitlabInstanceUrl"
                />
                <div v-if="formGitlabInstanceUrlError" class="text-red-500 text-sm">
                    {{ formGitlabInstanceUrlError }}
                </div>
            </div>
        </template>
        <template #buttons>
            <Button
                class="bg-theme-black hover:bg-theme-gray text-white"
                @click="selfHostedModalRef.toggle()"
            >
                Done
            </Button>
        </template>
    </CenteredModal>
</template>
<style scoped lang="scss">
/* Custom styles if needed - most styling is now handled by Tailwind classes */
</style>
