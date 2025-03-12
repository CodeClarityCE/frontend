<template>
    <div class="oauth-status-wrapper flex flex-col items-center justify-center h-screen">
        <div class="oauth-status-inner-wrapper -translate-y-3/4 flex flex-col items-center">
            <div class="header">
                <div v-if="props.provider == SocialProvider.GITLAB">
                    <Icon class="icon" icon="devicon:gitlab" />
                </div>
                <div v-if="props.provider == SocialProvider.GITHUB">
                    <span style="color: black">
                        <Icon class="icon" icon="simple-icons:github" />
                    </span>
                </div>
                <div class="provider">Authentication</div>
            </div>

            <!-- <div v-if="loading" class="spinner"></div> -->
            <Icon icon="tabler:loader-2" v-if="loading" class="h-10 w-10 animate-spin" />

            <template v-else-if="error">
                <div v-if="errorCode == undefined || errorNonRecoverable">
                    <div v-if="errorNonRecoverable" class="flex flex-col gap-y-7">
                        <div style="font-size: 1.5em">
                            <div>Whoops</div>
                            <div style="font-size: 0.8em" v-if="errorCode">
                                Error code:
                                <span style="font-family: 'Courier New', Courier, monospace">{{
                                    errorCode
                                }}</span>
                            </div>
                        </div>
                        <div style="font-size: 1.2em" v-if="errorCode">
                            We encountered some non-recoverable issue during the authentication.
                            Please click on the button below and try again. If this error persists,
                            then please contact the webmaster and provide them with the error code
                            listed above.
                        </div>
                        <div style="font-size: 1.2em" v-else>
                            We encountered some non-recoverable issue during the authentication.
                            Please click on the button below and try again. If this error persists,
                            then please contact the webmaster and provide them with the events
                            leading up to this problem.
                        </div>
                        <div>
                            <Button @click="nonRecoverableErrorRedirect()">
                                Okay
                            </Button>
                        </div>
                    </div>
                </div>

                <div v-else>
                    <div style="display: flex; flex-direction: column; row-gap: 1rem">
                        <div style="font-size: 1.5em">
                            <div>Error</div>
                        </div>

                        <div v-if="errorCode" style="font-size: 1.2em">
                            <div v-if="errorCode == APIErrors.AlreadyExists">
                                A user with that email already exists.
                            </div>
                            <div v-else>An error occured during the processing of the request.</div>
                        </div>

                        <div v-else style="font-size: 1.2em">
                            An error occured during the processing of the request.
                        </div>

                        <div>
                            <Button @click="nonRecoverableErrorRedirect">
                                Back to login
                            </Button>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/common/oauth.scss';
</style>

<script lang="ts" setup>
import { ref } from 'vue';
import { AuthRepository } from '@/codeclarity_components/authentication/auth.repository';
import type { AuthenticatedUser } from '@/codeclarity_components/authentication/authenticated_user.entity';
import type { Token } from '@/codeclarity_components/authentication/token.entity';
import router from '@/router';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { onMounted } from 'vue';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { APIErrors } from '@/utils/api/ApiErrors';
import { Icon } from '@iconify/vue';
import { SocialProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import Button from '@/shadcn/ui/button/Button.vue';

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
const errorCode = ref();

// Methods
async function finalizeAutentication() {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    // Oauth2 callback state
    const state = searchParams.get('state');

    // Oauth2 callback code
    const code = searchParams.get('code');

    if (!state || !code) {
        router.push('/login');
        return;
    }

    if (props.provider != SocialProvider.GITLAB && props.provider != SocialProvider.GITHUB) {
        router.push('/login');
        return;
    }

    // Check the state returned in the url
    // CSRF protection: the state must be the same as the one that was stored when the user
    // clicked on the gitlab/github connect button
    // If the state is different then the user clicked on a link send by an adversary
    if (authStore.getSocialAuthState == undefined || authStore.getSocialAuthState != state) {
        router.push('/login');
        return;
    } else {
        authStore.socialAuthState = undefined;
    }

    // Use the code returned from gitlab/github to finish the authenticated processs
    try {
        let token: Token;

        if (props.provider == SocialProvider.GITLAB) {
            token = await authRepository.gitlabAuthFinalize({
                data: { code: code },
                handleBusinessErrors: true
            });
        } else if (props.provider == SocialProvider.GITHUB) {
            token = await authRepository.githubAuthFinalize({
                data: { code: code },
                handleBusinessErrors: true
            });
        } else {
            router.push('/login');
            return;
        }

        const user: AuthenticatedUser = await authRepository.getAuthenticatedUser({
            bearerToken: token.token,
            handleBusinessErrors: true,
            validate: false
        });

        authStore.setToken(token.token);
        authStore.setTokenExpiry(token.token_expiry);
        authStore.setRefreshToken(token.refresh_token);
        authStore.setRefreshTokenExpiry(token.refresh_token_expiry);

        if (user.setup_done == false) {
            if (props.provider == SocialProvider.GITLAB) {
                router.push({ name: 'signup', query: { provider: SocialProvider.GITLAB } });
            } else if (props.provider == SocialProvider.GITHUB) {
                router.push({ name: 'signup', query: { provider: SocialProvider.GITHUB } });
            } else {
                router.push('/login');
            }
            return;
        } else {
            authStore.setAuthenticated(true);
            userStore.setUser(user);
            router.push('/');
            return;
        }
    } catch (_error) {
        error.value = true;
        if (_error instanceof BusinessLogicError) {
            if (_error.error_code == 'AccountNotActivated') {
                router.push('/trial');
            }
            errorCode.value = _error.error_code;
            if (
                _error.error_code == APIErrors.FailedToAuthenticateSocialAccount ||
                _error.error_code == APIErrors.IntegrationTokenRetrievalFailed ||
                _error.error_code == APIErrors.IntegrationInvalidToken ||
                _error.error_code == APIErrors.IntegrationIntegrationTokenMissingPermissions ||
                _error.error_code == APIErrors.IntegrationTokenExpired ||
                _error.error_code == APIErrors.InternalError
            ) {
                errorNonRecoverable.value = true;
            }
        }
    } finally {
        loading.value = false;
    }
}

function nonRecoverableErrorRedirect() {
    authStore.$reset();
    userStore.$reset();
    router.push('/login');
}

// Lifecycle
onMounted(async () => {
    await finalizeAutentication();
});
</script>
