<script setup lang="ts">
import {
    MemberRole,
    type Organization,
    isMemberRoleGreaterOrEqualTo
} from '@/codeclarity_components/organizations/organization.entity';
import { InfoCard } from '@/base_components';
import Button from '@/shadcn/ui/button/Button.vue';
import { Icon } from '@iconify/vue';
import { RouterLink } from 'vue-router';

defineProps<{
    defaultOrg: Organization;
}>();

const emit = defineEmits<{
    (e: 'onRefresh'): void;
}>();
</script>
<template>
    <InfoCard
        title="No VCS Integration Found"
        description="Connect your version control system to start importing projects"
        icon="solar:code-square-bold"
        variant="warning"
    >
        <div class="space-y-6">
            <!-- Explanation -->
            <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div class="flex items-start gap-3">
                    <Icon icon="solar:info-circle-bold" class="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                        <p class="font-medium text-yellow-800 mb-1">Integration Required</p>
                        <p class="text-sm text-yellow-700">
                            <span
                                v-if="
                                    isMemberRoleGreaterOrEqualTo(defaultOrg.role, MemberRole.ADMIN)
                                "
                            >
                                To import projects, you need to add an integration with GitHub or
                                GitLab. Set up your integration and then refresh this page.
                            </span>
                            <span v-else>
                                To import projects, an integration with GitHub or GitLab is
                                required. Please ask an admin or organization owner to set up the
                                integration.
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-3">
                <Button
                    class="bg-theme-primary hover:bg-theme-primary/90 text-white"
                    @click="emit('onRefresh')"
                >
                    <Icon icon="solar:refresh-bold" class="h-4 w-4 mr-2" />
                    Refresh
                </Button>

                <Button
                    variant="outline"
                    class="border-gray-300 text-gray-700 hover:border-theme-primary hover:text-theme-primary"
                    @click="$router.back()"
                >
                    Go Back
                </Button>

                <Button
                    v-if="isMemberRoleGreaterOrEqualTo(defaultOrg.role, MemberRole.ADMIN)"
                    variant="outline"
                    class="border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-white"
                    as-child
                >
                    <RouterLink
                        :to="{
                            name: 'orgManage',
                            params: { orgId: defaultOrg.id, page: 'integrations' }
                        }"
                        target="_blank"
                        class="flex items-center gap-2"
                    >
                        <Icon icon="solar:settings-bold" class="h-4 w-4" />
                        Manage Integrations
                    </RouterLink>
                </Button>
            </div>
        </div>
    </InfoCard>
</template>
