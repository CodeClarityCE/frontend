<script lang="ts" setup>
import EmailActionJoinOrg from "@/codeclarity_components/organizations/invites/OrganizationJoin.vue";
import { useStateStore } from "@/stores/state";

import ConfirmRegistration from "./ConfirmRegistration.vue";
import PasswordResetForm from "./PasswordResetForm.vue";

const state = useStateStore();
state.$reset();

state.page = "emailAction";

const props = defineProps<{
  page?: string;
}>();
</script>
<template>
  <main class="p-12">
    <EmailActionJoinOrg v-if="props.page === 'join_org'" />
    <PasswordResetForm
      v-else-if="props.page === 'reset_password'"
    ></PasswordResetForm>
    <ConfirmRegistration v-else></ConfirmRegistration>
  </main>
</template>
