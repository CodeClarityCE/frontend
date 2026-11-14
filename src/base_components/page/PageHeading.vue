<script setup lang="ts">
// A page title with optional description and actions. Wrap key words of the
// title in BrandEmphasis to give them the green mark.
defineProps<{ description?: string }>();
</script>

<template>
  <div class="flex items-start justify-between gap-6">
    <div class="flex min-w-0 flex-col gap-2">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="text-3xl font-bold tracking-tight text-foreground-strong">
          <slot />
        </h1>
        <slot name="badge" />
      </div>
      <p
        v-if="description || $slots.description"
        class="max-w-3xl text-base text-muted-foreground"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
