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
    <div class="flex flex-row gap-8 p-12">
        <div class="flex flex-col gap-8" style="width: 48%">
            <div class="flex flex-col gap-1">
                <div class="flex flex-row gap-2 items-center" style="font-size: 2em">
                    <Icon icon="devicon:github" class="icon integration-icon"></Icon>
                    <div>Github</div>
                </div>
                <div v-if="mode == FormMode.CREATE">
                    Link your Github account by entering a classic token below.
                </div>
                <div v-else-if="mode == FormMode.UPDATE">
                    Update your Github integration by entering a new classic token below.
                </div>
            </div>

            <Alert v-if="error" variant="destructive">
                <AlertDescription>
                    <div class="flex flex-row gap-2 items-center">
                        <Icon icon="material-symbols:error-outline" />
                        <div v-if="errorCode">
                            <div
                                v-if="
                                    errorCode == APIErrors.IntegrationTokenExpired ||
                                    errorCode == APIErrors.IntegrationInvalidToken ||
                                    errorCode == APIErrors.IntegrationWrongTokenType
                                "
                            >
                                Your token appears invalid or expired.
                            </div>
                            <div
                                v-else-if="
                                    errorCode ==
                                    APIErrors.IntegrationIntegrationTokenMissingPermissions
                                "
                            >
                                Your token does not have the required permissions. Please select
                                both <span class="code-bubble">repo</span> and
                                <span class="code-bubble">write:org</span> scopes.
                            </div>
                            <div v-else-if="errorCode == APIErrors.DuplicateIntegration">
                                You already have an integration with Github.
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
                            <div
                                v-else-if="errorCode == APIErrors.ValidationFailed"
                                style="white-space: break-spaces"
                            >
                                <!-- Note: this should never happen unless our client and server side validation are out of sync -->
                                {{ validationError!.toMessage('Invalid form:') }}
                            </div>
                            <div v-else-if="errorCode == APIErrors.NotAuthorized">
                                You are not authorized to perform this action.
                            </div>
                            <div v-else>An error occured during the processing of the request.</div>
                        </div>
                        <div v-else>An error occured during the processing of the request.</div>
                    </div>
                </AlertDescription>
            </Alert>

            <Form
                class="normal-form"
                :validation-schema="formValidationSchema"
                style="row-gap: 20px"
                @submit="submit"
            >
                <FormTextField
                    v-model="formPersonalClassicToken"
                    :placeholder="'Enter a Github classic token'"
                    :type="'text'"
                    :name="'token'"
                >
                    <template #name>Classic token</template>
                </FormTextField>

                <LoadingSubmitButton ref="loadingButtonRef" style="width: fit-content">
                    <span v-if="mode == FormMode.CREATE">Link Github</span>
                    <span v-else-if="mode == FormMode.UPDATE">Update Github integration</span>
                </LoadingSubmitButton>
            </Form>
        </div>
        <div class="flex flex-col gap-5" style="width: 48%">
            <div class="flex flex-col gap-1 flex-column-5">
                <div class="flex flex-row gap-2 items-center" style="font-size: 2em">
                    <div v-if="mode == FormMode.CREATE">Creating a classic token</div>
                    <div v-else-if="mode == FormMode.UPDATE">Updating a classic token</div>
                </div>
            </div>
            <div class="flex flex-col gap-4">
                <Alert>
                    <AlertDescription class="flex flex-col gap-2 p-4">
                        <div>
                            To save you some time we have prefilled a token with the correct
                            permissions:
                        </div>

                        <a
                            target="_blank"
                            class="clear-button flex flex-row gap-1 w-fit items-center"
                            href="https://github.com/settings/tokens/new?description=CodeClarity&scopes=public_repo"
                        >
                            <Button>
                                <Icon icon="devicon:github" class="icon integration-icon"></Icon>
                                Prefilled classic token
                            </Button>
                        </a>

                        <div>
                            (1) Select an expiration time that fits your security policy.<br />
                            (2) Click "Generate token".<br />
                        </div>

                        <div>
                            Copy and paste the newly created token in the field labeled "Classic
                            token" within this page.
                        </div>
                    </AlertDescription>
                </Alert>
                <Alert>
                    <AlertDescription class="flex flex-col gap-5 p-4">
                        <div class="flex flex-col gap-2">
                            <div>Alternatively, create a token manually:</div>

                            <a
                                target="_blank"
                                class="clear-button flex flex-row gap-1 w-fit items-center"
                                href="https://github.com/settings/tokens/new"
                            >
                                <Button>
                                    <Icon
                                        icon="devicon:github"
                                        class="icon integration-icon"
                                    ></Icon>
                                    Manually create an access token
                                </Button>
                            </a>

                            <div>
                                (1) Enter a name, such as "CodeClarity".<br />
                                (2) Select both <span class="code-bubble">repo</span> and
                                <span class="code-bubble">write:org</span> scopes.<br />
                                (3) Select an expiration time that fits your security policy.<br />
                                (4) Click "Generate Token".<br />
                            </div>

                            <div>
                                Copy and paste the newly created token in the field labeled "Classic
                                token" within this page.
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    </div>
</template>
<style scoped lang="scss">
@use '@/assets/colors.scss';
@use '@/assets/common/form.scss';
</style>
