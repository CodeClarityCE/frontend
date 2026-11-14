<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";

import { TicketsRepository } from "../tickets.repository";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ticketsRepository = new TicketsRepository();

const status = ref<"loading" | "success" | "error">("loading");
const errorMessage = ref("");

onMounted(async () => {
  const code = route.query.code as string;
  const orgId = sessionStorage.getItem("clickup_oauth_org_id");

  if (!code) {
    status.value = "error";
    errorMessage.value = "No authorization code received from ClickUp";
    return;
  }

  if (!orgId) {
    status.value = "error";
    errorMessage.value = "Session expired. Please try connecting again.";
    return;
  }

  if (!auth.getToken) {
    status.value = "error";
    errorMessage.value = "Not authenticated. Please log in and try again.";
    return;
  }

  try {
    // Exchange the code for an access token
    const response = await ticketsRepository.exchangeClickUpOAuthCode({
      orgId,
      data: {
        code,
        redirect_uri: `${window.location.origin}/tickets/integrations/clickup/callback`,
      },
      bearerToken: auth.getToken,
      handleBusinessErrors: true,
      handleHTTPErrors: true,
      handleOtherErrors: true,
    });

    // Store the access token for the integration modal to use
    sessionStorage.setItem(
      "clickup_oauth_access_token",
      response.data.access_token,
    );
    sessionStorage.removeItem("clickup_oauth_org_id");

    status.value = "success";

    // Redirect to tickets page with query param to open integration modal
    setTimeout(() => {
      void router.push({
        path: "/tickets",
        query: { clickup_oauth: "success" },
      });
    }, 1500);
  } catch {
    status.value = "error";
    errorMessage.value = "Failed to connect to ClickUp. Please try again.";
    sessionStorage.removeItem("clickup_oauth_org_id");
  }
});
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center p-8">
    <section
      class="flex w-full max-w-md flex-col items-center gap-4 rounded-card border bg-card p-8 text-center shadow-card"
    >
      <Icon
        icon="simple-icons:clickup"
        aria-hidden="true"
        class="size-10 text-foreground-strong"
      />

      <template v-if="status === 'loading'">
        <h1 class="text-xl font-bold text-foreground-strong">
          Connecting to ClickUp
        </h1>
        <p role="status" class="text-sm text-muted-foreground">
          Please wait while we complete the authorisation.
        </p>
      </template>

      <template v-else-if="status === 'success'">
        <h1 class="text-xl font-bold text-foreground-strong">Connected</h1>
        <p role="status" class="text-sm text-muted-foreground">
          Taking you back to finish the setup.
        </p>
      </template>

      <template v-else>
        <h1 class="text-xl font-bold text-foreground-strong">
          Connection failed
        </h1>
        <p role="alert" class="text-sm text-muted-foreground">
          {{ errorMessage }}
        </p>
        <Button :as="RouterLink" to="/tickets">Go to Tickets</Button>
      </template>
    </section>
  </div>
</template>
