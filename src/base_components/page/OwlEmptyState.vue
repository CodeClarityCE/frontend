<script setup lang="ts">
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/shadcn/ui/empty";

// The owl and a next step, for pages with nothing to show yet.
defineProps<{ title: string; description?: string }>();
</script>

<template>
  <Empty class="rounded-card border border-dashed bg-card py-16">
    <EmptyHeader class="max-w-md">
      <EmptyMedia>
        <img
          src="@/assets/images/logos/logo-green.svg"
          alt="The CodeClarity owl"
          class="h-24 w-auto"
        />
      </EmptyMedia>
      <h2 class="text-xl font-bold tracking-tight text-foreground-strong">
        {{ title }}
      </h2>
      <EmptyDescription v-if="description || $slots.description">
        <slot name="description">{{ description }}</slot>
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="$slots.default">
      <slot />
    </EmptyContent>
  </Empty>
</template>
