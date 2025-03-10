<template>
    <div>
        <RouterLink
            :to="{ name: 'login' }"
            :class="
                cn(
                    buttonVariants({ variant: 'ghost' }),
                    'absolute right-4 top-4 md:right-8 md:top-8'
                )
            "
        >
            <img src="@/imgs/logos/logo.svg" class="w-8" />
            Sign In
        </RouterLink>
        <div class="py-10">
            <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <img src="@/imgs/logos/logo.svg" class="w-20 self-center" />
                <div class="flex flex-col space-y-2 text-center">
                    <h1 class="text-2xl font-semibold tracking-tight">Sign Up</h1>
                    <p class="text-sm text-muted-foreground">
                        Welcome, please fill out the below information.
                    </p>
                </div>
                <!-- Errors -->
                <ErrorCard v-if="error">
                    <template #content>
                        <Icon icon="material-symbols:error-outline" />
                        <div v-if="errorCode">
                            <div v-if="errorCode == APIErrors.InternalError">
                                An error occured during the processing of the request.
                            </div>
                            <div v-else-if="errorCode == APIErrors.PasswordsDoNotMatch">
                                Passwords do not match.
                            </div>
                            <div v-else-if="errorCode == APIErrors.EmailAlreadyExists">
                                A user with that email already exists.
                            </div>
                            <div v-else-if="errorCode == APIErrors.HandleAlreadyExists">
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
                        <div v-else>An error occured during the processing of the request.</div>
                    </template>
                </ErrorCard>
                <div :class="cn('grid gap-6', $attrs.class ?? '')">
                    <!-- Content -->
                    <Form
                        class="flex flex-col gap-4"
                        :validation-schema="formSchema"
                        @submit="onSubmit"
                        v-if="!loading"
                    >
                        <FormField v-slot="{ componentField }" name="email">
                            <FormItem v-auto-animate>
                                <FormLabel>Email*:</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="Enter your email"
                                        v-bind="componentField"
                                    />
                                </FormControl>
                                <!-- <FormDescription>
                                This is your public display name.
                                </FormDescription> -->
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <div class="flex flex-row gap-4">
                            <FormField v-slot="{ componentField }" name="first_name">
                                <FormItem v-auto-animate>
                                    <FormLabel>First Name*:</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter your first name"
                                            v-bind="componentField"
                                        />
                                    </FormControl>
                                    <!-- <FormDescription>
                                    This is your public display name.
                                    </FormDescription> -->
                                    <FormMessage />
                                </FormItem>
                            </FormField>
                            <FormField v-slot="{ componentField }" name="last_name">
                                <FormItem v-auto-animate>
                                    <FormLabel>Last Name*:</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter your last name"
                                            v-bind="componentField"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            </FormField>
                        </div>
                        <FormField v-slot="{ componentField }" name="handle">
                            <FormItem v-auto-animate>
                                <FormLabel>Handle:</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="Enter your handle (username)"
                                        v-bind="componentField"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField v-slot="{ componentField }" name="plainPassword">
                            <FormItem v-auto-animate>
                                <FormLabel>Password:</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Enter your password"
                                        v-bind="componentField"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField v-slot="{ componentField }" name="plainPasswordConfirm">
                            <FormItem v-auto-animate>
                                <FormLabel>Password Confirmation:</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Confirm your password"
                                        v-bind="componentField"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                        <FormField
                            v-slot="{ value, handleChange }"
                            type="checkbox"
                            name="agreeTerms"
                        >
                            <FormItem
                                class="flex flex-row items-start gap-x-3 space-y-0 rounded-md border p-4"
                            >
                                <FormControl>
                                    <Checkbox :checked="value" @update:checked="handleChange" />
                                </FormControl>
                                <div class="space-y-1 leading-none">
                                    <FormLabel>
                                        Check to agree to our
                                        <Button variant="link" class="h-4 p-0">
                                            <RouterLink to="/terms">Terms of Service</RouterLink>
                                        </Button>
                                        and
                                        <Button variant="link" class="h-4 p-0">
                                            <RouterLink to="/privacy">Privacy Policy</RouterLink>
                                        </Button>
                                        .
                                    </FormLabel>
                                    <FormDescription>
                                        * We collect these data to manage your access to the
                                        platform. We use your email to send you information about
                                        your account, and to send you information about our products
                                        and services.
                                    </FormDescription>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        </FormField>
                        <Button type="submit" class="w-full"> Register </Button>
                    </Form>
                    <div class="flex flex-col items-center" v-else>
                        Creating your account
                        <Icon icon="line-md:loading-twotone-loop" class="animate-spin"></Icon>
                    </div>

                    <!-- <SSOAuth /> -->
                </div>
                <!-- <p class="px-8 text-center text-sm text-muted-foreground">
                    By clicking continue, you agree to our
                    <Button variant="link" class="h-4 p-0">
                        <RouterLink to="/terms">Terms of Service</RouterLink>
                    </Button>
                    and
                    <Button variant="link" class="h-4 p-0">
                        <RouterLink to="/privacy">Privacy Policy</RouterLink>
                    </Button>
                    .
                </p> -->
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router';
import { ref, type Ref } from 'vue';
import router from '@/router';
import { Icon } from '@iconify/vue';
import { AuthRepository } from '@/codeclarity_components/authentication/auth.repository';
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';
import { APIErrors } from '@/utils/api/ApiErrors';
import ErrorCard from '@/base_components/errors/ErrorCard.vue';
import { cn } from '@/utils/shadcn';
import { Button, buttonVariants } from '@/shadcn/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { vAutoAnimate } from '@formkit/auto-animate/vue';

