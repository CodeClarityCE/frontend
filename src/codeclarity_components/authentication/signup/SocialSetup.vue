<script lang="ts" setup>
import { ref, type Ref } from 'vue';
import router from '@/router';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { UserRepository } from '@/codeclarity_components/authentication/user.repository';
import * as z from 'zod';
import { Form } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import LoadingSubmitButton from '@/base_components/ui/loaders/LoadingSubmitButton.vue';
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';
import { Icon } from '@iconify/vue';
import { AuthRepository } from '@/codeclarity_components/authentication/auth.repository';
import type { AuthenticatedUser } from '@/codeclarity_components/authentication/authenticated_user.entity';
import { APIErrors } from '@/utils/api/ApiErrors';
import type { RefreshToken } from '@/codeclarity_components/authentication/refresh_token.entity';
import { SocialProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import FormTextField from '@/base_components/forms/FormTextField.vue';
import FormInlineCheckboxField from '@/base_components/forms/FormInlineCheckboxField.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import { Alert, AlertDescription } from '@/shadcn/ui/alert';

// Props
const props = defineProps<{
    provider: SocialProvider;
}>();

// Stores
const authStore = useAuthStore();
const userStore = useUserStore();

// Repositories
const userRepository: UserRepository = new UserRepository();
const authRepository: AuthRepository = new AuthRepository();

// State
const token = authStore.getToken;
const loadingButtonRef: any = ref(null);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const tokenRefreshedAlready: Ref<boolean> = ref(false);
const validationError: Ref<ValidationError | undefined> = ref();
const errorNonRecoverable: Ref<boolean> = ref(false);

// Form Data
const formHandle: Ref<string> = ref('');
const formFirstName: Ref<string> = ref('');
const formLastName: Ref<string> = ref('');

// Form Validation
const formValidationSchema = toTypedSchema(
    z.object({
        'social_form[firstName]': z.string().min(1, 'A first name is required').max(25, 'Too long'),
        'social_form[lastName]': z.string().min(1, 'A last name is required').max(25, 'Too long'),
        'social_form[handle]': z.string().min(5, 'A handle is required').max(50, 'Too long'),
        'social_form[agreeTerms]': z
            .boolean()
            .refine((val) => val === true, 'You must accept our terms and conditions to continue')
    })
);

// Sanity Checks
if (authStore.getAuthenticated == true) {
    router.push('/');
}

if (props.provider != SocialProvider.GITLAB && props.provider != SocialProvider.GITHUB) {
    router.push('/login');
}

if (token == undefined) {
    router.push('/login');
}

// Methods
async function submit() {
    loadingButtonRef.value.setLoading(true);
    loadingButtonRef.value.setDisabled(true);

    errorCode.value = undefined;
    validationError.value = undefined;
    error.value = false;
    errorNonRecoverable.value = false;

    try {
        await userRepository.completeSocialAccount({
            data: {
                first_name: formFirstName.value,
                last_name: formLastName.value,
                handle: formHandle.value
            },
            bearerToken: token!,
            handleBusinessErrors: true
        });

        const user: AuthenticatedUser = await authRepository.getAuthenticatedUser({
            bearerToken: token!,
            handleBusinessErrors: true
        });

        userStore.setUser(user);
        authStore.setAuthenticated(true);
        router.push('/');
    } catch (_err) {
        error.value = true;

        if (_err instanceof ValidationError) {
            errorCode.value = _err.error_code;
            validationError.value = _err;
        } else if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
            if (_err.error_code == APIErrors.EntityNotFound) {
                errorNonRecoverable.value = true;
            } else if (_err.error_code == APIErrors.NotAuthenticated) {
                if (tokenRefreshedAlready.value || !authStore.getRefreshToken) {
                    errorNonRecoverable.value = true;
                } else {
                    try {
                        const token: RefreshToken = await authRepository.refresh({
                            data: { refresh_token: authStore.getRefreshToken }
                        });
                        authStore.token = token.token;
                        authStore.tokenExpiry = token.token_expiry;
                        tokenRefreshedAlready.value = true;
                    } catch (err) {
                        console.error(err);

                        errorNonRecoverable.value = true;
                    }
                }
            }
        }
    } finally {
        loadingButtonRef.value.setLoading(false);
        loadingButtonRef.value.setDisabled(false);
    }
}

