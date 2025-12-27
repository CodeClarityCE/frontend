<script lang="ts" setup>
import { vAutoAnimate } from "@formkit/auto-animate/vue";
import { useForm } from "vee-validate";
import { toast } from "vue-sonner";
import * as z from "zod";
import { UserRepository } from "@/codeclarity_components/authentication/user.repository";
import { Button } from "@/shadcn/ui/button";
import DialogFooter from "@/shadcn/ui/dialog/DialogFooter.vue";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shadcn/ui/form";
import { Input } from "@/shadcn/ui/input";
import { useAuthStore } from "@/stores/auth";
import { useStateStore } from "@/stores/state";
import { useUserStore } from "@/stores/user";
import { BusinessLogicError } from "@/utils/api/BaseRepository";
import { filterUndefined } from "@/utils/form/filterUndefined";

const state = useStateStore();
const authStore = useAuthStore();
state.menu = "settingsAccount";

const userRepository: UserRepository = new UserRepository();

const userStore = useUserStore();
const user = userStore.user;

// UPDATE INFO FORM
const formSchema = z.object({
  password_deletion: z.string().min(10).max(75),
});
type FormValues = z.infer<typeof formSchema>;

const form = useForm<FormValues>({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit((values): void => {
  void deleteAccount(values.password_deletion);
});

/*****************************************************************************/
/*                                  API Calls                                */
/*****************************************************************************/

async function deleteAccount(password: string): Promise<void> {
  if (authStore.getAuthenticated && authStore.getToken) {
    try {
      await userRepository.deleteUser({
        userId: user?.id ?? "",
        bearerToken: authStore.getToken,
        handleBusinessErrors: true,
        data: {
          password: password,
        },
      });
      toast.success("Password updated");
    } catch (err) {
      if (err instanceof BusinessLogicError) {
        console.error(err);
      }
    }
  }
}
</script>

<template>
  <form class="space-y-6" @submit="onSubmit">
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <p class="text-sm text-red-800 font-medium">
        This action is permanent and cannot be undone. Please enter your
        password to confirm.
      </p>
    </div>

    <FormField v-slot="{ componentField }" name="password_deletion">
      <FormItem v-auto-animate>
        <FormLabel class="text-sm font-semibold text-theme-black"
          >Password Confirmation</FormLabel
        >
        <FormControl>
          <Input
            type="password"
            placeholder="Enter your password to confirm deletion"
            v-bind="filterUndefined(componentField)"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <DialogFooter class="flex gap-3 pt-4">
      <Button
        variant="destructive"
        type="submit"
        class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        Delete My Account
      </Button>
    </DialogFooter>
  </form>
</template>
