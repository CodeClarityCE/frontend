<script lang="ts" setup>
import { CircleAlert, LoaderCircle } from "@lucide/vue";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { type Ref, ref } from "vue";
import { toast } from "vue-sonner";
import * as z from "zod";

import { AuthRepository } from "@/codeclarity_components/authentication/auth.repository";
import router from "@/router";
import Alert from "@/shadcn/ui/alert/Alert.vue";
import AlertDescription from "@/shadcn/ui/alert/AlertDescription.vue";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shadcn/ui/form";
import { Input } from "@/shadcn/ui/input";
import { useAuthStore } from "@/stores/auth";
import { APIErrors } from "@/utils/api/ApiErrors";
import {
  BusinessLogicError,
  ValidationError,
} from "@/utils/api/BaseRepository";
import { filterUndefined } from "@/utils/form/filterUndefined";

import AuthLayout from "../layout/AuthLayout.vue";
import BrandEmphasis from "../layout/BrandEmphasis.vue";
import TextLink from "../layout/TextLink.vue";

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
const formSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(2).max(25),
  last_name: z.string().min(2).max(25),
  handle: z.string().min(5).max(50),
  plainPassword: z.string().min(10).max(75),
  plainPasswordConfirm: z.string().min(10).max(75),
  agreeTerms: z.boolean().default(false),
});
type FormValues = z.infer<typeof formSchema>;
const { handleSubmit } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
});

const onSubmit = handleSubmit((values): void => {
  if (values.agreeTerms === false) {
    toast.warning("You must agree to our terms and conditions to continue", {
      description: "Please check the box to continue",
    });
    return;
  }
  void submit(values);
});

// Sanity Checks
// In case the user is logged in and visits this page, redirect them
if (authStore.getAuthenticated === true) {
  void router.push("/");
}

// Methods
async function submit(values: {
  email: string;
  first_name: string;
  last_name: string;
  handle: string;
  plainPassword: string;
  plainPasswordConfirm: string;
  agreeTerms: boolean;
}): Promise<void> {
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
        password_confirmation: values.plainPasswordConfirm,
      },
      handleBusinessErrors: true,
    });
    toast.success("Account successfully created", {
      description: "Please check your email to verify your account",
    });
    void router.push({ name: "login" });
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
<template>
  <AuthLayout width="wide">
    <template #title>
      Create your <BrandEmphasis>CodeClarity</BrandEmphasis> account
    </template>
    <template #description>
      Welcome, please fill out the information below.
    </template>

    <Alert v-if="error" variant="destructive" class="mb-6">
      <CircleAlert aria-hidden="true" />
      <AlertDescription>
        <div v-if="errorCode === APIErrors.PasswordsDoNotMatch">
          Passwords do not match.
        </div>
        <div v-else-if="errorCode === APIErrors.EmailAlreadyExists">
          A user with that email already exists.
        </div>
        <div v-else-if="errorCode === APIErrors.HandleAlreadyExists">
          A user with that handle already exists, choose a different handle.
        </div>
        <div
          v-else-if="errorCode === APIErrors.ValidationFailed"
          class="whitespace-break-spaces"
        >
          {{ validationError!.toMessage("Invalid form:") }}
        </div>
        <div v-else>An error occured during the processing of the request.</div>
      </AlertDescription>
    </Alert>

    <form v-if="!loading" class="flex flex-col gap-4" @submit="onSubmit">
      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              type="text"
              autocomplete="email"
              placeholder="Enter your email"
              v-bind="filterUndefined(componentField)"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <div class="grid grid-cols-2 gap-4">
        <FormField v-slot="{ componentField }" name="first_name">
          <FormItem>
            <FormLabel>First name</FormLabel>
            <FormControl>
              <Input
                type="text"
                autocomplete="given-name"
                placeholder="Enter your first name"
                v-bind="filterUndefined(componentField)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="last_name">
          <FormItem>
            <FormLabel>Last name</FormLabel>
            <FormControl>
              <Input
                type="text"
                autocomplete="family-name"
                placeholder="Enter your last name"
                v-bind="filterUndefined(componentField)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>
      <FormField v-slot="{ componentField }" name="handle">
        <FormItem>
          <FormLabel>Handle</FormLabel>
          <FormControl>
            <Input
              type="text"
              autocomplete="username"
              placeholder="Enter your handle (username)"
              v-bind="filterUndefined(componentField)"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="plainPassword">
        <FormItem>
          <FormLabel>Password</FormLabel>
          <FormControl>
            <Input
              type="password"
              autocomplete="new-password"
              placeholder="Enter your password"
              v-bind="filterUndefined(componentField)"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="plainPasswordConfirm">
        <FormItem>
          <FormLabel>Confirm password</FormLabel>
          <FormControl>
            <Input
              type="password"
              autocomplete="new-password"
              placeholder="Confirm your password"
              v-bind="filterUndefined(componentField)"
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
          class="flex flex-row items-start gap-x-3 space-y-0 rounded-control border border-border p-4"
        >
          <FormControl>
            <Checkbox :model-value="value" @update:model-value="handleChange" />
          </FormControl>
          <div class="space-y-2 leading-none">
            <FormLabel class="leading-snug">
              I agree to the
              <TextLink :to="{ name: 'terms' }">Terms of service</TextLink>
              and the
              <TextLink :to="{ name: 'privacy' }">Privacy policy</TextLink>.
            </FormLabel>
            <FormDescription>
              We collect these data to manage your access to the platform. We
              use your email to send you information about your account, and to
              send you information about our products and services.
            </FormDescription>
            <FormMessage />
          </div>
        </FormItem>
      </FormField>
      <Button type="submit" class="mt-2 w-full">Create account</Button>
    </form>
    <div
      v-else
      role="status"
      class="flex flex-col items-center gap-2 py-8 text-muted-foreground"
    >
      <LoaderCircle
        aria-hidden="true"
        class="size-6 animate-spin motion-reduce:animate-none"
      />
      Creating your account
    </div>

    <template #footer>
      <span>
        Already have an account?
        <TextLink :to="{ name: 'login' }">Sign in</TextLink>
      </span>
    </template>
  </AuthLayout>
</template>
