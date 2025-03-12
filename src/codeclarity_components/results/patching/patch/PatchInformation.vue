<template>
    <div class="flex gap-2 items-center justify-between">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbPage>Root</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbItem v-for="element in patch.Path" :key="element">
                    <BreadcrumbSeparator />
                    <BreadcrumbPage>{{ element }}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

        <Badge>{{ patch.Vulnerability.VulnerabilityId }}</Badge>

        <div>Impact: {{ patch.Vulnerability.Severity.Impact }}</div>

        <div>
            Patched version:
            <SemverToString
                :semver="patchInfo.Patches[patch.DependencyName + '@' + patch.DependencyVersion]"
            ></SemverToString>
        </div>
    </div>
</template>

<script setup lang="ts">
import SemverToString from '@/base_components/SemverToString.vue';
import type { PatchInfo, ToPatch } from '@/codeclarity_components/results/patching/Patching';
import Breadcrumb from '@/shadcn/ui/breadcrumb/Breadcrumb.vue';
import BreadcrumbItem from '@/shadcn/ui/breadcrumb/BreadcrumbItem.vue';
import BreadcrumbList from '@/shadcn/ui/breadcrumb/BreadcrumbList.vue';
import BreadcrumbPage from '@/shadcn/ui/breadcrumb/BreadcrumbPage.vue';
import BreadcrumbSeparator from '@/shadcn/ui/breadcrumb/BreadcrumbSeparator.vue';

defineProps<{
    patch: ToPatch;
    patchInfo: PatchInfo;
}>();
</script>
