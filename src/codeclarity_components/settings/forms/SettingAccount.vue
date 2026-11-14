<script lang="ts" setup>
import { BrandEmphasis, PageHeading } from "@/base_components/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shadcn/ui/card";
import { useStateStore } from "@/stores/state";

import DeleteUserForm from "./DeleteUserForm.vue";
import UpdateInfoForm from "./UpdateInfoForm.vue";
import UpdatePasswordForm from "./UpdatePasswordForm.vue";

const state = useStateStore();
state.menu = "settingsAccount";
</script>

<template>
  <PageHeading description="Your name, your password and your account.">
    Account <BrandEmphasis>settings</BrandEmphasis>
  </PageHeading>

  <div class="flex max-w-3xl flex-col gap-6">
    <section aria-labelledby="settings-info-title">
      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h2
            id="settings-info-title"
            class="text-lg font-semibold text-foreground-strong"
          >
            Personal information
          </h2>
          <CardDescription>The name other members see.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateInfoForm />
        </CardContent>
      </Card>
    </section>

    <section aria-labelledby="settings-password-title">
      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h2
            id="settings-password-title"
            class="text-lg font-semibold text-foreground-strong"
          >
            Password
          </h2>
          <CardDescription>
            Use at least 10 characters. You stay signed in after the change.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </section>

    <section aria-labelledby="settings-delete-title">
      <Card class="rounded-card border-destructive/40 shadow-card">
        <CardHeader>
          <h2
            id="settings-delete-title"
            class="text-lg font-semibold text-foreground-strong"
          >
            Delete account
          </h2>
          <CardDescription>
            Removes your account with its projects, analysis results,
            organisations and licence policies. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteUserForm />
        </CardContent>
      </Card>
    </section>
  </div>
</template>
