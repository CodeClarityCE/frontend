import type { Page } from "@playwright/test";

// Seeds the persisted auth store before the app boots, as a returning visitor would have it.
export async function seedAuthStore(
  page: Page,
  state: { authenticated?: boolean; socialAuthState?: string } = {},
): Promise<void> {
  const expiry = new Date(Date.now() + 86_400_000).toISOString();
  await page.addInitScript(
    ({ e, s }) => {
      localStorage.setItem(
        "authStore",
        JSON.stringify({
          initialized: true,
          authenticated: s.authenticated ?? false,
          token: "t",
          tokenExpiry: e,
          refreshToken: "t",
          refreshTokenExpiry: e,
          socialAuthState: s.socialAuthState,
        }),
      );
    },
    { e: expiry, s: state },
  );
}
