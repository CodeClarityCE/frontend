<script lang="ts" setup>
import { ref } from 'vue';
import Licenses from './LicensesComponent.vue';
// Import stores
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import Alert from '@/shadcn/ui/alert/Alert.vue';
import { AlertDescription } from '@/shadcn/ui/alert';
// Import theme components
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import { Icon } from '@iconify/vue';

defineProps<{
    analysis: Analysis;
    project: Project;
}>();

const no_deps = false;
const licenses_ref = ref(null);
</script>

<template>
    <div class="w-full space-y-8">
        <!-- Alert for no dependencies -->
        <Alert v-if="no_deps" class="border-l-4 border-l-theme-primary bg-red-50">
            <Icon icon="solar:danger-triangle-bold" class="h-5 w-5 text-red-600" />
            <AlertDescription class="ml-3">
                <div class="text-red-800">
                    <h4 class="font-semibold mb-2">No Dependencies Found</h4>
                    <p class="mb-4">
                        We did not find any dependencies in your project. This could be a failure of
                        our analyzer or it could be because the project does not have the required
                        files.
                    </p>

                    <p class="mb-3 font-medium">A project needs to contain the following files:</p>
                    <ul class="list-disc ml-6 space-y-2 mb-4">
                        <li>
                            <span class="font-medium">Package manifest:</span>
                            <a
                                href="https://docs.npmjs.com/cli/v9/configuring-npm/package-json"
                                target="_blank"
                                class="text-theme-primary hover:text-theme-primary-dark underline ml-1"
                            >
                                package.json
                                <Icon
                                    icon="solar:external-link-outline"
                                    class="inline h-3 w-3 ml-1"
                                />
                            </a>
                        </li>
                        <li>
                            <div class="flex items-center gap-2">
                                <span class="font-medium">Lockfile:</span>
                                <div class="flex items-center gap-2">
                                    <Icon icon="fa-brands:yarn" class="h-4 w-4 text-blue-500" />
                                    <a
                                        href="https://classic.yarnpkg.com/lang/en/docs/yarn-lock/"
                                        target="_blank"
                                        class="text-theme-primary hover:text-theme-primary-dark underline"
                                    >
                                        yarn.lock
                                        <Icon
                                            icon="solar:external-link-outline"
                                            class="inline h-3 w-3 ml-1"
                                        />
                                    </a>
                                    <span class="text-gray-600">or</span>
                                    <Icon icon="fa-brands:npm" class="h-4 w-4 text-red-500" />
                                    <a
                                        href="https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json"
                                        target="_blank"
                                        class="text-theme-primary hover:text-theme-primary-dark underline"
                                    >
                                        package-lock.json
                                        <Icon
                                            icon="solar:external-link-outline"
                                            class="inline h-3 w-3 ml-1"
                                        />
                                    </a>
                                </div>
                            </div>
                        </li>
                    </ul>

                    <p class="mb-4">
                        These two files need to be located at the same level in the file tree of
                        your project.
                    </p>

                    <p>
                        In case your project has the required files, but still fails to be analyzed,
                        then please accept our apologies for the inconvenience. Since our product is
                        still in the beta phase, you can help us iron out the issues by contacting
                        us at:
                        <a
                            href="mailto:help@codeclarity.io"
                            class="text-theme-primary hover:text-theme-primary-dark underline font-medium"
                        >
                            help@codeclarity.io
                        </a>
                    </p>
                </div>
            </AlertDescription>
        </Alert>

        <!-- License Analysis Section -->
        <InfoCard
            title="License Analysis"
            description="Detailed license compliance and risk assessment for your project dependencies"
            icon="solar:document-text-bold"
            variant="primary"
        >
            <Licenses ref="licenses_ref" :analysis-i-d="analysis.id" :project-i-d="project.id" />
        </InfoCard>
    </div>
</template>
