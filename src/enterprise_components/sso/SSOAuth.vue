<script setup lang="ts">
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { Icon } from "@iconify/vue";
import { createOAuthState } from "./utils";

// Stores
const authStore = useAuthStore();

async function initiateGithubAuthentication(): Promise<void> {
  const state = createOAuthState();
  authStore.setSocialAuthState(state);
  const apiUrl =
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "api/v1";
  const url = new URL(
    `https://${window.location.hostname}/${apiUrl}/auth/github/authenticate`,
  );
  url.searchParams.append("state", state);
  window.location.href = url.toString();
}

async function initiateGitlabAuthentication(): Promise<void> {
  const state = createOAuthState();
  authStore.setSocialAuthState(state);
  const apiUrl =
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "api/v1";
  const url = new URL(
    `https://${window.location.hostname}/${apiUrl}/auth/gitlab/authenticate`,
  );
  url.searchParams.append("state", state);
  window.location.href = url.toString();
}
</script>

<template>
  <div class="sso-auth-container">
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <span class="w-full border-t"></span>
      </div>
      <div class="relative flex justify-center text-xs uppercase">
        <span class="bg-background px-2 text-muted-foreground">
          Or continue with
        </span>
      </div>
    </div>
    <Button
      variant="outline"
      type="button"
      @click="initiateGithubAuthentication"
    >
      <Icon icon="bi:github" class="mr-2 h-4 w-4" />
      GitHub
    </Button>
    <Button
      variant="outline"
      type="button"
      @click="initiateGitlabAuthentication"
    >
      <Icon icon="bi:gitlab" class="mr-2 h-4 w-4" />
      GitLab
    </Button>
  </div>
</template>
