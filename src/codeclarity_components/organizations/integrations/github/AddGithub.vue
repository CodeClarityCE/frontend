<script lang="ts" setup>
import LoadingSubmitButton from '@/base_components/ui/loaders/LoadingSubmitButton.vue';
import { Form } from 'vee-validate';
import { ref, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useRoute } from 'vue-router';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { IntegrationsRepository } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import { GithubTokenType } from '@/codeclarity_components/organizations/integrations/integration_add.http';
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';
import * as yup from 'yup';
import { APIErrors } from '@/utils/api/ApiErrors';
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
const githubClassicTokenRegex = /^ghp_[a-zA-Z0-9]{36}$/;

// Stores
const authStore = useAuthStore();

// Repositories
const integrationRepo: IntegrationsRepository = new IntegrationsRepository();

// State
const validationError: Ref<ValidationError | undefined> = ref();
const loadingButtonRef: any = ref(null);
const orgId: Ref<string> = ref('');
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const mode: Ref<FormMode> = ref(FormMode.CREATE);
const updateId: Ref<string | undefined> = ref();

// Form Data
const formPersonalClassicToken: Ref<string> = ref('');

async function submit() {
    loadingButtonRef.value.setLoading(true);
    loadingButtonRef.value.setDisabled(true);

    if (!orgId.value) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    validationError.value = undefined;

    try {
        if (mode.value == FormMode.CREATE) {
            await integrationRepo.addGithubIntegration({
                orgId: orgId.value,
                bearerToken: authStore.getToken,
                data: {
                    token: formPersonalClassicToken.value,
                    token_type: GithubTokenType.CLASSIC_TOKEN
                }
            });
            successToast('Successfully added the integration');
            router.push({
                name: 'orgs',
                params: { orgId: orgId.value, page: 'integrations', action: 'manage' }
            });
        } else if (mode.value == FormMode.UPDATE) {
            await integrationRepo.updateGithubIntegration({
                orgId: orgId.value,
                integrationId: updateId.value!,
                bearerToken: authStore.getToken,
                data: {
                    token: formPersonalClassicToken.value,
                    token_type: GithubTokenType.CLASSIC_TOKEN
                }
            });
            successToast('Successfully updated the integration');
            router.push({
                name: 'orgs',
                params: { orgId: orgId.value, page: 'integrations', action: 'manage' }
            });
        }

        formPersonalClassicToken.value = '';
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
        .required('Enter a Github classic token')
        .matches(githubClassicTokenRegex, 'Please enter a valid Github classic token')
});

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
                title="GitHub Integration"
                description="Connect your GitHub repositories for comprehensive security analysis and vulnerability detection"
                icon="devicon:github"
                variant="primary"
                class="mb-8 shadow-lg"
            />

            <div class="grid lg:grid-cols-2 gap-8">
                <!-- Left Column - Configuration Form -->
                <InfoCard
                    :title="
                        mode === FormMode.CREATE
                            ? 'Add GitHub Integration'
                            : 'Update GitHub Integration'
                    "
                    :description="
                        mode === FormMode.CREATE
                            ? 'Link your GitHub account by entering a classic token with the required permissions'
                            : 'Update your GitHub integration credentials and permissions'
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
                                        >repo</span
                                    >
                                    and
                                    <span class="px-2 py-1 bg-gray-200 rounded text-sm font-mono"
                                        >write:org</span
                                    >
                                    scopes.
                                </div>
                                <div
                                    v-else-if="errorCode == APIErrors.DuplicateIntegration"
                                    class="text-red-700"
                                >
                                    You already have an integration with GitHub.
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
                                v-model="formPersonalClassicToken"
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                type="password"
                                name="token"
                                class="bg-white border-gray-300 focus:border-theme-primary focus:ring-theme-primary/20"
                            >
                                <template #name>
                                    <div class="flex items-center gap-2">
                                        <Icon icon="solar:key-bold" class="text-theme-primary" />
                                        <span class="text-sm font-semibold text-theme-black"
                                            >GitHub Classic Token</span
                                        >
                                    </div>
                                </template>
                            </FormTextField>
                            <p class="text-xs text-theme-gray">
                                Enter your GitHub personal access token (classic) with repo and
                                write:org scopes
                            </p>
                        </div>

                        <LoadingSubmitButton
                            ref="loadingButtonRef"
                            class="w-full bg-theme-black hover:bg-theme-gray text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                        >
                            <Icon icon="mdi:github" class="mr-2 text-lg text-white" />
                            <span v-if="mode == FormMode.CREATE">Connect GitHub Integration</span>
                            <span v-else-if="mode == FormMode.UPDATE"
                                >Update GitHub Integration</span
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
                                        Select the appropriate token type based on whether you need
                                        access to private repositories or only public ones.
                                    </p>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <a
                                    target="_blank"
                                    href="https://github.com/settings/tokens/new?description=CodeClarity&scopes=repo,write:org"
                                    class="inline-block"
                                >
                                    <Button
                                        class="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        <Icon icon="mdi:github" class="mr-2 text-lg text-white" />
                                        <div class="text-left">
                                            <div class="text-sm">Full Access</div>
                                            <div class="text-xs opacity-90">
                                                Public + Private Repos
                                            </div>
                                        </div>
                                    </Button>
                                </a>

                                <a
                                    target="_blank"
                                    href="https://github.com/settings/tokens/new?description=CodeClarity+Public&scopes=public_repo"
                                    class="inline-block"
                                >
                                    <Button
                                        variant="outline"
                                        class="w-full border-gray-600 text-gray-700 hover:bg-gray-50 font-semibold px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        <Icon icon="mdi:github" class="mr-2 text-lg" />
                                        <div class="text-left">
                                            <div class="text-sm">Public Only</div>
                                            <div class="text-xs opacity-70">Public Repos Only</div>
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
                                            >Choose "Full Access" for private repos or "Public Only"
                                            for public repos</span
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
                                            >Click "Generate token" button</span
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
                                    href="https://github.com/settings/tokens/new"
                                    class="inline-block"
                                >
                                    <Button
                                        variant="outline"
                                        class="border-gray-300 hover:border-gray-400 font-semibold px-6 py-3 rounded-lg transition-all duration-200"
                                    >
                                        <Icon icon="mdi:github" class="mr-2 text-lg" />
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
                                            >Enter a descriptive name, such as "CodeClarity"</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >2</span
                                        >
                                        <div class="flex-1">
                                            <span class="text-sm text-theme-gray block mb-2"
                                                >Select the required scopes based on your
                                                needs:</span
                                            >
                                            <div class="space-y-2">
                                                <div>
                                                    <div
                                                        class="text-xs font-semibold text-gray-700 mb-1"
                                                    >
                                                        For private repositories:
                                                    </div>
                                                    <div class="flex flex-wrap gap-2">
                                                        <span
                                                            class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-mono"
                                                        >
                                                            <Icon
                                                                icon="solar:check-circle-bold"
                                                                class="text-theme-primary"
                                                            />
                                                            repo
                                                        </span>
                                                        <span
                                                            class="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-mono"
                                                        >
                                                            <Icon
                                                                icon="solar:check-circle-bold"
                                                                class="text-theme-primary"
                                                            />
                                                            write:org
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div
                                                        class="text-xs font-semibold text-gray-700 mb-1"
                                                    >
                                                        For public repositories only:
                                                    </div>
                                                    <div class="flex flex-wrap gap-2">
                                                        <span
                                                            class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 border border-blue-300 rounded-full text-xs font-mono"
                                                        >
                                                            <Icon
                                                                icon="solar:check-circle-bold"
                                                                class="text-blue-600"
                                                            />
                                                            public_repo
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >3</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Select an expiration time that fits your security
                                            policy</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >4</span
                                        >
                                        <span class="text-sm text-theme-gray"
                                            >Click "Generate Token" button</span
                                        >
                                    </li>
                                    <li class="flex items-start gap-3">
                                        <span
                                            class="flex-shrink-0 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                                            >5</span
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
</template>
<style scoped lang="scss">
/* Custom styles if needed - most styling is now handled by Tailwind classes */
</style>
