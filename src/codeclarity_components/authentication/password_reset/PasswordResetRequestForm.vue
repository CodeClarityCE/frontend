<script lang="ts" setup>
import { ref, type Ref } from 'vue';
import * as z from 'zod';
import { APIErrors } from '@/utils/api/ApiErrors';
import { Form } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import LoadingSubmitButton from '@/base_components/ui/loaders/LoadingSubmitButton.vue';
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';
import { AuthRepository } from '@/codeclarity_components/authentication/auth.repository';
import { Icon } from '@iconify/vue';
import FormTextField from '@/base_components/forms/FormTextField.vue';

// Repositories
const authRepository: AuthRepository = new AuthRepository();

// State
const loadingButtonRef: any = ref(null);
const success: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const validationError: Ref<ValidationError | undefined> = ref();

// Form Data
const formEmail: Ref<string> = ref('');

// Form Validation
const formValidationSchema = toTypedSchema(
    z.object({
        email: z.string().min(1, 'Please enter your email').email('Please enter a valid email')
    })
);

// Methods
async function submit() {
    loadingButtonRef.value.setLoading(true);
    loadingButtonRef.value.setDisabled(true);

    errorCode.value = undefined;
    success.value = false;
    error.value = false;
    validationError.value = undefined;

    try {
        await authRepository.requestPasswordReset({
            data: { email: formEmail.value },
            handleBusinessErrors: true
        });

        success.value = true;
    } catch (_error) {
        error.value = true;

        if (_error instanceof ValidationError) {
            errorCode.value = _error.error_code;
            validationError.value = _error;
        } else if (_error instanceof BusinessLogicError) {
            errorCode.value = _error.error_code;
        }
    } finally {
        loadingButtonRef.value.setLoading(false);
        loadingButtonRef.value.setDisabled(false);
    }
}
</script>
<template>
    <div class="flex flex-col justify-center items-center my-20">
        <div v-if="!success" class="max-w-lg w-full flex flex-col">
            <h2 class="text-3xl font-bold tracking-tight">Password Reset</h2>

            <div class="flex flex-col gap-8">
                <div v-if="error">
                    <div class="mt-2">
                        <div class="text-destructive font-light">
                            <div class="flex flex-row items-center gap-2">
                                <Icon icon="material-symbols:error-outline" />
                                <div v-if="errorCode">
                                    <div
                                        v-if="errorCode == APIErrors.ValidationFailed"
                                        style="white-space: break-spaces"
                                    >
                                        <!-- Note: this should never happen unless our client and server side validation are out of sync -->
                                        {{ validationError!.toMessage('Invalid form:') }}
                                    </div>
                                    <div v-else>
                                        An error occured during the processing of the request.
                                    </div>
                                </div>
                                <div v-else>
                                    An error occured during the processing of the request.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Form
                    class="flex flex-col gap-4"
                    name="pasword_reset_request_form"
                    :validation-schema="formValidationSchema"
                    @submit="submit"
                >
                    <FormTextField
                        v-model.trim="formEmail"
                        :placeholder="'Enter your email'"
                        :type="'email'"
                        :name="'email'"
                    >
                        <template #name>Email</template>
                    </FormTextField>

                    <LoadingSubmitButton ref="loadingButtonRef"
                        >Request password reset</LoadingSubmitButton
                    >
                </Form>
            </div>
        </div>

        <div v-else class="max-w-md w-full flex flex-col gap-7">
            <div>
                <div class="text-4xl font-semibold mb-4 text-grayTitle">Success</div>
                <div class="text-gray-500 font-medium mb-4">
                    If a user is registered under that email, an email has been sent to complete the
                    password reset. Simply click on the link in the email and supply your new
                    password. If you dont see the email, check your spam.<br /><br />Note: the link
                    in the email is only valid for 5 minutes.
                </div>
            </div>
            <div class="flex flex-col justify-between gap-4">
                <RouterLink
                    class="rounded py-3 px-5 text-white shadow-md bg-theme-primary hover:bg-theme-primary-dark"
                    :to="{ name: 'login' }"
                    style="width: 100%"
                >
                    Back to login
                </RouterLink>
            </div>
        </div>
    </div>
</template>
