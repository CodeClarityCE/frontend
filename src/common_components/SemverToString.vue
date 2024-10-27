<template>
    <Badge v-if="semver">
        {{ semver.Major }}.{{ semver.Minor }}.{{ semver.Patch
        }}<span v-if="semver.PreReleaseTag != ''">-</span>{{ semver.PreReleaseTag }}
    </Badge>
    <Badge variant="destructive" v-else>unpatchable</Badge>
</template>
<script lang="ts" setup>
import type { SemVer } from '@/repositories/types/entities/Patching';
import Badge from '@/shadcn/ui/badge/Badge.vue';

defineProps({
    semver: {
        type: Object as () => SemVer,
        required: true
    }
});
</script>
