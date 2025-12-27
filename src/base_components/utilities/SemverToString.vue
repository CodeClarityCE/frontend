<script lang="ts" setup>
import type { SemVer } from "@/codeclarity_components/results/patching/Patching";
import Badge from "@/shadcn/ui/badge/Badge.vue";

defineProps<{
  semver?: SemVer;
}>();
</script>
<template>
  <Badge v-if="semver">
    {{ semver.Major }}.{{ semver.Minor }}.{{ semver.Patch
    }}<span v-if="semver.PreReleaseTag !== ''">-</span
    >{{ semver.PreReleaseTag }}
  </Badge>
  <Badge v-else variant="destructive">unpatchable</Badge>
</template>
