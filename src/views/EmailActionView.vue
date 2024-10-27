<script lang="ts" setup>
import { useStateStore } from '@/stores/state';
import EmailActionJoinOrg from '@/views/org/invites/OrgJoin.vue';
import PasswordResetForm from '@/views/login/PasswordResetForm.vue';
import ConfirmRegistration from '@/views/login/ConfirmRegistration.vue';

const state = useStateStore();
state.$reset();

state.page = 'emailAction';

const props = defineProps<{
    page?: string;
}>();
</script>
<template>
    <main class="p-12">
        <EmailActionJoinOrg v-if="props.page == 'join_org'" />
        <PasswordResetForm v-else-if="props.page == 'reset_password'"></PasswordResetForm>
        <ConfirmRegistration v-else></ConfirmRegistration>
    </main>
</template>
