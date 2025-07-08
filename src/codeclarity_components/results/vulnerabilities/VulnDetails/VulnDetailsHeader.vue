<script setup lang="ts">
import PositionedModalVue from '@/base_components/ui/modals/PositionedModal.vue';
import type { VulnerabilityDetails } from '@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails';
import { Icon } from '@iconify/vue';
defineProps<{
    finding: VulnerabilityDetails;
    versionsModalRef: typeof PositionedModalVue;
}>();
</script>

<template>
    <div class="header flex flex-col gap-5 bg-white shadow-md rounded-lg p-6">
        <!--------------------------------------------------------------------------->
        <!--                           Vulnerability id                            -->
        <!--------------------------------------------------------------------------->
        <div class="text-3xl font-black text-gray-800">
            <div>{{ finding.vulnerability_info.vulnerability_id }}</div>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                      Vulnerability type in library                    -->
        <!--------------------------------------------------------------------------->
        <div class="text-3xl my-1 text-gray-700">
            <span v-if="finding.weaknesses.length > 0">{{ finding.weaknesses[0].name }}</span>
            in
            <span class="font-black text-theme-primary">
                {{ finding.dependency_info?.name + '@' + finding.dependency_info?.version }}
            </span>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                      Affected and patched versions                    -->
        <!--------------------------------------------------------------------------->
        <div class="text-gray-600">
            <!--------------------------------------------------------------------------->
            <!--                              Affected versions                        -->
            <!--------------------------------------------------------------------------->
            <div>
                <span class="font-black">
                    Affected versions of {{ finding.dependency_info?.name }}:
                </span>
                {{ finding.vulnerability_info.version_info.affected_versions_string }}
            </div>
            <div
                v-if="finding.vulnerability_info.version_info.affected_versions_string == '*'"
                class="flex gap-1 items-center text-red-500"
            >
                <Icon icon="tabler:alert-triangle-filled"></Icon>
                This vulnerability affects all versions of the library and might be a false positive
            </div>
        </div>
    </div>
</template>
