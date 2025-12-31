<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

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
  } catch (error) {
    console.error("OAuth exchange failed:", error);
    status.value = "error";
    errorMessage.value = "Failed to connect to ClickUp. Please try again.";
    sessionStorage.removeItem("clickup_oauth_org_id");
  }
});

function goToTickets(): void {
  void router.push("/tickets");
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full p-8">
      <!-- Loading State -->
      <div v-if="status === 'loading'" class="text-center">
        <div
          class="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4"
        >
          <Icon
            icon="solar:spinner-outline"
            class="w-8 h-8 text-purple-600 animate-spin"
          />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Connecting to ClickUp...
        </h2>
        <p class="text-gray-500">
          Please wait while we complete the authorization.
        </p>
      </div>

      <!-- Success State -->
      <div v-else-if="status === 'success'" class="text-center">
        <div
          class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
        >
          <Icon icon="solar:check-circle-bold" class="w-8 h-8 text-green-600" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Connected Successfully!
        </h2>
        <p class="text-gray-500">
          Redirecting you back to complete the setup...
        </p>
      </div>

      <!-- Error State -->
      <div v-else class="text-center">
        <div
          class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"
        >
          <Icon icon="solar:close-circle-bold" class="w-8 h-8 text-red-600" />
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Connection Failed
        </h2>
        <p class="text-gray-500 mb-4">{{ errorMessage }}</p>
        <button
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          @click="goToTickets"
        >
          Go to Tickets
        </button>
      </div>
    </div>
  </div>
</template>