import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/shadcn/ui/form';
import { Input } from '@/shadcn/ui/input';
import { Checkbox } from '@/shadcn/ui/checkbox';
import { toast } from '@/shadcn/ui/toast';

import ErrorComponent from '@/base_components/ErrorComponent.vue';
import LoadingComponent from '@/base_components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

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

// Stores
const authStore = useAuthStore();

// Repositories
const authRepository: AuthRepository = new AuthRepository();

// State
const loading: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const error: Ref<boolean> = ref(false);
const validationError: Ref<ValidationError | undefined> = ref();

// Form Validation
const formSchema = toTypedSchema(
    z.object({
        email: z.string().email(),
        first_name: z.string().min(2).max(25),
        last_name: z.string().min(2).max(25),
        handle: z.string().min(5).max(50),
        plainPassword: z.string().min(10).max(75),
        plainPasswordConfirm: z.string().min(10).max(75),
        agreeTerms: z.boolean().default(false)
    })
);
let { handleSubmit } = useForm({
    validationSchema: formSchema
});

const onSubmit = handleSubmit((values) => {
    if (values.agreeTerms == false) {
        toast({
            title: 'You must agree to our terms and conditions to continue',
            description: 'Please check the box to continue'
        });
        return;
    }
    // toast({
    //     title: 'You submitted the following values:',
    //     description: h('pre', { class: 'mt-2 w-[340px] rounded-md bg-slate-950 p-4' }, h('code', { class: 'text-white' }, JSON.stringify(values, null, 2))),
    // })
    submit(values);
});

// Sanity Checks
// In case the user is logged in and visits this page, redirect them
if (authStore.getAuthenticated == true) {
    router.push('/');
}

// Methods
async function submit(values: any) {
    loading.value = true;
    errorCode.value = undefined;
    validationError.value = undefined;
    error.value = false;

    try {
        await authRepository.register({
            data: {
                first_name: values.first_name,
                last_name: values.last_name,
                email: values.email,
                handle: values.handle,
                password: values.plainPassword,
                password_confirmation: values.plainPasswordConfirm
            },
            handleBusinessErrors: true
        });
        toast({
            title: 'Account successfully created',
            description: 'Please check your email to verify your account'
        });
        router.push({ name: 'login' });
    } catch (_err) {
        error.value = true;

        if (_err instanceof ValidationError) {
            errorCode.value = _err.error_code;
            validationError.value = _err;
        } else if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        loading.value = false;
    }
}
</script>
