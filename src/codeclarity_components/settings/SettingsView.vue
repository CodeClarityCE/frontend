<script setup lang="ts">
import { PageHeader, InfoCard, StatCard } from "@/base_components";
import LoadingComponent from "@/base_components/ui/loaders/LoadingComponent.vue";
import ErrorComponent from "@/base_components/utilities/ErrorComponent.vue";
import { Button } from "@/shadcn/ui/button";
import { useStateStore } from "@/stores/state";
import { User, Lock, Trash2, Shield } from "lucide-vue-next";
import {
  defineAsyncComponent,
  type AsyncComponentLoader,
  type Component,
} from "vue";

const SettingAccount = defineAsyncComponent({
  loader: (() => import("./forms/SettingAccount.vue")) as AsyncComponentLoader,
  loadingComponent: LoadingComponent as Component,
  // Delay before showing the loading component. Default: 200ms.
  delay: 200,
  errorComponent: ErrorComponent as Component,
  // The error component will be displayed if a timeout is
  // provided and exceeded. Default: Infinity.
  timeout: 3000,
}) as Component;

const state = useStateStore();
state.$reset();

state.page = "settings";

const props = defineProps<{
  page?: string;
}>();

// Mock stats for account settings overview
const accountStats = {
  lastLogin: "2 days ago",
  passwordStrength: "Strong",
  dataUsage: "2.4 GB",
  accountAge: "8 months",
};
</script>

<template>
  <main class="min-h-screen bg-white p-6">
    <!-- Page Header -->
    <PageHeader
      title="Account Settings"
      description="Manage your personal information, security settings, and account preferences"
      :show-last-updated="false"
      :show-refresh="false"
    />

    <!-- Account Overview Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <StatCard
        label="Last Login"
        :value="accountStats.lastLogin"
        icon="solar:login-3-bold"
        variant="default"
        subtitle="Recent activity"
      />

      <StatCard
        label="Password Strength"
        :value="accountStats.passwordStrength"
        icon="solar:shield-check-bold"
        variant="success"
        subtitle="Security status"
      />

      <StatCard
        label="Data Usage"
        :value="accountStats.dataUsage"
        icon="solar:database-bold"
        variant="primary"
        subtitle="Storage used"
      />

      <StatCard
        label="Account Age"
        :value="accountStats.accountAge"
        icon="solar:calendar-bold"
        variant="default"
        subtitle="Member since"
      />
    </div>

    <!-- Settings Content -->
    <div v-if="props.page === 'account'">
      <SettingAccount />
    </div>

    <!-- Settings Navigation (if no specific page) -->
    <div v-else class="grid gap-8 lg:grid-cols-2">
      <!-- Account Management -->
      <InfoCard
        title="Account Management"
        description="Personal information and profile settings"
        icon="solar:user-bold"
        variant="primary"
      >
        <div class="space-y-4">
          <div
            class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
          >
            <div class="p-2 bg-theme-primary/10 rounded-lg">
              <User class="h-5 w-5 text-theme-primary" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-theme-black mb-1">
                Personal Information
              </h3>
              <p class="text-sm text-theme-gray mb-3">
                Update your name, email, and profile details
              </p>
              <Button
                variant="outline"
                size="sm"
                class="border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
              >
                Manage Profile
              </Button>
            </div>
          </div>

          <div
            class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
          >
            <div class="p-2 bg-theme-black/10 rounded-lg">
              <Lock class="h-5 w-5 text-theme-black" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-theme-black mb-1">
                Security Settings
              </h3>
              <p class="text-sm text-theme-gray mb-3">
                Password, two-factor authentication
              </p>
              <Button
                variant="outline"
                size="sm"
                class="border-theme-black text-theme-black hover:bg-theme-black hover:text-white"
              >
                Security Options
              </Button>
            </div>
          </div>
        </div>
      </InfoCard>

      <!-- Security & Privacy -->
      <InfoCard
        title="Security & Privacy"
        description="Protect your account and manage your data"
        icon="solar:shield-bold"
        variant="default"
      >
        <div class="space-y-4">
          <div
            class="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
          >
            <div class="p-2 bg-green-50 rounded-lg">
              <Shield class="h-5 w-5 text-green-600" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-theme-black mb-1">
                Privacy Controls
              </h3>
              <p class="text-sm text-theme-gray mb-3">
                Data sharing and privacy preferences
              </p>
              <Button
                variant="outline"
                size="sm"
                class="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              >
                Privacy Settings
              </Button>
            </div>
          </div>

          <div
            class="flex items-start gap-4 p-4 rounded-xl bg-red-50 border border-red-200"
          >
            <div class="p-2 bg-red-100 rounded-lg">
              <Trash2 class="h-5 w-5 text-red-600" />
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-red-800 mb-1">Danger Zone</h3>
              <p class="text-sm text-red-600 mb-3">
                Permanently delete your account
              </p>
              <Button variant="destructive" size="sm"> Delete Account </Button>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  </main>
</template>
