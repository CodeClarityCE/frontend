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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shadcn/ui/form";
import { Input } from "@/shadcn/ui/input";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { filterUndefined } from "@/utils/form/filterUndefined";
import { errorToast, successToast } from "@/utils/toasts";

const authStore = useAuthStore();
const userStore = useUserStore();
const userRepository = new UserRepository();

const nameSchema = z
  .string()
  .trim()
  .min(2, "At least 2 characters")
  .max(25, "At most 25 characters");
const formSchema = z.object({ first_name: nameSchema, last_name: nameSchema });
type FormValues = z.infer<typeof formSchema>;

const form = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    first_name: userStore.user?.first_name ?? "",
    last_name: userStore.user?.last_name ?? "",
  },
});

const submitting = ref(false);

const onSubmit = form.handleSubmit(async (values): Promise<void> => {
  const user = userStore.user;
  if (!user || !authStore.getToken) return;
  submitting.value = true;
  try {
    await userRepository.patchPersonalInfo({
      userId: user.id,
      data: { ...values, handle: user.handle },
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });
    // Keep the shell's user menu in step with the new name.
    user.first_name = values.first_name;
    user.last_name = values.last_name;
    form.resetForm({ values });
    successToast("Your name was updated");
  } catch {
    errorToast("Your name could not be updated");
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <form class="flex flex-col gap-6" novalidate @submit="onSubmit">
    <div class="grid grid-cols-2 gap-4">
      <FormField v-slot="{ componentField }" name="first_name">
        <FormItem>
          <FormLabel>First name</FormLabel>
          <FormControl>
            <Input
              type="text"
              autocomplete="given-name"
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
        Save changes
      </Button>
    </div>
  </form>
</template>
