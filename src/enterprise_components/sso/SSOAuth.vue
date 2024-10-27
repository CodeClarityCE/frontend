<template>
    <div class="relative">
        <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t"></span>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
        </div>
    </div>
    <Button variant="outline" type="button" @click="intiateGithubAuthentication">
        <Icon icon="bi:github" class="mr-2 h-4 w-4" />
        GitHub
    </Button>
    <Button variant="outline" type="button" @click="intiateGitlabAuthentication">
        <Icon icon="bi:gitlab" class="mr-2 h-4 w-4" />
        GitLab
    </Button>
</template>

<script setup lang="ts">
import { Button } from '@/shadcn/ui/button';
import { Icon } from '@iconify/vue';
import { createOAuthState } from './utils';
import { useAuthStore } from '@/stores/auth';

// Stores
const authStore = useAuthStore();

async function intiateGithubAuthentication() {
    const state = createOAuthState();
    authStore.setSocialAuthState(state);
    const url = new URL(
        `https://${window.location.hostname}/${
            import.meta.env.VITE_API_URL
        }/auth/github/authenticate`
    );
    url.searchParams.append('state', state);
    window.location.href = url.toString();
}

async function intiateGitlabAuthentication() {
    const state = createOAuthState();
    authStore.setSocialAuthState(state);
    const url = new URL(
        `https://${window.location.hostname}/${
            import.meta.env.VITE_API_URL
        }/auth/gitlab/authenticate`
    );
    url.searchParams.append('state', state);
    window.location.href = url.toString();
}
</script>
