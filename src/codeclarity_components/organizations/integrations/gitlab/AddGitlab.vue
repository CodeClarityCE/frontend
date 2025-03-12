<script lang="ts" setup>
import LoadingSubmitButton from '@/base_components/LoadingSubmitButton.vue';
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
import CenteredModal from '@/base_components/CenteredModal.vue';
import { ValidationError as YupValidationError } from 'yup';
import { successToast } from '@/utils/toasts';
import FormTextField from '@/base_components/forms/FormTextField.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';

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
                name: 'orgManage',
                params: { orgId: orgId.value, page: 'integrations' }
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
    <div class="flex flex-row gap-8 p-12">
        <div class="flex flex-col gap-5" style="width: 48%">
            <div class="flex flex-col gap-1">
                <div class="flex flex-row gap-2 items-center" style="font-size: 2em">
                    <Icon icon="devicon:gitlab" class="icon integration-icon"></Icon>
                    <div>GitLab</div>
                </div>
                <div v-if="mode == FormMode.CREATE">
                    Link your GitLab account by entering a personal access token below.
                </div>
                <div v-else-if="mode == FormMode.UPDATE">
                    Update your GitLab integration by entering a personal access token below.
                </div>
            </div>

            <Alert v-if="error" variant="destructive">
                <AlertDescription class="flex flex-row gap-2 items-center">
                    <Icon icon="material-symbols:error-outline" />
                    <div v-if="errorCode">
                        <div v-if="
                            errorCode == APIErrors.IntegrationTokenExpired ||
                            errorCode == APIErrors.IntegrationInvalidToken ||
                            errorCode == APIErrors.IntegrationWrongTokenType
                        ">
                            Your token appears invalid or expired.
                        </div>
                        <div v-else-if="
                            errorCode ==
                            APIErrors.IntegrationIntegrationTokenMissingPermissions
                        ">
                            Your token does not have the required permissions. Please select
                            both <span class="code-bubble">api</span> and
                            <span class="code-bubble">read_user</span> scopes.
                        </div>
                        <div v-else-if="errorCode == APIErrors.DuplicateIntegration">
                            You already have an integration with GitLab for the same host.
                        </div>
                        <div v-else-if="errorCode == APIErrors.EntityNotFound">
                            <div v-if="mode == FormMode.CREATE">
                                This should not have happened. Please try again.
                                <!-- Race condition -->
                            </div>
                            <div v-if="mode == FormMode.UPDATE">
                                The integration you are trying to update does not exist.
                            </div>
                        </div>
                        <div v-else-if="errorCode == APIErrors.ValidationFailed" style="white-space: break-spaces">
                            <!-- Note: this should never happen unless our client and server side validation are out of sync -->
                            {{ validationError!.toMessage('Invalid form:') }}
                        </div>
                        <div v-else-if="errorCode == APIErrors.NotAuthorized">
                            You are not authorized to perform this action.
                        </div>
                        <div v-else>An error occured during the processing of the request.</div>
                    </div>
                    <div v-else>An error occured during the processing of the request.</div>
                </AlertDescription>
            </Alert>

            <Form class="normal-form" :validation-schema="formValidationSchema" style="row-gap: 20px" @submit="submit">
                <FormTextField v-model="formPersonalAccessToken" :placeholder="'Enter a Gitlab personal access token'"
                    :type="'text'" :name="'token'">
                    <template #name>Personal access token</template>
                </FormTextField>

                <div class="flex flex-col gap-4 gitlab-host-selection">
                    <div>GitLab instance</div>
                    <div class="flex flex-row gap-4" style="text-align: center">
                        <div class="gitlab-host-selection-container" @click="setSelfHosted(false)">

                            <Button class="w-full h-16" variant="outline">GitLab.com</Button>
                            <div class="active" v-if="selfHosted == false">
                                <Icon class="icon" icon="fluent:checkmark-12-filled"></Icon>
                            </div>
                        </div>
                        <div class="gitlab-host-selection-container" @click="setSelfHosted(true)">
                            <Button class="w-full h-16 flex flex-col gap-2" variant="outline">
                                <div>Self hosted</div>
                                <div v-if="selfHosted == true">
                                    {{ formGitlabInstanceUrl }}
                                </div>
                            </Button>
                            <div class="active" v-if="selfHosted == true">
                                <Icon class="icon" icon="fluent:checkmark-12-filled"></Icon>
                            </div>
                        </div>
                    </div>
                    <LoadingSubmitButton ref="loadingButtonRef">
                        <span v-if="mode == FormMode.CREATE">Link GitLab</span>
                        <span v-else-if="mode == FormMode.UPDATE">Update GitLab integration</span>
                    </LoadingSubmitButton>
                </div>
            </Form>
        </div>
        <div class="flex flex-col gap-5" style="width: 48%">
            <div class="flex flex-col gap-1">
                <div class="flex flex-row gap-2 items-center" style="font-size: 2em">
                    <div v-if="mode == FormMode.CREATE">Creating a personal access token</div>
                    <div v-if="mode == FormMode.UPDATE">Updating a personal access token</div>
                </div>
            </div>
            <div class="flex flex-col gap-4 flex-column-15rem">
                <Alert>
                    <AlertDescription class="flex flex-col gap-2 p-4">
                        <div>
                            To save you some time we have prefilled a token with the correct
                            permissions:
                        </div>
                        <a target="_blank" class="clear-button flex flex-row gap-1 w-fit items-center" :href="formGitlabInstanceUrl +
                            '/-/profile/personal_access_tokens?name=CodeClarity+Access+token&scopes=api,read_user'
                            ">
                            <Button>
                                <Icon icon="devicon:gitlab" class="icon integration-icon"></Icon>
                                Prefilled access token
                            </Button>
                        </a>

                        <div>
                            (1) Click on "Add new token" on the top right.<br />
                            (2) Select an expiration time that fits your security policy.<br />
                            (3) Click "Create personal access token".<br />
                        </div>

                        <div>
                            Copy and paste the newly created token in the field labeled
                            "Personal access token" within this page.
                        </div>
                    </AlertDescription>
                </Alert>
                <Alert>
                    <AlertDescription class="flex flex-col gap-5 p-4">
                        <div class="flex flex-col gap-2">
                            <div>Alternatively, create a token manually:</div>

                            <a target="_blank" class="clear-button flex flex-row gap-1 w-fit items-center" :href="formGitlabInstanceUrl + '/-/profile/personal_access_tokens'
                                ">
                                <Button>
                                    <Icon icon="devicon:gitlab" class="icon integration-icon"></Icon>
                                    Manually create an access token
                                </Button>
                            </a>

                            <div>
                                (1) Click on "Add new token" on the top right.<br />
                                (2) Enter a name, such as "CodeClarity".<br />
                                (3) Select both <span class="code-bubble">api</span> and
                                <span class="code-bubble">read_user</span> scopes.<br />
                                (4) Select an expiration time that fits your security policy.<br />
                                (5) Click "Create personal access token".<br />
                            </div>

                            <div>
                                Copy and paste the newly created token in the field labeled
                                "Personal access token" within this page.
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    </div>
    <CenteredModal ref="selfHostedModalRef">
        <template #title>
            <div>Enter the url of your self-hosted GitLab instance.</div>
        </template>
        <template #content>
            <div style="
                    display: flex;
                    flex-direction: column;
                    row-gap: 1.5em;
                    max-width: 400px;
                    width: 100vw;
                ">
                <input type="text" v-model="formGitlabInstanceUrl" @input="validateGitlabInstanceUrl" />
                <div style="color: red">{{ formGitlabInstanceUrlError }}</div>
            </div>
        </template>
        <template #buttons>
            <Button @click="selfHostedModalRef.toggle()">
                Done
            </Button>
        </template>
    </CenteredModal>
</template>
<style scoped lang="scss">
@use '@/assets/colors.scss';
@use '@/assets/common/form.scss';

.gitlab-host-selection-container {
    position: relative;
    width: 100%;

    .active {
        position: absolute;
        top: -5px;
        right: -5px;
        z-index: 1;
        color: #fff;
        font-weight: bold;
        background-color: #fff;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid green;
    }

    .active .icon {
        z-index: 2;
        color: green;
        position: absolute;
        right: 1px;
        top: 1px;
    }
}
</style>
