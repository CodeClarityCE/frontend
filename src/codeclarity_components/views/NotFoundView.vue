<script setup lang="ts">
import BrandEmphasis from "@/base_components/page/BrandEmphasis.vue";
import router from "@/router";
import { Button, buttonVariants } from "@/shadcn/ui/button";

import PublicPageLayout from "./PublicPageLayout.vue";
</script>

<template>
  <PublicPageLayout>
    <div
      class="mx-auto flex max-w-5xl flex-col-reverse items-center justify-center gap-10 py-12 md:flex-row md:gap-16"
    >
      <div class="flex min-w-0 max-w-xl flex-col gap-6">
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
        <div class="flex flex-wrap gap-3">
          <Button @click="router.back()">Go back</Button>
          <RouterLink to="/" :class="buttonVariants({ variant: 'outline' })">
            Go to the dashboard
          </RouterLink>
        </div>
      </div>
      <img
        src="@/assets/images/logos/logo-green.svg"
        alt="The CodeClarity owl"
        class="h-40 w-auto shrink-0 md:h-72"
      />
    </div>
  </PublicPageLayout>
</template>
