<script setup lang="ts">
import BrandEmphasis from "@/base_components/page/BrandEmphasis.vue";
import { useStateStore } from "@/stores/state";

import AuthLayout from "../layout/AuthLayout.vue";
import TextLink from "../layout/TextLink.vue";

import UserAuthForm from "./UserAuthForm.vue";

const state = useStateStore();
state.$reset();

state.page = "signup";
state.publicPage = true;
</script>

<template>
  <AuthLayout>
    <template #title>
      Sign in to <BrandEmphasis>CodeClarity</BrandEmphasis>
    </template>
    <template #description>
      Welcome back. Please enter your credentials.
    </template>

    <UserAuthForm />

    <template #footer>
      <span>
        New to CodeClarity?
        <TextLink :to="{ name: 'signup' }">Create an account</TextLink>
      </span>
    </template>
  </AuthLayout>
</template>
