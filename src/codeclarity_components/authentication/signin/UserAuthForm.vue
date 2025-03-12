<script setup lang="ts">
import { ref, type Ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';

import { cn } from '@/shadcn/lib/utils';

import { Icon } from '@iconify/vue';
import type { Token } from '@/codeclarity_components/authentication/token.entity';
import { AuthRepository } from '@/codeclarity_components/authentication/auth.repository';
import type { AuthenticatedUser } from '@/codeclarity_components/authentication/authenticated_user.entity';
import router from '@/router';
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';
import { APIErrors } from '@/utils/api/ApiErrors';

import { Button } from '@/shadcn/ui/button';

import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { vAutoAnimate } from '@formkit/auto-animate/vue';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shadcn/ui/form';
import { Input } from '@/shadcn/ui/input';
import ErrorComponent from '@/base_components/ErrorComponent.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import AlertDescription from '@/shadcn/ui/alert/AlertDescription.vue';

const SSOAuth = defineAsyncComponent({
    loader: () => import('@/enterprise_components/sso/SSOAuth.vue'),
    loadingComponent: LoadingComponent,
    // Delay before showing the loading component. Default: 200ms.
    delay: 200,
    errorComponent: ErrorComponent,
    // The error component will be displayed if a timeout is
    // provided and exceeded. Default: Infinity.
    timeout: 3000
});

// Repositories
const authRepository: AuthRepository = new AuthRepository();

// State
const loading: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const validationError: Ref<ValidationError | undefined> = ref();

// Form Validation
const formSchema = toTypedSchema(
    z.object({
        email: z.string().email(),
        password: z.string().min(10).max(75)
    })
);
let { handleSubmit } = useForm({
    validationSchema: formSchema
});

const onSubmit = handleSubmit((values) => {
    console.log(values);

    submit(values);
});

// Stores
const userStore = useUserStore();
const authStore = useAuthStore();

// Sanity checks
// Check if the use is logged in, and if redirect him
if (authStore.getAuthenticated == true) {
    router.push('/');
}

async function submit(values: any) {
    loading.value = true;
    errorCode.value = undefined;
    error.value = false;
    validationError.value = undefined;

    try {
        const token: Token = await authRepository.authenticate({
            data: { email: values.email, password: values.password },
            handleBusinessErrors: true
        });

        const user: AuthenticatedUser = await authRepository.getAuthenticatedUser({
            bearerToken: token.token,
            handleBusinessErrors: true
        });

        authStore.setToken(token.token);
        authStore.setTokenExpiry(token.token_expiry);
        authStore.setRefreshToken(token.refresh_token);
        authStore.setRefreshTokenExpiry(token.refresh_token_expiry);
        authStore.setAuthenticated(true);
        userStore.setUser(user);
        router.push('/');
    } catch (_err) {
        error.value = true;

        if (_err instanceof ValidationError) {
            errorCode.value = _err.error_code;
            validationError.value = _err;
        } else if (_err instanceof BusinessLogicError) {
            if (_err.error_code == 'AccountNotActivated') {
                router.push('/trial');
            }
            errorCode.value = _err.error_code;
        }
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <!-- Errors -->
    <Alert v-if="error" variant="destructive">
        <Icon icon="material-symbols:error-outline" />
        <AlertDescription>
            <div v-if="errorCode">
                <div v-if="errorCode == APIErrors.InternalError">
                    An error occured during the processing of the request.
                </div>
                <div v-else-if="errorCode == APIErrors.WrongCredentials">Wrong credentials.</div>
                <div v-else-if="errorCode == APIErrors.RegistrationNotVerified">
                    You have not yet verified your registration. Please go to your email inbox and
                    follow the instructions therein.
                </div>
                <div v-else-if="errorCode == APIErrors.CannotPerformActionOnSocialAccount">
                    To connected using your Social account, click on the respective Social button
                    below.
                </div>
                <div v-else-if="errorCode == APIErrors.EntityNotFound">
                    This should not have happened. Please try again.
                    <!-- Race condition -->
                </div>
                <div v-else-if="errorCode == APIErrors.ValidationFailed" class="whitespace-break-spaces">
                    <!-- Note: this should never happen unless our client and server side validation are out of sync -->
                    {{ validationError!.toMessage('Invalid form:') }}
                </div>
                <div v-else>An error occured during the processing of the request.</div>
            </div>
            <div v-else>An error occured during the processing of the request.</div>
        </AlertDescription>
    </Alert>

    <div :class="cn('grid gap-6', $attrs.class ?? '')">
        <form class="flex flex-col gap-4" :validation-schema="formSchema" @submit="onSubmit" v-if="!loading">
            <FormField v-slot="{ componentField }" name="email">
                <FormItem v-auto-animate>
                    <FormLabel>Email*:</FormLabel>
                    <FormControl>
                        <Input type="text" placeholder="Enter your email" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="password">
                <FormItem v-auto-animate>
                    <FormLabel>Password:</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="Enter your password" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            </FormField>
            <Button type="submit" class="w-full"> Sign in </Button>
        </form>
        <div class="flex flex-col items-center" v-else>
            Connecting <Icon icon="line-md:loading-twotone-loop" class="animate-spin"></Icon>
        </div>

        <!-- <SSOAuth /> -->
    </div>
</template>
