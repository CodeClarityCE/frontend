<script setup lang="ts">
import { CircleAlert, LoaderCircle } from "@lucide/vue";
import { toTypedSchema } from "@vee-validate/zod";
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
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import {
  BusinessLogicError,
  ValidationError,
} from "@/utils/api/BaseRepository";
import { filterUndefined } from "@/utils/form/filterUndefined";

import TextLink from "../layout/TextLink.vue";

// Repositories
const authRepository: AuthRepository = new AuthRepository();

// State
const loading: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const validationError: Ref<ValidationError | undefined> = ref();

// Form Validation
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(75),
});
type FormValues = z.infer<typeof formSchema>;
const { handleSubmit } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
});

const onSubmit = handleSubmit((values): void => {
  void submit(values);
});

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
  validationError.value = undefined;

  try {
    const token: Token = await authRepository.authenticate({
      data: { email: values.email, password: values.password },
      handleBusinessErrors: true,
    });

    const user: AuthenticatedUser = await authRepository.getAuthenticatedUser({
      bearerToken: token.token,
      handleBusinessErrors: true,
    });

    authStore.setToken(token.token);
    authStore.setTokenExpiry(token.token_expiry);
    authStore.setRefreshToken(token.refresh_token);
    authStore.setRefreshTokenExpiry(token.refresh_token_expiry);
    authStore.setAuthenticated(true);
    userStore.setUser(user);
    void router.push("/");
  } catch (_err) {
    error.value = true;

    if (_err instanceof ValidationError) {
      errorCode.value = _err.error_code;
      validationError.value = _err;
    } else if (_err instanceof BusinessLogicError) {
      if (_err.error_code === "AccountNotActivated") {
        void router.push("/trial");
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
      <div v-if="errorCode">
        <div v-if="errorCode === APIErrors.InternalError">
          An error occured during the processing of the request.
        </div>
        <div v-else-if="errorCode === APIErrors.WrongCredentials">
          Wrong credentials.
        </div>
        <div v-else-if="errorCode === APIErrors.RegistrationNotVerified">
          You have not yet verified your registration. Please go to your email
          inbox and follow the instructions therein.
        </div>
        <div
          v-else-if="errorCode === APIErrors.CannotPerformActionOnSocialAccount"
        >
          To connected using your Social account, click on the respective Social
          button below.
        </div>
        <div v-else-if="errorCode === APIErrors.EntityNotFound">
          This should not have happened. Please try again.
          <!-- Race condition -->
        </div>
        <div
          v-else-if="errorCode === APIErrors.ValidationFailed"
          class="whitespace-break-spaces"
        >
          <!-- Note: this should never happen unless our client and server side validation are out of sync -->
          {{ validationError!.toMessage("Invalid form:") }}
        </div>
        <div v-else>An error occured during the processing of the request.</div>
      </div>
      <div v-else>An error occured during the processing of the request.</div>
    </AlertDescription>
  </Alert>

  <form
    v-if="!loading"
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
    <Button type="submit" class="mt-2 w-full">Sign in</Button>
    <div class="text-center text-sm">
      <TextLink :to="{ name: 'recoveryRequest' }">
        Forgot your password?
      </TextLink>
    </div>
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
    Connecting
  </div>
</template>
