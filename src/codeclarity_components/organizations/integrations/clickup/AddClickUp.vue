<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { ShieldCheck } from "@lucide/vue";
import { ref } from "vue";
import { useRoute } from "vue-router";

import ClickUpConfigModal from "@/codeclarity_components/tickets/integrations/ClickUpConfigModal.vue";
import router from "@/router";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/shadcn/ui/card";

const route = useRoute();
const orgId = typeof route.params.orgId === "string" ? route.params.orgId : "";
const showConfigModal = ref(false);

const features = [
  {
    title: "Create tasks from tickets",
    text: "New CodeClarity tickets become ClickUp tasks automatically.",
  },
  {
    title: "Keep status in sync",
    text: "Status changes travel between CodeClarity and ClickUp.",
  },
  {
    title: "Choose where tasks go",
    text: "Pick the workspace, space, folder and list for new tasks.",
  },
  {
    title: "Link back",
    text: "Each ticket links to its ClickUp task.",
  },
];

function onConfigured(): void {
  showConfigModal.value = false;
  void router.push({
    name: "orgs",
    params: { orgId, page: "integrations", action: "manage" },
  });
}

if (!orgId) router.back();
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2
      class="flex items-center gap-3 text-2xl font-bold text-foreground-strong"
    >
      <Icon icon="simple-icons:clickup" aria-hidden="true" class="size-8" />
      Connect ClickUp
    </h2>

    <div class="grid grid-cols-2 items-start gap-6">
      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h3 class="text-lg font-semibold leading-none text-foreground-strong">
            Sync tickets to ClickUp
          </h3>
          <CardDescription>
            Connect with OAuth (recommended) or a personal API key from your
            ClickUp settings.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-6">
          <Button class="self-start" @click="showConfigModal = true">
            Configure ClickUp
          </Button>
          <p class="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck aria-hidden="true" class="mt-0.5 size-4 shrink-0" />
            Your ClickUp credentials are encrypted and stored securely.
          </p>
        </CardContent>
      </Card>

      <Card class="rounded-card shadow-card">
        <CardHeader>
          <h3 class="text-lg font-semibold leading-none text-foreground-strong">
            What it does
          </h3>
        </CardHeader>
        <CardContent>
          <dl class="flex flex-col gap-4 text-sm">
            <div v-for="feature in features" :key="feature.title">
              <dt class="font-medium text-foreground-strong">
                {{ feature.title }}
              </dt>
              <dd class="text-muted-foreground">{{ feature.text }}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>

    <ClickUpConfigModal
      v-if="showConfigModal"
      @close="showConfigModal = false"
      @configured="onConfigured"
    />
  </div>
</template>
