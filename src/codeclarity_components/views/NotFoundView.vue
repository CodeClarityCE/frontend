<script setup lang="ts">
import BrandEmphasis from "@/codeclarity_components/authentication/layout/BrandEmphasis.vue";
import router from "@/router";
import { Button, buttonVariants } from "@/shadcn/ui/button";

import PublicPageLayout from "./PublicPageLayout.vue";
</script>

<template>
  <PublicPageLayout>
    <div
      class="mx-auto flex max-w-5xl items-center justify-center gap-16 py-12"
    >
      <div class="flex max-w-xl flex-col gap-6">
        <p
          class="text-8xl font-black leading-none tracking-tight text-muted-foreground"
        >
          404
        </p>
        <h1 class="text-4xl font-bold tracking-tight text-foreground-strong">
          Page <BrandEmphasis>not found</BrandEmphasis>
        </h1>
        <p class="text-lg text-muted-foreground">
          Our owl searched every branch, but the page you are looking for does
          not exist or has been moved.
        </p>
        <div class="flex gap-3">
          <Button @click="router.back()">Go back</Button>
          <RouterLink to="/" :class="buttonVariants({ variant: 'outline' })">
            Go to the dashboard
          </RouterLink>
        </div>
      </div>
      <img
        src="@/assets/images/logos/logo-green.svg"
        alt="The CodeClarity owl"
        class="h-72 w-auto shrink-0"
      />
    </div>
  </PublicPageLayout>
</template>