function nonRecoverableErrorRedirect() {
    authStore.$reset();
    userStore.$reset();
    router.push('/login');
}
</script>
<template>
    <div class="flex flex-col justify-center items-center my-20">
        <div class="max-w-lg w-full flex flex-col">
            <div class="flex flex-row gap-8">
                <div v-if="props.provider == SocialProvider.GITLAB">
                    <Icon class="text-7xl" icon="devicon:gitlab" />
                </div>
                <div v-if="props.provider == SocialProvider.GITHUB">
                    <span class="text-black">
                        <Icon class="text-7xl" icon="simple-icons:github" />
                    </span>
                </div>
                <div class="pt-2 text-5xl font-extrabold text-grayTitle">Account setup</div>
            </div>

            <div v-if="errorNonRecoverable" class="flex flex-col gap-7">
                <div style="font-size: 1.5em">
                    <div>Whoops</div>
                    <div style="font-size: 0.8em">
                        Error code:
                        <span style="font-family: 'Courier New', Courier, monospace">{{
                            errorCode
                        }}</span>
                    </div>
                </div>
                <div style="font-size: 1.2em">
                    We encountered some non-recoverable issue during the authentication. Please
                    click on the button below and try again. If this error persists, then please
                    contact the webmaster and provide them with the error code listed above.
                </div>
                <div>
                    <Button @click="nonRecoverableErrorRedirect"> Okay </Button>
                </div>
            </div>

            <div v-if="!errorNonRecoverable" class="text-gray-600 font-medium mb-3">
                Before being able to use our platform, fill out the details below.
            </div>

            <div
                v-if="!errorNonRecoverable"
                style="display: flex; flex-direction: column; row-gap: 2rem"
            >
                <Alert v-if="errorCode">
                    <AlertDescription class="flex flex-row gap-2 items-center">
                        <Icon icon="material-symbols:error-outline" />
                        <div>
                            <div v-if="errorCode == APIErrors.HandleAlreadyExists">
                                A user with that handle already exists, choose a different handle.
                            </div>
                            <div
                                v-else-if="errorCode == APIErrors.ValidationFailed"
                                style="white-space: break-spaces"
                            >
                                <!-- Note: this should never happen unless our client and server side validation are out of sync -->
                                {{ validationError!.toMessage('Invalid form:') }}
                            </div>
                            <div v-else>An error occured during the processing of the request.</div>
                        </div>
                    </AlertDescription>
                </Alert>

                <Form
                    class="flex flex-col gap-4"
                    name="social_form"
                    :validation-schema="formValidationSchema"
                    @submit="submit"
                >
                    <div class="flex flex-row gap-4">
                        <FormTextField
                            v-model="formFirstName"
                            class="w-full"
                            :placeholder="'Enter your first name'"
                            :type="'text'"
                            :name="'social_form[firstName]'"
                        >
                            <template #name>First Name</template>
                        </FormTextField>

                        <FormTextField
                            v-model="formLastName"
                            class="w-full"
                            :placeholder="'Enter your last name'"
                            :type="'text'"
                            :name="'social_form[lastName]'"
                        >
                            <template #name>Last Name</template>
                        </FormTextField>
                    </div>

                    <FormTextField
                        v-model="formHandle"
                        :placeholder="'Enter your handle'"
                        :type="'text'"
                        :name="'social_form[handle]'"
                    >
                        <template #name>Handle</template>
                    </FormTextField>

                    <!-- Terms -->
                    <FormInlineCheckboxField :name="'social_form[agreeTerms]'">
                        <template #name>I agree to the terms and conditions</template>
                    </FormInlineCheckboxField>

                    <LoadingSubmitButton ref="loadingButtonRef"
                        >Complete account setup</LoadingSubmitButton
                    >
                </Form>
            </div>
        </div>
    </div>
</template>
