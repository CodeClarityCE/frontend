import type { Page } from "@playwright/test";

import user from "../fixtures/user.json" with { type: "json" };

// Seeds the persisted auth store before the app boots, as a returning visitor would have it.
// It holds no token: those would be HttpOnly cookies, which the mocked API never reads.
export async function seedAuthStore(
  page: Page,
  state: { authenticated?: boolean } = {},
): Promise<void> {
  const expiry = new Date(Date.now() + 86_400_000).toISOString();
  await page.addInitScript(
    ({ e, s, id }) => {
      localStorage.setItem(
        "authStore",
        JSON.stringify({
          initialized: true,
          authenticated: s.authenticated ?? false,
          userId: s.authenticated ? id : undefined,
          tokenExpiry: e,
          refreshTokenExpiry: e,
        }),
      );
    },
    { e: expiry, s: state, id: user.id },
  );
}
