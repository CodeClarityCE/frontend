<script setup lang="ts">
import { StatusBadge } from "@/base_components/page";

import { MemberRole } from "../organization.entity";

import { roleLabel } from "./member-role";

// A member's role in words; owners stand out, other roles stay neutral.
defineProps<{ role: MemberRole }>();
</script>

<template>
  <StatusBadge
    :tone="role === MemberRole.OWNER ? 'success' : 'neutral'"
    :label="roleLabel(role)"
  />
</template>
