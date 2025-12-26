import AnalysesView from '@/codeclarity_components/analyses/AnalysesView.vue';
import { AuthRepository } from '@/codeclarity_components/authentication/auth.repository';
import type { AuthenticatedUser } from '@/codeclarity_components/authentication/authenticated_user.entity';
import EmailActionView from '@/codeclarity_components/authentication/email/EmailActionView.vue';
import OAuthCallbackView from '@/codeclarity_components/authentication/oauth/OAuthCallbackView.vue';
import PasswordResetRequestView from '@/codeclarity_components/authentication/password_reset/PasswordResetRequestView.vue';
import LoginView from '@/codeclarity_components/authentication/signin/LoginView.vue';
import SignupView from '@/codeclarity_components/authentication/signup/SignupView.vue';
import DashboardView from '@/codeclarity_components/dashboard/DashboardView.vue';
import { SocialProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import type { Organization } from '@/codeclarity_components/organizations/organization.entity';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import OrganizationView from '@/codeclarity_components/organizations/OrganizationView.vue';
import ProjectsView from '@/codeclarity_components/projects/ProjectsView.vue';
import ResultsView from '@/codeclarity_components/results/ResultsView.vue';
import SettingsView from '@/codeclarity_components/settings/SettingsView.vue';
import ClickUpOAuthCallback from '@/codeclarity_components/tickets/integrations/ClickUpOAuthCallback.vue';
import TicketsView from '@/codeclarity_components/tickets/TicketsView.vue';
import HelpView from '@/codeclarity_components/views/HelpView.vue';
import NotFoundView from '@/codeclarity_components/views/NotFoundView.vue';
import TermsView from '@/codeclarity_components/views/TermsView.vue';
import { loadAuthStoreFromLocalStorage, useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import type { Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

// Helper functions to reduce complexity in beforeEach guard
async function refreshTokenIfNeeded(
    authStore: ReturnType<typeof useAuthStore>,
    authRepository: AuthRepository
): Promise<boolean> {
    const current = new Date();
    const tokenExpiry = authStore.getTokenExpiry;
    if (tokenExpiry && tokenExpiry <= current) {
        // Clear expired tokens using $patch to avoid exactOptionalPropertyTypes issues
        authStore.$patch((state) => {
            delete state.token;
            delete state.tokenExpiry;
        });

        // Refresh the token via the refresh token (if its not expired itself)
        const refreshTokenExpiry = authStore.getRefreshTokenExpiry;
        const refreshToken = authStore.getRefreshToken;
        if (refreshTokenExpiry && refreshToken && refreshTokenExpiry > current) {
            try {
                const newToken = await authRepository.refresh({
                    data: { refresh_token: refreshToken },
                    handleBusinessErrors: true
                });
                authStore.token = newToken.token;
                authStore.tokenExpiry = newToken.token_expiry;
                return true;
            } catch (error) {
                console.error(error);
                return false;
            }
        }
        return false;
    }
    return true;
}

async function fetchAuthenticatedUser(
    authStore: ReturnType<typeof useAuthStore>,
    userStore: ReturnType<typeof useUserStore>,
    authRepository: AuthRepository
): Promise<boolean> {
    const token = authStore.getToken;
    if (!token) {
        return false;
    }

    try {
        const user: AuthenticatedUser = await authRepository.getAuthenticatedUser({
            bearerToken: token,
            validate: false,
            handleBusinessErrors: true
        });

        if (user.activated === false) {
            return false;
        }

        userStore.setUser(user);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

async function fetchDefaultOrg(
    authStore: ReturnType<typeof useAuthStore>,
    userStore: ReturnType<typeof useUserStore>,
    orgRepository: OrgRepository
): Promise<boolean> {
    const user = userStore.getUser;
    const token = authStore.getToken;
    if (!user?.default_org || !token) {
        return true;
    }

    try {
        const org: Organization = await orgRepository.get({
            bearerToken: token,
            orgId: user.default_org.id,
            handleBusinessErrors: true
        });
        userStore.setDefaultOrg(org);
        return true;
    } catch (error) {
        if (error instanceof BusinessLogicError) {
            const errorCode = error.error_code;
            // It may happen that the org that the user had set as the default org has been deleted
            // or the user might have been removed from an org he had set as the default org
            if (errorCode === APIErrors.EntityNotFound || errorCode === APIErrors.NotAuthorized) {
                return await fetchFallbackOrg(authStore, userStore, orgRepository);
            }
        }
        return false;
    }
}

async function fetchFallbackOrg(
    authStore: ReturnType<typeof useAuthStore>,
    userStore: ReturnType<typeof useUserStore>,
    orgRepository: OrgRepository
): Promise<boolean> {
    const user = userStore.getUser;
    const token = authStore.getToken;
    if (!user?.default_org || !token) {
        return false;
    }

    try {
        const org: Organization = await orgRepository.get({
            bearerToken: token,
            orgId: user.default_org.id,
            handleBusinessErrors: true
        });
        userStore.setDefaultOrg(org);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: DashboardView as Component,
            props: true
        },
        {
            path: '/results/:page?',
            name: 'results',
            component: ResultsView as Component,
            props: true
        },
        {
            path: '/projects/:page?',
            name: 'projects',
            component: ProjectsView as Component,
            props: true
        },
        {
            path: '/tickets/integrations/clickup/callback',
            name: 'clickupOAuthCallback',
            component: ClickUpOAuthCallback as Component
        },
        {
            path: '/tickets/:page?',
            name: 'tickets',
            component: TicketsView as Component,
            props: true
        },
        {
            path: '/analyses/:page?',
            name: 'analyses',
            component: AnalysesView as Component,
            props: true
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView as Component
        },
        {
            path: '/help',
            name: 'help',
            component: HelpView as Component
        },
        {
            path: '/orgs/:action?/:page?/:orgId?/',
            name: 'orgs',
            component: OrganizationView as Component,
            props: true
        },
        {
            path: '/signup/:provider?',
            name: 'signup',
            component: SignupView as Component,
            props: true
        },
        {
            path: '/password_reset_request',
            name: 'recoveryRequest',
            component: PasswordResetRequestView as Component
        },
        {
            path: '/email_action/:page?',
            name: 'emailAction',
            component: EmailActionView as Component,
            props: true
        },
        {
            path: '/settings/:page?',
            name: 'settings',
            component: SettingsView as Component,
            props: true
        },
        {
            path: '/auth/gitlab/callback',
            name: 'gitlabAuthCallback',
            component: OAuthCallbackView as Component,
            props: {
                provider: SocialProvider.GITLAB
            }
        },
        {
            path: '/auth/github/callback',
            name: 'githubAuthCallback',
            component: OAuthCallbackView as Component,
            props: {
                provider: SocialProvider.GITHUB
            }
        },
        {
            path: '/404',
            name: 'notfound',
            component: NotFoundView as Component
        },
        {
            path: '/terms',
            name: 'terms',
            component: TermsView as Component,
            props: {
                page: 'terms'
            }
        },
        {
            path: '/privacy',
            name: 'privacy',
            component: TermsView as Component,
            props: {
                page: 'privacy'
            }
        },
        {
            path: '/:catchAll(.*)',
            redirect: '/404'
        }
    ]
});

router.beforeEach(async (to) => {
    // redirect to login page if not logged in and trying to access a restricted page
    const publicPages = [
        '/login',
        '/signup',
        '/password_reset_request',
        '/404',
        '/terms',
        '/privacy',
        '/auth/gitlab/callback',
        '/auth/github/callback',
        '/email_action/reset_password',
        '/email_action/confirm_registration',
        '/tickets/integrations/clickup/callback'
    ];
    const authRequired = !publicPages.includes(to.path);

    const authStore = useAuthStore();
    const userStore = useUserStore();

    const authRepository = new AuthRepository();
    const orgRepository = new OrgRepository();

    if (authStore.getInitialized === false) {
        loadAuthStoreFromLocalStorage();
    }

    // Check if token is present and needs to be refreshed
    if (authRequired && authStore.getToken) {
        const refreshSuccess = await refreshTokenIfNeeded(authStore, authRepository);
        if (!refreshSuccess) {
            userStore.$reset();
            authStore.$reset();
            return { path: '/login' };
        }
    }

    // Instead of getting this from local store we will re-fetch it
    // This happens only if the user refreshes the page (F5, or reload button) and thus the SPA state is lost
    // The overhead is very small
    if (authRequired && authStore.getToken !== undefined && userStore.getUser === undefined) {
        const fetchSuccess = await fetchAuthenticatedUser(authStore, userStore, authRepository);
        if (!fetchSuccess) {
            userStore.$reset();
            authStore.$reset();
            return { path: '/login' };
        }
    }

    // Fetch default org info
    if (authRequired && authStore.getToken !== undefined && userStore.getUser?.default_org) {
        const orgSuccess = await fetchDefaultOrg(authStore, userStore, orgRepository);
        if (!orgSuccess) {
            userStore.$reset();
            authStore.$reset();
            return { path: '/login' };
        }
    }

    const user = userStore.getUser;

    // In case a user has not yet completed is social account setup, send him back
    // We cannot send him to /signup/gitlab or /signup/github, because it requires
    // the code returned from the oauth flow
    if (authRequired && user?.social && user.setup_done === false && to.path !== '/signup/') {
        userStore.$reset();
        authStore.$reset();
        return { path: '/login' };
    }

    if (authRequired && user?.activated === false) {
        userStore.$reset();
        authStore.$reset();
        return { path: '/login' };
    }

    if (authRequired && authStore.getAuthenticated === false) {
        userStore.$reset();
        authStore.$reset();
        return { path: '/login' };
    }

    if (to.path === '/login' && authStore.getAuthenticated === true) {
        return { path: '/' };
    }

    return true;
});

export default router;
