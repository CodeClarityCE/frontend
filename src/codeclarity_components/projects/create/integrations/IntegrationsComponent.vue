<script setup lang="ts">
import type { VCS } from '@/codeclarity_components/organizations/integrations/Integrations';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import { Icon } from '@iconify/vue';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shadcn/ui/card';

defineProps<{
    vcsIntegrations: VCS[];
}>();

const emit = defineEmits<{
    (e: 'onSelectedVCS', selected: VCS): void;
}>();
</script>
<template>
    <div class="integrations-project-add-wrapper">
        <div class="flex flex-col gap-12">
            <div>
                <div class="text-grayTitle text-4xl font-semibold">
                    Where to import your repositories from?
                </div>
                <div class="text-gray-600 text-base font-semibold">
                    Select the integration from which you want to import the repositories.
                </div>
            </div>
            <div class="grid grid-cols-4 gap-2">
                <template v-for="vcs in vcsIntegrations">
                    <div
                        v-if="
                            vcs.integration_provider == IntegrationProvider.GITLAB &&
                            vcs.invalid == false
                        "
                        :key="vcs.id"
                        class="integration-box-wrapper-item a-no-style"
                        @click="emit('onSelectedVCS', vcs)"
                    >
                        <Card class="cursor-pointer">
                            <CardHeader>
                                <CardTitle class="flex gap-2 items-center">
                                    <Icon icon="devicon:gitlab" class="text-4xl"></Icon>
                                    GitLab
                                </CardTitle>
                                <CardDescription>Import a project</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                    <div
                        v-if="
                            vcs.integration_provider == IntegrationProvider.GITHUB &&
                            vcs.invalid == false
                        "
                        :key="vcs.id"
                        class="integration-box-wrapper-item a-no-style"
                        @click="emit('onSelectedVCS', vcs)"
                    >
                        <Card class="cursor-pointer">
                            <CardHeader>
                                <CardTitle class="flex gap-2 items-center">
                                    <Icon icon="devicon:github" class="text-4xl"></Icon>
                                    GitHub
                                </CardTitle>
                                <CardDescription>Import a project</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
