<script setup lang="ts">
import { computed, useId } from "vue";

import { StatusBadge } from "@/base_components/page";
import { RadioGroup, RadioGroupItem } from "@/shadcn/ui/radio-group";
import { Skeleton } from "@/shadcn/ui/skeleton";

export interface PolicyOption {
  id: string;
  name: string;
  description: string;
  default: boolean;
  content: string[];
}

// One policy (or none) out of the organisation's policies.
defineProps<{
  label: string;
  description: string;
  // Names what a policy's list holds, such as "Ignored".
  contentLabel: string;
  noPolicyHint: string;
  policies: PolicyOption[];
  loading: boolean;
  failed: boolean;
}>();

const selected = defineModel<string | null>({ default: null });

const NONE = "none";
const id = useId();

const value = computed({
  get: () => selected.value ?? NONE,
  set: (next: string) => {
    selected.value = next === NONE ? null : next;
  },
});

const itemClass =
  "mt-0.5 border-muted-foreground focus-visible:ring-2 focus-visible:ring-offset-2 data-[state=checked]:border-foreground-strong";
const cardClass =
  "flex cursor-pointer items-start gap-3 rounded-control border p-3 has-[[data-state=checked]]:border-foreground-strong has-[[data-state=checked]]:bg-muted";
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col gap-1">
      <h3
        :id="`${id}-label`"
        class="text-base font-semibold text-foreground-strong"
      >
        {{ label }}
      </h3>
      <p :id="`${id}-hint`" class="text-sm text-muted-foreground">
        {{ description }}
      </p>
    </div>

    <div
      v-if="loading"
      role="status"
      :aria-label="`Loading the ${label.toLowerCase()} options`"
      class="flex flex-col gap-2"
    >
      <Skeleton v-for="row in 2" :key="row" class="h-14 w-full" />
    </div>

    <p v-else-if="failed" class="text-sm text-danger">
      The policies could not be loaded. The analysis runs without one.
    </p>

    <template v-else>
      <RadioGroup
        v-model="value"
        :aria-labelledby="`${id}-label`"
        :aria-describedby="`${id}-hint`"
      >
        <label :class="cardClass">
          <RadioGroupItem :value="NONE" :class="itemClass" />
          <span class="flex flex-col gap-0.5">
            <span class="text-sm font-medium text-foreground-strong">
              No policy
            </span>
            <span class="text-sm text-muted-foreground">
              {{ noPolicyHint }}
            </span>
          </span>
        </label>
        <label v-for="policy in policies" :key="policy.id" :class="cardClass">
          <RadioGroupItem :value="policy.id" :class="itemClass" />
          <span class="flex min-w-0 flex-col gap-0.5">
            <span
              class="flex items-center gap-2 text-sm font-medium text-foreground-strong"
            >
              {{ policy.name }}
              <StatusBadge
                v-if="policy.default"
                tone="neutral"
                label="Default"
              />
            </span>
            <span class="text-sm text-muted-foreground">
              {{ policy.description }}
            </span>
            <span class="break-words text-xs text-muted-foreground">
              {{ contentLabel }}: {{ policy.content.join(", ") }}
            </span>
          </span>
        </label>
      </RadioGroup>
      <p v-if="policies.length === 0" class="text-sm text-muted-foreground">
        <slot name="empty" />
      </p>
    </template>
  </div>
</template>
