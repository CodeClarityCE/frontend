<script setup lang="ts">
import {
    MemberRole,
    type Organization,
    isMemberRoleGreaterOrEqualTo
} from '@/codeclarity_components/organizations/organization.entity';
import Button from '@/shadcn/ui/button/Button.vue';
import { Icon } from '@iconify/vue';

defineProps<{
    defaultOrg: Organization;
}>();

const emit = defineEmits<{
    (e: 'onRefresh'): void;
}>();
</script>
<template>
    <div class="flex flex-col gap-12 w-fit" style="max-width: 800px">
        <div>
            <div class="text-grayTitle text-4xl font-semibold">You have no VCS integration</div>
            <div class="text-gray-600 text-base font-semibold">
                Without a VCS integration you cannot add any projects
            </div>
        </div>

        <div class="flex flex-col gap-5 w-fit" style="font-size: 1.5em">
            <div>
                <div class="flex flex-col gap-5">
                    <div class="flex flex-col gap-2">
                        <div>No integrations found</div>
                        <div
                            class="text-xs"
                            v-if="isMemberRoleGreaterOrEqualTo(defaultOrg.role, MemberRole.ADMIN)"
                        >
                            To be able to import projects you must add an integration with either
                            Github or GitLab. Please visit the link below and add such an
                            integration. You can then reload this page or click on the "Refresh"
                            button.
                        </div>
                        <div class="text-xs" v-else>
                            To be able to import projects you must add an integration with either
                            Github or GitLab. Please ask an admin or the owner of the organization
                            to add such an integration.
                        </div>
                    </div>
                    <div class="flex flex-row gap-2 items-center flex-wrap">
                        <Button
                            @click="emit('onRefresh')"
                            v-if="isMemberRoleGreaterOrEqualTo(defaultOrg.role, MemberRole.ADMIN)"
                        >
                            Refresh
                        </Button>
                        <Button @click="$router.back()"> Go back </Button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="isMemberRoleGreaterOrEqualTo(defaultOrg.role, MemberRole.ADMIN)">
            <RouterLink
                :to="{
                    name: 'orgManage',
                    params: { orgId: defaultOrg.id, page: 'integrations' }
                }"
                target="_blank"
            >
                <div class="flex flex-row gap-1 items-center">
                    <Icon class="text-lg" icon="ion:open-outline"></Icon>
                    <div class="text-xl font-normal">Manage your integrations</div>
                </div>
            </RouterLink>
        </div>
    </div>
</template>
