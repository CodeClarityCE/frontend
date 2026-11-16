<script lang="ts" setup>
import { ArrowLeft } from "@lucide/vue";
import { computed } from "vue";
import { RouterLink } from "vue-router";

import { BrandEmphasis, PageHeading } from "@/base_components/page";
import { Button } from "@/shadcn/ui/button";

// Shown for organisation URLs that match no page, with a way back.
const props = withDefaults(
  defineProps<{ orgId?: string; subject?: string; description?: string }>(),
  {
    orgId: undefined,
    subject: "Page",
    description: "This organisation page does not exist or has been moved.",
  },
);

const back = computed(() =>
  props.orgId
    ? {
        to: {
          name: "orgs",
          params: { action: "manage", page: "main", orgId: props.orgId },
        },
        label: "Back to the organisation",
      }
    : {
        to: { name: "orgs", params: { action: "list" } },
        label: "Organisations",
      },
);
</script>

<template>
  <div class="flex flex-col items-start gap-6">
    <PageHeading :description="description">
      {{ subject }} <BrandEmphasis>not found</BrandEmphasis>
    </PageHeading>
    <Button :as="RouterLink" :to="back.to" variant="outline">
      <ArrowLeft aria-hidden="true" class="size-4" />
      {{ back.label }}
    </Button>
  </div>
</template>
