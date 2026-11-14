<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { CircleAlert, LoaderCircle } from "@lucide/vue";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { type Ref, ref } from "vue";
import * as z from "zod";

import { AuthRepository } from "@/codeclarity_components/authentication/auth.repository";
import type { AuthenticatedUser } from "@/codeclarity_components/authentication/authenticated_user.entity";
import type { RefreshToken } from "@/codeclarity_components/authentication/refresh_token.entity";
import { UserRepository } from "@/codeclarity_components/authentication/user.repository";
import { SocialProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
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

import AuthLayout from "../layout/AuthLayout.vue";
import TextLink from "../layout/TextLink.vue";

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
const loading: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const tokenRefreshedAlready: Ref<boolean> = ref(false);
const validationError: Ref<ValidationError | undefined> = ref();
const errorNonRecoverable: Ref<boolean> = ref(false);

// Form Validation
const formSchema = z.object({
  first_name: z.string().min(1, "A first name is required").max(25, "Too long"),
  last_name: z.string().min(1, "A last name is required").max(25, "Too long"),
  handle: z.string().min(5, "A handle is required").max(50, "Too long"),
  agreeTerms: z
    .boolean()
    .default(false)
    .refine(
      (val) => val === true,
      "You must accept our terms and conditions to continue",
    ),
});
type FormValues = z.infer<typeof formSchema>;
const { handleSubmit } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { agreeTerms: false },
});

const onSubmit = handleSubmit((values): void => {
  void submit(values);
});

const providerName =
  props.provider === SocialProvider.GITLAB ? "GitLab" : "GitHub";

// Sanity Checks
if (authStore.getAuthenticated) {
  void router.push("/");
}

if (
  props.provider !== SocialProvider.GITLAB &&
  props.provider !== SocialProvider.GITHUB
) {
  void router.push("/login");
}

if (!token) {
  void router.push("/login");
}

// Methods
async function submit(values: FormValues): Promise<void> {
  loading.value = true;

  errorCode.value = undefined;
  validationError.value = undefined;
  error.value = false;
  errorNonRecoverable.value = false;

  try {
    await userRepository.completeSocialAccount({
      data: {
        first_name: values.first_name,
        last_name: values.last_name,
        handle: values.handle,
      },
      bearerToken: token!,
      handleBusinessErrors: true,
    });

    const user: AuthenticatedUser = await authRepository.getAuthenticatedUser({
      bearerToken: token!,
      handleBusinessErrors: true,
    });

    userStore.setUser(user);
    authStore.setAuthenticated(true);
    void router.push("/");
  } catch (_err) {
    error.value = true;

    if (_err instanceof ValidationError) {
      errorCode.value = _err.error_code;
      validationError.value = _err;
      return;
    }

    if (!(_err instanceof BusinessLogicError)) {
      return;
    }

    errorCode.value = _err.error_code;

    if (_err.error_code === (APIErrors.EntityNotFound as string)) {
      errorNonRecoverable.value = true;
      return;
    }

    if (_err.error_code !== (APIErrors.NotAuthenticated as string)) {
      return;
    }

    if (tokenRefreshedAlready.value ?? !authStore.getRefreshToken) {
      errorNonRecoverable.value = true;
      return;
    }

    try {
      const token: RefreshToken = await authRepository.refresh({
        data: { refresh_token: authStore.getRefreshToken },
      });
      authStore.token = token.token;
      authStore.tokenExpiry = token.token_expiry;
      tokenRefreshedAlready.value = true;
    } catch {
      errorNonRecoverable.value = true;
    }
  } finally {
    loading.value = false;
  }
}

function nonRecoverableErrorRedirect(): void {
  authStore.$reset();
  userStore.$reset();
  void router.push("/login");
}
</script>
<template>
  <AuthLayout>
    <template #icon>
      <Icon
        v-if="props.provider === SocialProvider.GITLAB"
        icon="devicon:gitlab"
        role="img"
        :aria-hidden="false"
        aria-label="GitLab"
        class="mb-2 size-12"
      />
      <Icon
        v-else
        icon="simple-icons:github"
        role="img"
        :aria-hidden="false"
        aria-label="GitHub"
        class="mb-2 size-12 text-foreground-strong"
      />
    </template>
    <template #title>Finish setting up your account</template>
    <template #description>
      <template v-if="errorNonRecoverable">
        We could not complete your {{ providerName }} sign in.
      </template>
      <template v-else>
        You signed in with {{ providerName }}. Fill out the details below before
        using the platform.
      </template>
    </template>

    <div v-if="errorNonRecoverable" class="flex flex-col gap-6">
      <Alert variant="destructive">
        <CircleAlert aria-hidden="true" />
        <AlertDescription class="flex flex-col gap-2">
          <p>
            We encountered a non-recoverable issue during the authentication.
            Please try again. If this error persists, contact the webmaster with
            the error code below.
          </p>
          <p>
            Error code: <code class="font-mono">{{ errorCode }}</code>
          </p>
        </AlertDescription>
      </Alert>
      <Button class="w-full" @click="nonRecoverableErrorRedirect">
        Back to sign in
      </Button>
    </div>

    <template v-else>
      <Alert v-if="error" variant="destructive" class="mb-6">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          <div v-if="errorCode === APIErrors.HandleAlreadyExists">
            A user with that handle already exists, choose a different handle.
          </div>
          <div
            v-else-if="errorCode === APIErrors.ValidationFailed"
            class="whitespace-break-spaces"
          >
            {{ validationError!.toMessage("Invalid form:") }}
          </div>
          <div v-else>
            An error occured during the processing of the request.
          </div>
        </AlertDescription>
      </Alert>

      <form v-if="!loading" class="flex flex-col gap-4" @submit="onSubmit">
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
                placeholder="Enter your handle"
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
              <Checkbox
                :model-value="value"
                @update:model-value="handleChange"
              />
            </FormControl>
            <div class="space-y-2 leading-none">
              <FormLabel class="leading-snug">
                I agree to the
                <TextLink :to="{ name: 'terms' }">Terms of service</TextLink>
                and the
                <TextLink :to="{ name: 'privacy' }">Privacy policy</TextLink>.
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        </FormField>
        <Button type="submit" class="mt-2 w-full">
          Complete account setup
        </Button>
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
        Setting up your account
      </div>
    </template>
  </AuthLayout>
</template>
