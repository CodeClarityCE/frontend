<script lang="ts" setup>
import { LoaderCircle } from "@lucide/vue";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { ref } from "vue";
import * as z from "zod";

import { UserRepository } from "@/codeclarity_components/authentication/user.repository";
import { Button } from "@/shadcn/ui/button";
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
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { filterUndefined } from "@/utils/form/filterUndefined";
import { errorToast, successToast } from "@/utils/toasts";

const authStore = useAuthStore();
const userStore = useUserStore();
const userRepository = new UserRepository();

const formSchema = z
  .object({
    old_password: z.string().min(1, "Enter your current password"),
    password: z
      .string()
      .min(10, "At least 10 characters")
      .max(75, "At most 75 characters"),
    password_confirmation: z.string().min(1, "Confirm the new password"),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: "The passwords do not match",
    path: ["password_confirmation"],
  });
type FormValues = z.infer<typeof formSchema>;

const emptyValues = {
  old_password: "",
  password: "",
  password_confirmation: "",
};

const form = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: emptyValues,
});

const submitting = ref(false);

function failureMessage(err: unknown): string {
  if (err instanceof BusinessLogicError) {
    if (err.error_code === APIErrors.CannotPerformActionOnSocialAccount) {
      return "Accounts that sign in with GitHub or GitLab have no password to change";
    }
    if (err.error_code === APIErrors.PasswordsDoNotMatch) {
      return "The passwords do not match";
    }
  }
  return "The password could not be changed. Check your current password.";
}

const onSubmit = form.handleSubmit(async (values): Promise<void> => {
  const user = userStore.user;
  if (!user || !authStore.getToken) return;
  submitting.value = true;
  try {
    await userRepository.patchPassword({
      userId: user.id,
      data: values,
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });
    form.resetForm({ values: emptyValues });
    successToast("Your password was changed");
  } catch (err) {
    errorToast(failureMessage(err));
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <form class="flex flex-col gap-6" novalidate @submit="onSubmit">
    <FormField v-slot="{ componentField }" name="old_password">
      <FormItem>
        <FormLabel>Current password</FormLabel>
        <FormControl>
          <Input
            type="password"
            autocomplete="current-password"
            v-bind="filterUndefined(componentField)"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
    <div class="grid grid-cols-2 gap-4">
      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <FormLabel>New password</FormLabel>
          <FormControl>
            <Input
              type="password"
              autocomplete="new-password"
              v-bind="filterUndefined(componentField)"
            />
          </FormControl>
          <FormDescription>Between 10 and 75 characters.</FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="password_confirmation">
        <FormItem>
          <FormLabel>Confirm new password</FormLabel>
          <FormControl>
            <Input
              type="password"
              autocomplete="new-password"
              v-bind="filterUndefined(componentField)"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>
    <div class="flex justify-end">
      <Button type="submit" :disabled="submitting">
        <LoaderCircle
          v-if="submitting"
          aria-hidden="true"
          class="animate-spin motion-reduce:animate-none"
        />
        Change password
      </Button>
    </div>
  </form>
</template>
