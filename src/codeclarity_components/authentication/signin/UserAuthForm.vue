<script setup lang="ts">
import { CircleAlert } from "@lucide/vue";
import { useForm } from "vee-validate";
import { type Ref, ref } from "vue";
import * as z from "zod";

import { AuthRepository } from "@/codeclarity_components/authentication/auth.repository";
import type { AuthenticatedUser } from "@/codeclarity_components/authentication/authenticated_user.entity";
import type { Token } from "@/codeclarity_components/authentication/token.entity";
import router from "@/router";
import Alert from "@/shadcn/ui/alert/Alert.vue";
import AlertDescription from "@/shadcn/ui/alert/AlertDescription.vue";
import { Button } from "@/shadcn/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shadcn/ui/form";
import { Input } from "@/shadcn/ui/input";
import { Spinner } from "@/shadcn/ui/spinner";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { filterUndefined } from "@/utils/form/filterUndefined";
import { guardFormSubmit } from "@/utils/form/guardSubmit";
import { toTypedSchema } from "@/utils/form/toTypedSchema";

import TextLink from "../layout/TextLink.vue";

import { loginRoute, redirectAfterLogin } from "./login-route";

// Repositories
const authRepository: AuthRepository = new AuthRepository();

// State
const loading: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();

// Form Validation
// No length rule on the password: it was set under whatever rules applied then.
const formSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email")
    .check(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof formSchema>;
const {
  handleSubmit,
  isSubmitting,
  values: formValues,
} = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { email: "", password: "" },
});

const onSubmit = guardFormSubmit(
  { handleSubmit, isSubmitting, values: formValues },
  (values): void => {
    if (loading.value) return;
    void submit(values);
  },
);

// Stores
const userStore = useUserStore();
const authStore = useAuthStore();

// Sanity checks
// Check if the use is logged in, and if redirect him
if (authStore.getAuthenticated === true) {
  void router.push("/");
}

async function submit(values: {
  email: string;
  password: string;
}): Promise<void> {
  loading.value = true;
  errorCode.value = undefined;
  error.value = false;

  try {
    const token: Token = await authRepository.authenticate({
      data: { email: values.email, password: values.password },
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });

    const user: AuthenticatedUser = await authRepository.getAuthenticatedUser({
      bearerToken: token.token,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });

    authStore.setToken(token.token);
    authStore.setTokenExpiry(token.token_expiry);
    authStore.setRefreshToken(token.refresh_token);
    authStore.setRefreshTokenExpiry(token.refresh_token_expiry);
    authStore.setAuthenticated(true);
    userStore.setUser(user);
    void router.push(redirectAfterLogin(router.currentRoute.value.query));
  } catch (_err) {
    error.value = true;

    if (_err instanceof BusinessLogicError) {
      if (_err.error_code === "AccountNotActivated") {
        void router.replace(
          loginRoute({
            notice: "not_activated",
            redirect: redirectAfterLogin(router.currentRoute.value.query),
          }),
        );
        return;
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
    <CircleAlert aria-hidden="true" />
    <AlertDescription>
      <div v-if="errorCode === APIErrors.WrongCredentials">
        The email or password is incorrect.
      </div>
      <div v-else-if="errorCode === APIErrors.RegistrationNotVerified">
        You have not yet verified your registration. Please go to your email
        inbox and follow the instructions therein.
      </div>
      <div
        v-else-if="errorCode === APIErrors.CannotPerformActionOnSocialAccount"
      >
        This account signs in with GitHub or GitLab, so it has no password.
      </div>
      <div v-else>
        Something went wrong while signing you in. Please try again.
      </div>
    </AlertDescription>
  </Alert>

  <form
    class="flex flex-col gap-4"
    :class="{ 'mt-4': error }"
    @submit="onSubmit"
  >
    <FormField v-slot="{ componentField }" name="email">
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input
            type="text"
            autocomplete="username"
            placeholder="Enter your email"
            v-bind="filterUndefined(componentField)"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <FormField v-slot="{ componentField }" name="password">
      <FormItem>
        <FormLabel>Password</FormLabel>
        <FormControl>
          <Input
            type="password"
            autocomplete="current-password"
            placeholder="Enter your password"
            v-bind="filterUndefined(componentField)"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <Button type="submit" class="mt-2 w-full" :disabled="loading">
      <Spinner v-if="loading" />
      Sign in
    </Button>
    <p v-if="loading" role="status" class="sr-only">Connecting</p>
    <div class="text-center text-sm">
      <TextLink :to="{ name: 'recoveryRequest' }">
        Forgot your password?
      </TextLink>
    </div>
  </form>
</template>
