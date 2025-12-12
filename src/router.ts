import AnalysesView from '@/codeclarity_components/analyses/AnalysesView.vue';
import { AuthRepository } from '@/codeclarity_components/authentication/auth.repository';
import { type AuthenticatedUser } from '@/codeclarity_components/authentication/authenticated_user.entity';
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
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: DashboardView,
            props: true
        },
        {
            path: '/results/:page?',
            name: 'results',
            component: ResultsView,
            props: true
        },
        {
            path: '/projects/:page?',
            name: 'projects',
            component: ProjectsView,
            props: true
        },
        {
            path: '/tickets/integrations/clickup/callback',
            name: 'clickupOAuthCallback',
            component: ClickUpOAuthCallback
        },
        {
            path: '/tickets/:page?',
            name: 'tickets',
            component: TicketsView,
            props: true
        },
        {
            path: '/analyses/:page?',
            name: 'analyses',
            component: AnalysesView,
            props: true
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/help',
            name: 'help',
            component: HelpView
        },
        {
            path: '/orgs/:action?/:page?/:orgId?/',
            name: 'orgs',
            component: OrganizationView,
            props: true
        },
        {
            path: '/signup/:provider?',
            name: 'signup',
            component: SignupView,
            props: true
        },
        {
            path: '/password_reset_request',
            name: 'recoveryRequest',
            component: PasswordResetRequestView
        },
        {
            path: '/email_action/:page?',
            name: 'emailAction',
            component: EmailActionView,
            props: true
        },
        {
            path: '/settings/:page?',
            name: 'settings',
            component: SettingsView,
            props: true
        },
        {
            path: '/auth/gitlab/callback',
            name: 'gitlabAuthCallback',
            component: OAuthCallbackView,
            props: {
                provider: SocialProvider.GITLAB
            }
        },
        {
            path: '/auth/github/callback',
            name: 'githubAuthCallback',
            component: OAuthCallbackView,
            props: {
                provider: SocialProvider.GITHUB
            }
        },
        {
            path: '/404',
            name: 'notfound',
            component: NotFoundView
        },
        {
            path: '/terms',
            name: 'terms',
            component: TermsView,
            props: {
                page: 'terms'
            }
        },
        {
            path: '/privacy',
            name: 'privacy',
            component: TermsView,
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
        const current = new Date();
        if (authStore.getTokenExpiry! <= current) {
            authStore.token = undefined;
            authStore.tokenExpiry = undefined;
            // Refresh the token via the refresh token (if its not expired itself)
            if (
                authStore.getRefreshTokenExpiry &&
                authStore.getRefreshToken &&
                authStore.getRefreshTokenExpiry > current
            ) {
                try {
                    const newToken = await authRepository.refresh({
                        data: { refresh_token: authStore.getRefreshToken },
                        handleBusinessErrors: true
                    });
                    authStore.token = newToken.token;
                    authStore.tokenExpiry = newToken.token_expiry;
                } catch (error) {
                    console.error(error);
                    userStore.$reset();
                    authStore.$reset();
                    return { path: '/login' };
                }
            } else {
                userStore.$reset();
                authStore.$reset();
                return { path: '/login' };
            }
        }
    }

    // Instead of getting this from local store we will re-fetch it
    // This happens only if the user refreshes the page (F5, or reload button) and thus the SPA state is lost
    // The overhead is very small
    if (authRequired && authStore.getToken !== undefined && userStore.getUser === undefined) {
        try {
            const user: AuthenticatedUser = await authRepository.getAuthenticatedUser({
                bearerToken: authStore.getToken,
                validate: false,
                handleBusinessErrors: true
            });

            if (user.activated === false) {
                userStore.$reset();
                authStore.$reset();
                return { path: '/login' };
            }

            userStore.setUser(user);
        } catch (error) {
            console.error(error);
            userStore.$reset();
            authStore.$reset();
        }
    }

    // Fetch default org info
    if (
        authRequired &&
        authStore.getToken !== undefined &&
        userStore.getUser !== undefined &&
        userStore.getUser.default_org
    ) {
        try {
            const org: Organization = await orgRepository.get({
                bearerToken: authStore.getToken,
                orgId: userStore.getUser.default_org.id,
                handleBusinessErrors: true
            });
            userStore.setDefaultOrg(org);
        } catch (error) {
            if (error instanceof BusinessLogicError) {
                // It may happen that the org that the user had set as the default org has been deleted
                // In that case we fetch the personal org instead
                //
                // Similarly a user might have been removed from an org he had set as the default org
                // In that case we fetch the personal org instead as well
                if (
                    error.error_code === APIErrors.EntityNotFound ||
                    error.error_code === APIErrors.NotAuthorized
                ) {
                    try {
                        const org: Organization = await orgRepository.get({
                            bearerToken: authStore.getToken,
                            // orgId: userStore.getUser.personal_org,
                            orgId: userStore.getUser.default_org.id,
                            handleBusinessErrors: true
                        });
                        userStore.setDefaultOrg(org);
                    } catch (error) {
                        console.error(error);

                        // We cannot recover at this point
                        userStore.$reset();
                        authStore.$reset();
                        return { path: '/login' };
                    }
                }
            }
        }
    }

    const user = userStore.getUser;

    // In case a user has not yet completed is social account setup, send him back
    // We cannot send him to /signup/gitlab or /signup/github, because it requires
    // the code returned from the oauth flow
    if (authRequired && user && user.social && user.setup_done === false && to.path !== '/signup/') {
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
    } else if (to.path === '/login' && authStore.getAuthenticated === true) {
        return { path: '/' };
    }
});

export default router;
