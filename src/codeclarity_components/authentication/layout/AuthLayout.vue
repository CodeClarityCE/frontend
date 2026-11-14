<script setup lang="ts">
import { Card, CardContent, CardFooter, CardHeader } from "@/shadcn/ui/card";

import BrandHeader from "./BrandHeader.vue";
import TextLink from "./TextLink.vue";

// Shared frame for the sign-in, sign-up and account recovery pages.
withDefaults(
  defineProps<{
    width?: "default" | "wide";
  }>(),
  { width: "default" },
);
</script>

<template>
  <div class="flex min-h-svh flex-col bg-muted text-foreground">
    <BrandHeader />

    <main class="flex flex-1 items-start justify-center px-4 py-12">
      <Card
        :class="[
          'w-full rounded-card border-border shadow-raised',
          width === 'wide' ? 'max-w-xl' : 'max-w-md',
        ]"
      >
        <CardHeader class="gap-y-2 p-8 pb-6">
          <slot name="icon" />
          <h1 class="text-2xl font-bold tracking-tight text-foreground-strong">
            <slot name="title" />
          </h1>
          <p v-if="$slots['description']" class="text-sm text-muted-foreground">
            <slot name="description" />
          </p>
        </CardHeader>
        <CardContent class="px-8 pb-8">
          <slot />
        </CardContent>
        <CardFooter
          v-if="$slots['footer']"
          class="justify-center border-t border-border px-8 py-5 text-sm text-muted-foreground"
        >
          <slot name="footer" />
        </CardFooter>
      </Card>
    </main>

    <footer
      class="flex justify-center gap-6 px-8 py-6 text-sm text-muted-foreground"
    >
      <TextLink :to="{ name: 'terms' }">Terms of service</TextLink>
      <TextLink :to="{ name: 'privacy' }">Privacy policy</TextLink>
    </footer>
  </div>
</template>
