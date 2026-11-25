import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";

import {
  createTestApp,
  org,
  type TestApp,
} from "../../../../../tests/real-app";

import AddGitlab from "./AddGitlab.vue";

const BASE = "https://gitlab.example.com";
const TOKEN = "glpat-xxxxxxxxxxxxxxxxxxxx";
const ok = { status_code: 200, status: "success" };
const addPath = `/org/${org.id}/integrations/gitlab/add`;
const integrationPath = `/org/${org.id}/integrations/gitlab/int-1`;

// A valid GitLab URL of exactly `length` characters.
function urlOfLength(length: number): string {
  return `${BASE}/${"a".repeat(length - BASE.length - 1)}`;
}

async function openPage(query = ""): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("POST", addPath, { status_code: 201, status: "success" });
  await app.visit(`/orgs/add/integrations/${org.id}?provider=GITLAB${query}`);
  render(AddGitlab, { global: app.global });
  return app;
}

const sent = (app: TestApp, method: string, path: string): unknown[] =>
  app.http.requests
    .filter((r) => r.method === method && r.path === path)
    .map((r) => r.body);

async function submitSelfHosted(url: string): Promise<TestApp> {
  const app = await openPage();
  const typist = userEvent.setup();
  await typist.type(
    screen.getByLabelText("GitLab personal access token"),
    TOKEN,
  );
  await typist.click(screen.getByLabelText("Self-hosted"));
  await typist.type(await screen.findByLabelText("Instance URL"), url);
  await typist.click(screen.getByRole("button", { name: "Connect GitLab" }));
  return app;
}

// The integrations list the page opens after saving.
const openedList = (app: TestApp): Promise<void> =>
  vi.waitFor(() =>
    expect(app.router.currentRoute.value.params).toMatchObject({
      action: "manage",
      page: "integrations",
    }),
  );

describe("AddGitlab instance URL", () => {
  it("asks for the instance URL when it is left empty", async () => {
    const app = await openPage();
    const typist = userEvent.setup();
    await typist.type(
      screen.getByLabelText("GitLab personal access token"),
      TOKEN,
    );
    await typist.click(screen.getByLabelText("Self-hosted"));
    await typist.click(screen.getByRole("button", { name: "Connect GitLab" }));

    expect(
      await screen.findByText("Enter the URL of your GitLab instance"),
    ).toBeInTheDocument();
    expect(sent(app, "POST", addPath)).toEqual([]);
  });

  it("asks for a full URL when the scheme is missing", async () => {
    const app = await submitSelfHosted("gitlab.example.com");

    expect(
      await screen.findByText(
        "Enter a full URL, such as https://gitlab.example.com",
      ),
    ).toBeInTheDocument();
    expect(sent(app, "POST", addPath)).toEqual([]);
  });

  it("shows a field error for a URL over 255 characters and sends nothing", async () => {
    const app = await submitSelfHosted(urlOfLength(256));

    expect(
      await screen.findByText("Enter a URL of at most 255 characters"),
    ).toBeInTheDocument();
    expect(sent(app, "POST", addPath)).toEqual([]);
  });

  it("sends a 255 character URL", async () => {
    const url = urlOfLength(255);

    const app = await submitSelfHosted(url);

    await openedList(app);
    expect(sent(app, "POST", addPath)).toEqual([
      expect.objectContaining({ gitlab_instance_url: url, token: TOKEN }),
    ]);
  });

  it("counts the URL without its trailing slash", async () => {
    const url = urlOfLength(255);

    const app = await submitSelfHosted(`${url}/`);

    await openedList(app);
    expect(sent(app, "POST", addPath)).toEqual([
      expect.objectContaining({ gitlab_instance_url: url }),
    ]);
  });
});

describe("AddGitlab replacing a token", () => {
  const SELF_HOSTED = "https://gitlab.acme.io";

  async function openReplace(): Promise<TestApp> {
    const app = createTestApp({ signedIn: true });
    app.http.on("GET", integrationPath, {
      data: {
        id: "int-1",
        integration_type: "VCS",
        integration_provider: "GITLAB",
        invalid: false,
        service_domain: SELF_HOSTED,
        service_base_url: SELF_HOSTED,
        token_type: "PERSONAL_ACCESS_TOKEN",
        added_on: "2025-01-01T00:00:00Z",
      },
    });
    app.http.on("PATCH", integrationPath, ok);
    await app.visit(
      `/orgs/add/integrations/${org.id}?provider=GITLAB&update=int-1`,
    );
    render(AddGitlab, { global: app.global });
    return app;
  }

  it("shows the stored instance URL and offers no way to change it", async () => {
    await openReplace();

    expect(
      await screen.findByText(SELF_HOSTED, { exact: false }),
    ).toBeInTheDocument();
    expect(document.body).toHaveTextContent("Replace the GitLab token");
    expect(screen.queryByLabelText("Self-hosted")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Instance URL")).not.toBeInTheDocument();
  });

  it("sends the new token with the stored instance URL", async () => {
    const app = await openReplace();
    await screen.findByText(SELF_HOSTED, { exact: false });

    await userEvent.type(
      screen.getByLabelText("GitLab personal access token"),
      TOKEN,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Replace token" }),
    );

    await openedList(app);
    expect(sent(app, "PATCH", integrationPath)).toEqual([
      expect.objectContaining({
        token: TOKEN,
        gitlab_instance_url: SELF_HOSTED,
      }),
    ]);
    expect(sent(app, "POST", addPath)).toEqual([]);
  });
});
