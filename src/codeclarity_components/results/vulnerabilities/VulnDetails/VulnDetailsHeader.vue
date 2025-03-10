<template>
    <div class="header flex flex-col gap-5">
        <!--------------------------------------------------------------------------->
        <!--                           Vulnerability id                            -->
        <!--------------------------------------------------------------------------->
        <div class="title">
            <div>{{ finding.vulnerability_info.vulnerability_id }}</div>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                      Vulnerability type in library                    -->
        <!--------------------------------------------------------------------------->
        <div class="text-3xl my-6">
            <span v-if="finding.weaknesses.length > 0">{{ finding.weaknesses[0].name }}</span>
            in
            <span style="font-family: lato; font-weight: 900; color: teal">{{
                finding.dependency_info?.name + '@' + finding.dependency_info?.version
            }}</span>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                      Affected and patched versions                    -->
        <!--------------------------------------------------------------------------->
        <div class="affected-versions-wrapper">
            <!--------------------------------------------------------------------------->
            <!--                              Affected versions                        -->
            <!--------------------------------------------------------------------------->
            <div>
                <span style="font-family: lato; font-weight: 900">
                    Affected versions of
                    {{ finding.dependency_info?.name }}:
                </span>
                {{ finding.vulnerability_info.version_info.affected_versions_string }}
            </div>

            <!--------------------------------------------------------------------------->
            <!--                              Patched versions                         -->
            <!--------------------------------------------------------------------------->
            <div v-if="finding.vulnerability_info.version_info.patched_versions_string.length > 0">
                <span style="font-family: lato; font-weight: 900">
                    Patched versions of
                    {{ finding.dependency_info?.name }}:
                </span>
                {{ finding.vulnerability_info.version_info.patched_versions_string }}
            </div>
            <div v-if="finding.vulnerability_info.version_info.patched_versions_string.length == 0">
                <span style="font-family: lato; font-weight: 900">
                    Patched versions of
                    {{ finding.dependency_info?.name }}:
                </span>
                No patched versions exist
            </div>

            <Badge
                variant="secondary"
                @click="versions_modal_ref.show()"
                id="show-all-versions"
                class="w-fit cursor-pointer"
            >
                Show all versions <Icon :icon="'heroicons:chevron-right-20-solid'"></Icon>
            </Badge>
        </div>
    </div>
</template>

<script setup lang="ts">
import PositionedModalVue from '@/base_components/PositionedModal.vue';
import type { VulnerabilityDetails } from '@/codeclarity_components/results/vulnerabilities/VulnDetails/VulnDetails';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import { Icon } from '@iconify/vue';
defineProps<{
    finding: VulnerabilityDetails;
    versions_modal_ref: typeof PositionedModalVue;
}>();
</script>

<style scoped lang="scss">
@use '@/assets/colors.scss';
@use '@/assets/common/details.scss';
</style>
