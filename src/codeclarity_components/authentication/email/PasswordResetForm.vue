<script lang="ts" setup>
import { CircleAlert, LoaderCircle } from "@lucide/vue";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { onMounted, type Ref, ref } from "vue";
import * as z from "zod";

import { AuthRepository } from "@/codeclarity_components/authentication/auth.repository";
import router from "@/router";
import { cn } from "@/shadcn/lib/utils";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button, buttonVariants } from "@/shadcn/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shadcn/ui/form";
import { Input } from "@/shadcn/ui/input";
import { APIErrors } from "@/utils/api/ApiErrors";
import {
  BusinessLogicError,
  ValidationError,
} from "@/utils/api/BaseRepository";
import { filterUndefined } from "@/utils/form/filterUndefined";

import AuthLayout from "../layout/AuthLayout.vue";
import TextLink from "../layout/TextLink.vue";

// Repositories
const authRepository: AuthRepository = new AuthRepository();

// State
const nonRecoverableError: Ref<boolean> = ref(false);
const loading: Ref<boolean> = ref(false);
const token: Ref<string> = ref("");
const userIdHash: Ref<string> = ref("");
const success: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const validationError: Ref<ValidationError | undefined> = ref();

// Form Validation
const formSchema = z
  .object({
    new_password: z.string().min(10, "Too short").max(75, "Too long"),
    new_password_confirmation: z.string(),
  })
  .refine((data) => data.new_password === data.new_password_confirmation, {
    message: "Passwords must match",
    path: ["new_password_confirmation"],
  });
type FormValues = z.infer<typeof formSchema>;
const { handleSubmit } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
});

const onSubmit = handleSubmit((values): void => {
  void submit(values);
});

// Methods
async function submit(values: FormValues): Promise<void> {
  loading.value = true;
  success.value = false;
  errorCode.value = undefined;
  error.value = false;
  validationError.value = undefined;

  try {
    await authRepository.resetPassword({
      data: {
        new_password: values.new_password,
        new_password_confirmation: values.new_password_confirmation,
        token: token.value,
        user_id_hash: userIdHash.value,
      },
      handleBusinessErrors: true,
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
        _err.error_code ===
          (APIErrors.PasswordResetTokenInvalidOrExpired as string) ||
        _err.error_code === (APIErrors.InternalError as string)
      ) {
        nonRecoverableError.value = true;
      }
    }
  } finally {
    loading.value = false;
  }
}

// Life cycle
onMounted(() => {
  const searchParams = new URL(window.location.href).searchParams;
  const _token = searchParams.get("token");
  const _userIdHash = searchParams.get("userid");

  if (!_token || !_userIdHash) {
    void router.push("/login");
    return;
  }

  token.value = _token;
  userIdHash.value = _userIdHash;
});
</script>
<template>
  <AuthLayout>
    <template #title>
      <template v-if="success">Password updated</template>
      <template
        v-else-if="
          nonRecoverableError &&
          errorCode === APIErrors.PasswordResetTokenInvalidOrExpired
        "
      >
        Reset link expired
      </template>
      <template v-else-if="nonRecoverableError">Password reset failed</template>
      <template v-else>Choose a new password</template>
    </template>
    <template #description>
      <template v-if="success">
        Your password has been successfully updated.
      </template>
      <template v-else-if="nonRecoverableError">
        Your password was not reset.
      </template>
      <template v-else>Enter the new password for your account.</template>
    </template>

    <div v-if="success" class="flex flex-col gap-6">
      <RouterLink
        :to="{ name: 'login' }"
        :class="cn(buttonVariants(), 'w-full')"
      >
        Back to sign in
      </RouterLink>
    </div>

    <div v-else-if="nonRecoverableError" class="flex flex-col gap-6">
      <p
        v-if="errorCode === APIErrors.PasswordResetTokenInvalidOrExpired"
        class="text-sm"
      >
        The link in the email is only valid for 5 minutes. Request a new
        password reset and follow the link in the new email.
      </p>
      <p v-else class="text-sm">
        An error occured during the processing of the request.
      </p>
      <RouterLink
        :to="{ name: 'recoveryRequest' }"
        :class="cn(buttonVariants(), 'w-full')"
      >
        Request a new password reset
      </RouterLink>
    </div>

    <template v-else>
      <Alert v-if="error" variant="destructive" class="mb-6">
        <CircleAlert aria-hidden="true" />
        <AlertDescription>
          <div
            v-if="errorCode === APIErrors.ValidationFailed"
            class="whitespace-break-spaces"
          >
            {{ validationError!.toMessage("Invalid form:") }}
          </div>
          <div v-else-if="errorCode === APIErrors.PasswordsDoNotMatch">
            Passwords do not match.
          </div>
          <div v-else>
            An error occured during the processing of the request.
          </div>
        </AlertDescription>
      </Alert>

      <form class="flex flex-col gap-4" @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="new_password">
          <FormItem>
            <FormLabel>New password</FormLabel>
            <FormControl>
              <Input
                type="password"
                autocomplete="new-password"
                placeholder="Enter your new password"
                v-bind="filterUndefined(componentField)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="new_password_confirmation">
          <FormItem>
            <FormLabel>Confirm new password</FormLabel>
            <FormControl>
              <Input
                type="password"
                autocomplete="new-password"
                placeholder="Confirm your new password"
                v-bind="filterUndefined(componentField)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <Button type="submit" class="mt-2 w-full" :disabled="loading">
          <LoaderCircle
            v-if="loading"
            aria-hidden="true"
            class="animate-spin motion-reduce:animate-none"
          />
          Update password
        </Button>
      </form>
    </template>

    <template v-if="!success" #footer>
      <TextLink :to="{ name: 'login' }">Back to sign in</TextLink>
    </template>
  </AuthLayout>
</template>
