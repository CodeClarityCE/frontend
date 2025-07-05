<script lang="ts" setup>
import { onMounted, ref, type Ref } from 'vue';
import * as yup from 'yup';
import { APIErrors } from '@/utils/api/ApiErrors';
import { Form } from 'vee-validate';
import LoadingSubmitButton from '@/base_components/ui/loaders/LoadingSubmitButton.vue';
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';
import { AuthRepository } from '@/codeclarity_components/authentication/auth.repository';
import router from '@/router';
import { Icon } from '@iconify/vue';
import FormTextField from '@/base_components/forms/FormTextField.vue';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';

// Repositories
const authRepository: AuthRepository = new AuthRepository();

// State
const nonRecoverableError: Ref<boolean> = ref(false);
const loadingButtonRef: any = ref(null);
const token: Ref<string> = ref('');
const userIdHash: Ref<string> = ref('');
const success: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const validationError: Ref<ValidationError | undefined> = ref();

// Form Data
const formPassword: Ref<string> = ref('');
const formPasswordConfirmation: Ref<string> = ref('');

// Form Validation
const formValidationSchema = yup.object({
    new_password: yup
        .string()
        .required('Please enter your new password')
        .min(10, 'Too short')
        .max(75, 'Too long'),
    new_password_confirmation: yup
        .string()
        .test('passwords-match', 'Passwords must match', function (value) {
            return this.parent.new_password === value;
        })
});

// Methods
async function submit() {
    loadingButtonRef.value.setLoading(true);
    loadingButtonRef.value.setDisabled(true);

    success.value = false;
    errorCode.value = undefined;
    error.value = false;
    validationError.value = undefined;

    try {
        await authRepository.resetPassword({
            data: {
                new_password: formPassword.value,
                new_password_confirmation: formPasswordConfirmation.value,
                token: token.value,
                user_id_hash: userIdHash.value
            },
            handleBusinessErrors: true
        });

        success.value = true;
    } catch (_err) {
        error.value = true;

        if (_err instanceof ValidationError) {
            errorCode.value = _err.error_code;
            validationError.value = _err;
        } else if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
            if (
                _err.error_code == APIErrors.PasswordResetTokenInvalidOrExpired ||
                _err.error_code == APIErrors.InternalError
            ) {
                nonRecoverableError.value = true;
            }
        }
    } finally {
        loadingButtonRef.value.setLoading(false);
        loadingButtonRef.value.setDisabled(false);
    }
}

// Life cycle
onMounted(() => {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    // Token
    const _token = searchParams.get('token');

    // User id hash
    const _userIdHash = searchParams.get('userid');

    if (!_token || !_userIdHash) {
        router.push('/login');
        return;
    }

    token.value = _token;
    userIdHash.value = _userIdHash;
});
</script>
<template>
    <div class="password-reset-wrapper">
        <!-- Not submitted OR form error -->
        <div v-if="!success && !nonRecoverableError" class="password-reset-inner-wrapper">
            <div>
                <div class="title">Password Reset</div>
                <div class="subtitle">To reset your password, enter your email below</div>
            </div>

            <div style="display: flex; flex-direction: column; row-gap: 2rem">
                <Alert v-if="error" variant="destructive">
                    <AlertDescription class="flex-row flex-row-05rem">
                        <Icon icon="material-symbols:error-outline" />
                        <div v-if="errorCode">
                            <div
                                v-if="errorCode == APIErrors.ValidationFailed"
                                style="white-space: break-spaces"
                            >
                                <!-- Note: this should never happen unless our client and server side validation are out of sync -->
                                {{ validationError!.toMessage('Invalid form:') }}
                            </div>
                            <div v-else-if="errorCode == APIErrors.PasswordsDoNotMatch">
                                Passwords do not match.
                            </div>
                            <div v-else>An error occured during the processing of the request.</div>
                        </div>
                        <div v-else>An error occured during the processing of the request.</div>
                    </AlertDescription>
                </Alert>

                <Form
                    style="display: flex; flex-direction: column; row-gap: 1.5rem"
                    name="password_reset_form"
                    :validation-schema="formValidationSchema"
                    @submit="submit"
                >
                    <FormTextField
                        v-model="formPassword"
                        :placeholder="'Enter your new password'"
                        :type="'password'"
                        :name="'new_password'"
                    >
                        <template #name>New password</template>
                    </FormTextField>
                    <FormTextField
                        v-model="formPasswordConfirmation"
                        :placeholder="'Confirm your new password'"
                        :type="'password'"
                        :name="'new_password_comfirmation'"
                    >
                        <template #name>Confirm the new password</template>
                    </FormTextField>

                    <LoadingSubmitButton ref="loadingButtonRef">
                        <span>Update password</span>
                    </LoadingSubmitButton>
                </Form>
            </div>
        </div>

        <!-- A non-recoverable error -->
        <div v-else-if="nonRecoverableError" class="password-reset-inner-wrapper">
            <div class="flex-column flex-column-20">
                <div>
                    <div class="title">Failed</div>
                    <div
                        v-if="errorCode == APIErrors.PasswordResetTokenInvalidOrExpired"
                        class="subtitle"
                    >
                        Your password was
                        <span style="font-weight: 900; text-decoration: underline">not</span> reset
                        because the password reset has expired. Please request a new password reset
                        and click on the link in the email.<br /><br />
                        Note: the link in the email is only valid for 5 minutes.
                    </div>
                    <div v-else class="subtitle">
                        An error occured during the processing of the request.
                    </div>
                </div>
                <div
                    style="
                        display: flex;
                        flex-direction: row;
                        justify-content: space-between;
                        column-gap: 1rem;
                    "
                >
                    <RouterLink
                        class="filled-button router-link-button"
                        :to="{ name: 'recoveryRequest' }"
                        style="width: 100%"
                    >
                        Request a new password reset
                    </RouterLink>
                    <RouterLink
                        class="bordered-button router-link-button"
                        :to="{ name: 'login' }"
                        style="width: 100%"
                    >
                        Back to login
                    </RouterLink>
                </div>
            </div>
        </div>

        <!-- Password Reset Succeeded -->
        <div v-else-if="success" class="password-reset-inner-wrapper">
            <div>
                <div class="title">Success</div>
                <div class="subtitle">Your password has been succesfully updated.</div>
            </div>
            <div
                style="
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    column-gap: 1rem;
                "
            >
                <RouterLink
                    class="filled-button router-link-button"
                    :to="{ name: 'login' }"
                    style="width: 100%"
                >
                    Back to login
                </RouterLink>
            </div>
        </div>
    </div>
</template>
