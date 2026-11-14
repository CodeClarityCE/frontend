<script lang="ts" setup>
import { LoaderCircle, Trash2 } from "@lucide/vue";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { ref } from "vue";
import * as z from "zod";

import { UserRepository } from "@/codeclarity_components/authentication/user.repository";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
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

const formSchema = z.object({
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof formSchema>;

const form = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: { password: "" },
});

const open = ref(false);
const submitting = ref(false);

// Starts each opening of the dialog with an empty field.
function onOpenChange(value: boolean): void {
  open.value = value;
  if (!value) form.resetForm({ values: { password: "" } });
}

const onSubmit = form.handleSubmit(async (values): Promise<void> => {
  const user = userStore.user;
  if (!user || !authStore.getToken) return;
  submitting.value = true;
  try {
    await userRepository.deleteUser({
      userId: user.id,
      data: { password: values.password },
      bearerToken: authStore.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
    });
    open.value = false;
    successToast("Your account was deleted");
    userStore.$reset();
    authStore.$reset();
    void router.push("/login");
  } catch {
    errorToast("Your account could not be deleted. Check your password.");
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogTrigger as-child>
      <Button variant="destructive">
        <Trash2 aria-hidden="true" />
        Delete account
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogDescription>
          This permanently removes your account and everything in it. Enter your
          password to confirm.
        </DialogDescription>
      </DialogHeader>
      <form class="flex flex-col gap-6" novalidate @submit="onSubmit">
        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Password</FormLabel>
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
        <DialogFooter class="gap-2">
          <DialogClose as-child>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" variant="destructive" :disabled="submitting">
            <LoaderCircle
              v-if="submitting"
              aria-hidden="true"
              class="animate-spin motion-reduce:animate-none"
            />
            Delete my account
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
