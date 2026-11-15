<script lang="ts" setup>
import { cn } from "@/shadcn/lib/utils";
import { buttonVariants } from "@/shadcn/ui/button";

import AuthLayout from "../layout/AuthLayout.vue";

// Shown instead of the reset forms while the server cannot reset passwords.
</script>
<template>
  <AuthLayout>
    <template #title>Password reset is not available</template>
    <template #description>
      This CodeClarity server cannot reset passwords yet.
    </template>

    <div class="flex flex-col gap-6">
      <p class="text-sm">
        If you cannot sign in, ask an administrator of your organisation or of
        this server for help.
      </p>
      <RouterLink
        :to="{ name: 'login' }"
        :class="cn(buttonVariants(), 'w-full')"
      >
        Back to sign in
      </RouterLink>
    </div>
  </AuthLayout>
</template>
