import type { LocationQuery, RouteLocationRaw } from "vue-router";

// Reasons another page sent the visitor to the login page.
const loginNotices = {
  oauth_failed:
    "Sign in with GitHub or GitLab did not complete. Please try again.",
  reset_link_invalid:
    "This password reset link is incomplete. Open the full link from your email again.",
  password_reset: "Your password was changed. Sign in with your new password.",
  not_activated:
    "Your account is not activated yet. Confirm your registration with the link we emailed you, then sign in.",
} as const;

export type LoginNotice = keyof typeof loginNotices;

export function loginNoticeMessage(value: unknown): string | undefined {
  return typeof value === "string" && value in loginNotices
    ? loginNotices[value as LoginNotice]
    : undefined;
}

// Notices that report good news rather than a problem.
const successNotices: readonly string[] = ["password_reset"];

export function loginNoticeIsSuccess(value: unknown): boolean {
  return typeof value === "string" && successNotices.includes(value);
}

// The login page, with an optional message and the page to return to.
export function loginRoute(
  options: { notice?: LoginNotice; redirect?: string } = {},
): RouteLocationRaw {
  const query: Record<string, string> = {};
  if (options.notice) query.notice = options.notice;
  if (options.redirect && options.redirect !== "/") {
    query.redirect = options.redirect;
  }
  return { name: "login", query };
}

// Where to go after login: only paths inside this app, never another site.
export function redirectAfterLogin(query: LocationQuery): string {
  const value = query.redirect;
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  ) {
    return value;
  }
  return "/";
}
