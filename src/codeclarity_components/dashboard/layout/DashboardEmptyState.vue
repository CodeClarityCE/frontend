<template>
    <!-- Empty state when organization needs setup -->
    <div class="h-full relative">
        <!-- Loading skeleton -->
        <div class="flex flex-col gap-4 h-full">
            <div class="flex flex-row gap-5">
                <Skeleton class="h-14 w-10/12" />
                <Skeleton class="h-14 w-2/12" />
            </div>
            <Skeleton v-for="i in 6" :key="i" class="h-[16.6%] w-full min-h-32" />
        </div>

        <!-- Overlay content -->
        <div
            class="flex flex-col gap-4 items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg"
        >
            <!-- Error state -->
            <template v-if="isError">
                <Icon
                    class="text-red-500"
                    icon="solar:confounded-square-linear"
                    style="font-size: 5rem"
                />
                <div class="text-xl text-center">
                    Unable to fetch the state of your organization
                </div>
            </template>

            <!-- Setup needed state -->
            <template v-else>
                <Icon
                    class="text-gray-400"
                    icon="solar:sleeping-square-linear"
                    style="font-size: 5rem"
                />
                <div class="text-xl text-center">
                    <div v-if="!hasIntegrations">You have no integration with a VCS system yet</div>
                    <div v-else-if="!hasProjects">You have imported no projects yet</div>
                </div>

                <!-- Action buttons -->
                <RouterLink
                    v-if="!hasIntegrations"
                    :to="{
                        name: 'orgs',
                        params: { orgId: orgId, page: 'integrations', action: 'manage' }
                    }"
                >
                    <Button class="bg-theme-primary hover:bg-theme-primary-dark text-white">
                        Link to Github or Gitlab
                    </Button>
                </RouterLink>
                <RouterLink
                    v-else-if="!hasProjects"
                    :to="{ name: 'projects', params: { page: 'add' } }"
                >
                    <Button class="bg-theme-primary hover:bg-theme-primary-dark text-white">
                        <Icon icon="ion:add-sharp" /> Add a project
                    </Button>
                </RouterLink>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import Button from '@/shadcn/ui/button/Button.vue';
import Skeleton from '@/shadcn/ui/skeleton/Skeleton.vue';

/**
 * DashboardEmptyState - Shows when dashboard has no data
 *
 * Simple states:
 * - Loading skeleton
 * - Error message
 * - Setup guidance (no integrations/projects)
 */

interface Props {
    isError?: boolean;
    hasIntegrations?: boolean;
    hasProjects?: boolean;
    orgId?: string;
}

withDefaults(defineProps<Props>(), {
    isError: false,
    hasIntegrations: false,
    hasProjects: false,
    orgId: undefined
});
</script>
