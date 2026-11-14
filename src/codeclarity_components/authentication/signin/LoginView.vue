<script setup lang="ts">
import { CircleAlert } from "@lucide/vue";
import { useRoute } from "vue-router";

import BrandEmphasis from "@/base_components/page/BrandEmphasis.vue";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { useStateStore } from "@/stores/state";

import AuthLayout from "../layout/AuthLayout.vue";
import TextLink from "../layout/TextLink.vue";

import { loginNoticeMessage } from "./login-route";
import UserAuthForm from "./UserAuthForm.vue";

const state = useStateStore();
state.$reset();

state.page = "signup";
state.publicPage = true;

// Why another page sent the visitor here, if it said.
const notice = loginNoticeMessage(useRoute().query.notice);
</script>

<template>
  <AuthLayout>
    <template #title>
      Sign in to <BrandEmphasis>CodeClarity</BrandEmphasis>
    </template>
    <template #description>
      Welcome back. Please enter your credentials.
    </template>

    <Alert v-if="notice" variant="destructive" class="mb-4">
      <CircleAlert aria-hidden="true" />
      <AlertDescription>{{ notice }}</AlertDescription>
    </Alert>
    <UserAuthForm />

    <template #footer>
      <span>
        New to CodeClarity?
        <TextLink :to="{ name: 'signup' }">Create an account</TextLink>
      </span>
    </template>
  </AuthLayout>
</template>
