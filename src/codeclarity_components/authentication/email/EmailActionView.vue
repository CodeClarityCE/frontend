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
  <!-- Joining needs a signed-in user, so it renders inside the app shell's main. -->
  <div v-if="props.page === 'join_org'" class="flex flex-col gap-8 p-8">
    <EmailActionJoinOrg />
  </div>
  <PasswordResetForm v-else-if="props.page === 'reset_password'" />
  <ConfirmRegistration v-else />
</template>
