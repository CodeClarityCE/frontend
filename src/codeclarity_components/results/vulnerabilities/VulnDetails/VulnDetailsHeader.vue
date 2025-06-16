<script setup lang="ts">
import PositionedModalVue from '@/base_components/PositionedModal.vue';
import type { VulnerabilityDetails } from '@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails';
import { Icon } from '@iconify/vue';
defineProps<{
    finding: VulnerabilityDetails;
    versionsModalRef: typeof PositionedModalVue;
}>();
</script>

<template>
    <div class="header flex flex-col gap-5">
        <!--------------------------------------------------------------------------->
        <!--                           Vulnerability id                            -->
        <!--------------------------------------------------------------------------->
        <div class="text-3xl font-black">
            <div>{{ finding.vulnerability_info.vulnerability_id }}</div>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                      Vulnerability type in library                    -->
        <!--------------------------------------------------------------------------->
        <div class="text-3xl my-1">
            <span v-if="finding.weaknesses.length > 0">{{ finding.weaknesses[0].name }}</span>
            in
            <span class="font-black text-primary">
                {{ finding.dependency_info?.name + '@' + finding.dependency_info?.version }}
            </span>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                      Affected and patched versions                    -->
        <!--------------------------------------------------------------------------->
        <div>
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
                class="text-severityMedium flex gap-1 items-center"
            >
                <Icon icon="tabler:alert-triangle-filled"></Icon>
                This vulnerability affectes all versions of the library and might be a false
                positive
            </div>

            <!--------------------------------------------------------------------------->
            <!--                              Patched versions                         -->
            <!--------------------------------------------------------------------------->
            <!-- <div v-if="finding.vulnerability_info.version_info.patched_versions_string.length > 0">
                <span class="font-black">
                    Patched versions of
                    {{ finding.dependency_info?.name }}:
                </span>
                {{ finding.vulnerability_info.version_info.patched_versions_string }}
            </div>
            <div v-if="finding.vulnerability_info.version_info.patched_versions_string.length == 0">
                <span class="font-black">
                    Patched versions of
                    {{ finding.dependency_info?.name }}:
                </span>
                No patched versions exist
            </div> -->

            <!-- <Badge variant="secondary" @click="versions_modal_ref.show()" id="show-all-versions"
                class="w-fit cursor-pointer">
                Show all versions <Icon :icon="'heroicons:chevron-right-20-solid'"></Icon>
            </Badge> -->
        </div>
    </div>
</template>
