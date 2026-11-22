import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import UserAuthForm from "@/codeclarity_components/authentication/signin/UserAuthForm.vue";

import { createTestApp, org, type TestApp, user } from "../../../../real-app";

const tokens = {
  token: "access-token",
  token_expiry: "2099-01-01T00:00:00.000Z",
  refresh_token: "refresh-token",
  refresh_token_expiry: "2099-01-01T00:00:00.000Z",
};

// The API's answer when it refuses a sign-in.
const refusal = (error_code: string) => ({
  status_code: 400,
  status: "failure",
  error_code,
  error_message: "",
});

// The login page for a signed-out visitor; sign-in succeeds unless a test says otherwise.
async function openLogin(path = "/login"): Promise<TestApp> {
  const app = createTestApp();
  app.http.on("POST", "/auth/authenticate", { data: tokens });
  app.http.on("GET", "/auth/user", { data: user });
  app.http.on("GET", `/org/${org.id}`, { data: org });
  await app.visit(path);
  render(UserAuthForm, { global: app.global });
  return app;
}

async function signIn(email = user.email, password = "secret"): Promise<void> {
  const typist = userEvent.setup();
  if (email) await typist.type(screen.getByLabelText("Email"), email);
  if (password) await typist.type(screen.getByLabelText("Password"), password);
  await typist.click(screen.getByRole("button", { name: "Sign in" }));
}

const signInRequests = (app: TestApp) =>
  app.http.requests.filter((r) => r.path === "/auth/authenticate");

describe("UserAuthForm.vue", () => {
  it("asks for the email and password, and links to password reset", async () => {
    await openLogin();

    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    expect(
      screen.getByRole("link", { name: "Forgot your password?" }),
    ).toHaveAttribute("href", "/password_reset_request");
  });

  it("sends a visitor who is already signed in to the home page", async () => {
    const app = createTestApp({ signedIn: true });
    await app.visit("/login");

    render(UserAuthForm, { global: app.global });

    await waitFor(() => expect(app.router.currentRoute.value.path).toBe("/"));
  });

  describe("Validation", () => {
    it("asks for both fields before sending anything", async () => {
      const app = await openLogin();

      await signIn("", "");

      expect(await screen.findByText("Enter your email")).toBeInTheDocument();
      expect(screen.getByText("Enter your password")).toBeInTheDocument();
      expect(signInRequests(app)).toEqual([]);
    });

    it("refuses an email that is not one", async () => {
      const app = await openLogin();

      await signIn("not-an-email");

      expect(
        await screen.findByText("Enter a valid email address"),
      ).toBeInTheDocument();
      expect(signInRequests(app)).toEqual([]);
    });
  });

  it("shows that it is connecting while the sign-in is pending", async () => {
    await openLogin();
    vi.stubGlobal("fetch", () => new Promise(() => undefined));

    await signIn();

    expect(await screen.findByRole("status")).toHaveTextContent("Connecting");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  describe("Error Handling", () => {
    it.each([
      ["WrongCredentials", "The email or password is incorrect."],
      [
        "RegistrationNotVerified",
        "You have not yet verified your registration",
      ],
      [
        "CannotPerformActionOnSocialAccount",
        "This account signs in with GitHub or GitLab, so it has no password.",
      ],
      [
        "InternalError",
        "Something went wrong while signing you in. Please try again.",
      ],
    ])("explains a %s refusal", async (code, message) => {
      const app = await openLogin();
      app.http.on("POST", "/auth/authenticate", refusal(code), 400);

      await signIn();

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(app.router.currentRoute.value.name).toBe("login");
    });

    it("shows a general error when the server answers something unexpected", async () => {
      const app = await openLogin();
      app.http.on("POST", "/auth/authenticate", { data: { token: 42 } });

      await signIn();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Something went wrong while signing you in. Please try again.",
      );
    });

    it("returns to login with a notice when the account is not activated", async () => {
      const app = await openLogin("/login?redirect=/projects");
      app.http.on(
        "POST",
        "/auth/authenticate",
        refusal("AccountNotActivated"),
        400,
      );

      await signIn();

      await waitFor(() =>
        expect(app.router.currentRoute.value.query).toEqual({
          notice: "not_activated",
          redirect: "/projects",
        }),
      );
      expect(app.router.currentRoute.value.name).toBe("login");
    });
  });

  it("clears the error once a later sign-in succeeds", async () => {
    const app = await openLogin();
    app.http.on("POST", "/auth/authenticate", refusal("WrongCredentials"), 400);
    await signIn();
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    app.http.on("POST", "/auth/authenticate", { data: tokens });
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(app.router.currentRoute.value.path).toBe("/"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
