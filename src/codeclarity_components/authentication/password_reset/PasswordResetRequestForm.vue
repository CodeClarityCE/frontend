<script lang="ts" setup>
import { CircleAlert, LoaderCircle } from "@lucide/vue";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { type Ref, ref } from "vue";
import * as z from "zod";

import { AuthRepository } from "@/codeclarity_components/authentication/auth.repository";
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
const loading: Ref<boolean> = ref(false);
const success: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const validationError: Ref<ValidationError | undefined> = ref();

// Form Validation
const formSchema = z.object({
  email: z
    .string({ message: "Please enter your email" })
    .trim()
    .min(1, "Please enter your email")
    .email("Please enter a valid email"),
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
  errorCode.value = undefined;
  success.value = false;
  error.value = false;
  validationError.value = undefined;

  try {
    await authRepository.requestPasswordReset({
      data: { email: values.email },
      handleBusinessErrors: true,
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
    loading.value = false;
  }
}
</script>
<template>
  <AuthLayout>
    <template #title>
      <template v-if="success">Check your email</template>
      <template v-else>Reset your password</template>
    </template>
    <template #description>
      <template v-if="success">
        If an account is registered under that email, we sent it a link to
        choose a new password.
      </template>
      <template v-else>
        Enter the email of your account and we will send you a link to choose a
        new password.
      </template>
    </template>

    <div v-if="success" class="flex flex-col gap-6">
      <p class="text-sm text-muted-foreground">
        If you do not see the email, check your spam folder. The link is only
        valid for 5 minutes.
      </p>
      <RouterLink
        :to="{ name: 'login' }"
        :class="cn(buttonVariants(), 'w-full')"
      >
        Back to sign in
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
          <div v-else>
            An error occured during the processing of the request.
          </div>
        </AlertDescription>
      </Alert>

      <form class="flex flex-col gap-4" @submit="onSubmit">
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
        <Button type="submit" class="mt-2 w-full" :disabled="loading">
          <LoaderCircle
            v-if="loading"
            aria-hidden="true"
            class="animate-spin motion-reduce:animate-none"
          />
          Send reset link
        </Button>
      </form>
    </template>

    <template v-if="!success" #footer>
      <TextLink :to="{ name: 'login' }">Back to sign in</TextLink>
    </template>
  </AuthLayout>
</template>
