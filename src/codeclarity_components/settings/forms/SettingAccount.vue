<script lang="ts" setup>
import { AlertTriangle, Info, Lock, Shield, Trash2 } from "lucide-vue-next";

import { InfoCard } from "@/base_components";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import Button from "@/shadcn/ui/button/Button.vue";
import Dialog from "@/shadcn/ui/dialog/Dialog.vue";
import DialogContent from "@/shadcn/ui/dialog/DialogContent.vue";
import DialogDescription from "@/shadcn/ui/dialog/DialogDescription.vue";
import DialogHeader from "@/shadcn/ui/dialog/DialogHeader.vue";
import DialogTitle from "@/shadcn/ui/dialog/DialogTitle.vue";
import DialogTrigger from "@/shadcn/ui/dialog/DialogTrigger.vue";
import { useStateStore } from "@/stores/state";

import DeleteUserForm from "./DeleteUserForm.vue";
import UpdateInfoForm from "./UpdateInfoForm.vue";
import UpdatePasswordForm from "./UpdatePasswordForm.vue";

const state = useStateStore();
state.menu = "settingsAccount";
</script>

<template>
  <div class="space-y-8">
    <!-- Personal Information Card -->
    <InfoCard
      title="Personal Information"
      description="Update your personal details and profile information"
      icon="solar:user-bold"
      variant="primary"
    >
      <div class="p-6 border border-gray-200 rounded-xl bg-white">
        <UpdateInfoForm />
      </div>
    </InfoCard>

    <!-- Password Security Card -->
    <InfoCard
      title="Password & Security"
      description="Change your password to keep your account secure"
      icon="solar:lock-password-bold"
      variant="default"
    >
      <div class="p-6 border border-gray-200 rounded-xl bg-white">
        <UpdatePasswordForm />
      </div>
    </InfoCard>

    <!-- Danger Zone Card -->
    <InfoCard
      title="Danger Zone"
      description="Permanently delete your account and all associated data"
      icon="solar:danger-triangle-bold"
      variant="danger"
    >
      <div class="p-6 border border-red-200 rounded-xl bg-red-50">
        <Alert variant="destructive" class="mb-6 border-red-200 bg-red-100">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription>
            <div class="text-sm leading-relaxed text-red-800">
              Deleting your account will permanently remove all associated
              information including: uploaded projects, analysis results,
              organizations, and license policies.
              <strong class="block mt-2">This action cannot be undone.</strong>
            </div>
          </AlertDescription>
        </Alert>

        <Dialog>
          <DialogTrigger as-child>
            <Button variant="destructive" class="w-full sm:w-auto">
              <Trash2 class="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle class="flex items-center gap-2 text-red-800">
                <Trash2 class="w-5 h-5 text-red-600" />
                Delete Account
              </DialogTitle>
              <DialogDescription class="text-theme-gray">
                Enter your password to confirm the deletion of your account.
                This action is permanent and cannot be reversed.
              </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
              <DeleteUserForm />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </InfoCard>

    <!-- Security Best Practices -->
    <InfoCard
      title="Security Best Practices"
      description="Follow these recommendations to keep your account safe and secure"
      icon="solar:shield-check-bold"
      variant="success"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
        >
          <div class="p-2 bg-theme-primary/10 rounded-lg shrink-0">
            <Lock class="w-5 h-5 text-theme-primary" />
          </div>
          <div>
            <h4 class="font-semibold text-theme-black mb-2">
              Strong Passwords
            </h4>
            <p class="text-sm text-theme-gray leading-relaxed">
              Use at least 10 characters with a mix of letters, numbers, and
              symbols.
            </p>
          </div>
        </div>

        <div
          class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
        >
          <div class="p-2 bg-theme-black/10 rounded-lg shrink-0">
            <Shield class="w-5 h-5 text-theme-black" />
          </div>
          <div>
            <h4 class="font-semibold text-theme-black mb-2">Regular Updates</h4>
            <p class="text-sm text-theme-gray leading-relaxed">
              Change your password regularly and keep your information up to
              date.
            </p>
          </div>
        </div>

        <div
          class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
        >
          <div class="p-2 bg-blue-50 rounded-lg shrink-0">
            <Info class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 class="font-semibold text-theme-black mb-2">Stay Informed</h4>
            <p class="text-sm text-theme-gray leading-relaxed">
              Monitor your account activity and report any suspicious behavior.
            </p>
          </div>
        </div>
      </div>
    </InfoCard>
  </div>
</template>
