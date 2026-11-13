<script setup lang="ts">
import router from "@/router";
import { Button } from "@/shadcn/ui/button";

import PublicPageLayout from "./PublicPageLayout.vue";

// A long-form legal document with readable type and a way back.
defineProps<{
  lang?: string;
}>();
</script>

<template>
  <PublicPageLayout>
    <article
      :lang="lang"
      class="mx-auto flex max-w-3xl flex-col gap-4 leading-relaxed [&_a]:rounded-sm [&_a]:font-medium [&_a]:text-brand-subtle-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-ring [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground-strong [&_li]:my-1 [&_p]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
    >
      <h1 class="text-3xl font-bold tracking-tight text-foreground-strong">
        <slot name="title" />
      </h1>
      <slot />
      <div class="mt-6">
        <Button variant="outline" @click="router.back()">Go back</Button>
      </div>
    </article>
  </PublicPageLayout>
</template>
