<script setup lang="ts">
import { RefreshCw, Upload } from "@lucide/vue";
import { RouterLink } from "vue-router";

import {
  isMemberRoleGreaterOrEqualTo,
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";

defineProps<{
  defaultOrg: Organization;
}>();

const emit = defineEmits<{
  (e: "onRefresh"): void;
  (e: "onLocalUpload"): void;
}>();
</script>
<template>
  <Card>
    <CardHeader>
      <CardTitle>No GitHub or GitLab integration yet</CardTitle>
      <CardDescription>
        Upload an archive of the project now, or connect GitHub or GitLab to
        import repositories directly.
      </CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <p class="text-sm text-muted-foreground">
        <template
          v-if="isMemberRoleGreaterOrEqualTo(defaultOrg.role, MemberRole.ADMIN)"
        >
          Add an integration in the organisation settings, then refresh this
          page.
        </template>
        <template v-else>
          Ask an organisation admin or owner to add an integration.
        </template>
      </p>
      <div class="flex flex-wrap gap-3">
        <Button @click="emit('onLocalUpload')">
          <Upload aria-hidden="true" />
          Upload an archive
        </Button>
        <Button
          v-if="isMemberRoleGreaterOrEqualTo(defaultOrg.role, MemberRole.ADMIN)"
          :as="RouterLink"
          :to="{
            name: 'orgs',
            params: {
              orgId: defaultOrg.id,
              page: 'integrations',
              action: 'manage',
            },
          }"
          variant="outline"
        >
          Manage integrations
        </Button>
        <Button variant="outline" @click="emit('onRefresh')">
          <RefreshCw aria-hidden="true" />
          Refresh
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
