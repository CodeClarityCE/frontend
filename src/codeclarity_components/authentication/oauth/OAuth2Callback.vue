<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import { CircleAlert, LoaderCircle } from "@lucide/vue";
import { onMounted, ref } from "vue";

import { AuthRepository } from "@/codeclarity_components/authentication/auth.repository";
import type { AuthenticatedUser } from "@/codeclarity_components/authentication/authenticated_user.entity";
import type { Token } from "@/codeclarity_components/authentication/token.entity";
import { SocialProvider } from "@/codeclarity_components/organizations/integrations/Integrations";
import router from "@/router";
import { Alert, AlertDescription } from "@/shadcn/ui/alert";
import { Button } from "@/shadcn/ui/button";
import { useAuthStore } from "@/stores/auth";
import { useUserStore } from "@/stores/user";
import { APIErrors } from "@/utils/api/ApiErrors";
import { BusinessLogicError } from "@/utils/api/BaseRepository";

import AuthLayout from "../layout/AuthLayout.vue";

// Props
const props = defineProps<{
  provider: SocialProvider;
}>();

// Repositories
const authRepository = new AuthRepository();

// Stores
const authStore = useAuthStore();
const userStore = useUserStore();

// State
const loading = ref(true);
const errorNonRecoverable = ref(false);
const error = ref(false);
const errorCode = ref<string>();

const providerName =
  props.provider === SocialProvider.GITLAB ? "GitLab" : "GitHub";

// Methods
async function finalizeAutentication(): Promise<void> {
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;

  // Oauth2 callback state
  const state = searchParams.get("state");

  // Oauth2 callback code
  const code = searchParams.get("code");

  if (!state || !code) {
    void router.push("/login");
    return;
  }

  if (
    props.provider !== SocialProvider.GITLAB &&
    props.provider !== SocialProvider.GITHUB
  ) {
    void router.push("/login");
    return;
  }

  // Check the state returned in the url
  // CSRF protection: the state must be the same as the one that was stored when the user
  // clicked on the gitlab/github connect button
  // If the state is different then the user clicked on a link send by an adversary
  if (
    authStore.getSocialAuthState === undefined ||
    authStore.getSocialAuthState !== state
  ) {
    void router.push("/login");
    return;
  } else {
    authStore.socialAuthState = undefined;
  }

  // Use the code returned from gitlab/github to finish the authenticated processs
  try {
    let token: Token;

    if (props.provider === SocialProvider.GITLAB) {
      token = await authRepository.gitlabAuthFinalize({
        data: { code: code },
        handleBusinessErrors: true,
      });
    } else if (props.provider === SocialProvider.GITHUB) {
      token = await authRepository.githubAuthFinalize({
        data: { code: code },
        handleBusinessErrors: true,
      });
    } else {
      void router.push("/login");
      return;
    }

    const user: AuthenticatedUser = await authRepository.getAuthenticatedUser({
      bearerToken: token.token,
      handleBusinessErrors: true,
      validate: false,
    });

    authStore.setToken(token.token);
    authStore.setTokenExpiry(token.token_expiry);
    authStore.setRefreshToken(token.refresh_token);
    authStore.setRefreshTokenExpiry(token.refresh_token_expiry);

    if (user.setup_done === false) {
      if (props.provider === SocialProvider.GITLAB) {
        void router.push({
          name: "signup",
          query: { provider: SocialProvider.GITLAB },
        });
      } else if (props.provider === SocialProvider.GITHUB) {
        void router.push({
          name: "signup",
          query: { provider: SocialProvider.GITHUB },
        });
      } else {
        void router.push("/login");
      }
      return;
    } else {
      authStore.setAuthenticated(true);
      userStore.setUser(user);
      void router.push("/");
      return;
    }
  } catch (_error) {
    error.value = true;
    if (_error instanceof BusinessLogicError) {
      if (_error.error_code === "AccountNotActivated") {
        void router.push("/trial");
      }
      errorCode.value = _error.error_code;
      if (
        _error.error_code === APIErrors.FailedToAuthenticateSocialAccount ||
        _error.error_code === APIErrors.IntegrationTokenRetrievalFailed ||
        _error.error_code === APIErrors.IntegrationInvalidToken ||
        _error.error_code ===
          APIErrors.IntegrationIntegrationTokenMissingPermissions ||
        _error.error_code === APIErrors.IntegrationTokenExpired ||
        _error.error_code === APIErrors.InternalError
      ) {
        errorNonRecoverable.value = true;
      }
    }
  } finally {
    loading.value = false;
  }
}

function nonRecoverableErrorRedirect(): void {
  authStore.$reset();
  userStore.$reset();
  void router.push("/login");
}

// Lifecycle
onMounted(async () => {
  await finalizeAutentication();
});
</script>
<template>
  <AuthLayout>
    <template #icon>
      <Icon
        v-if="props.provider === SocialProvider.GITLAB"
        icon="devicon:gitlab"
        role="img"
        :aria-hidden="false"
        aria-label="GitLab"
        class="mb-2 size-12"
      />
      <Icon
        v-else
        icon="simple-icons:github"
        role="img"
        :aria-hidden="false"
        aria-label="GitHub"
        class="mb-2 size-12 text-foreground-strong"
      />
    </template>
    <template #title>
      <template v-if="error">{{ providerName }} sign in failed</template>
      <template v-else>Signing in with {{ providerName }}</template>
    </template>

    <div
      v-if="loading"
      role="status"
      class="flex flex-col items-center gap-2 py-6 text-muted-foreground"
    >
      <LoaderCircle
        aria-hidden="true"
        class="size-6 animate-spin motion-reduce:animate-none"
      />
      Signing you in with {{ providerName }}
    </div>

    <div v-else-if="error" class="flex flex-col gap-6">
      <Alert variant="destructive">
        <CircleAlert aria-hidden="true" />
        <AlertDescription class="flex flex-col gap-2">
          <p v-if="errorCode === APIErrors.AlreadyExists">
            A user with that email already exists.
          </p>
          <p v-else-if="errorNonRecoverable || !errorCode">
            We encountered a non-recoverable issue during the authentication.
            Please try again. If this error persists, contact the webmaster with
            {{
              errorCode
                ? "the error code below"
                : "the events leading up to this problem"
            }}.
          </p>
          <p v-else>An error occured during the processing of the request.</p>
          <p v-if="errorCode">
            Error code: <code class="font-mono">{{ errorCode }}</code>
          </p>
        </AlertDescription>
      </Alert>
      <Button class="w-full" @click="nonRecoverableErrorRedirect()">
        Back to sign in
      </Button>
    </div>
  </AuthLayout>
</template>
