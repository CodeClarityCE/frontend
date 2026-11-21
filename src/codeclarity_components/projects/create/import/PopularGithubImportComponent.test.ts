import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/vue";
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  createTestApp,
  org,
  type TestApp,
} from "../../../../../tests/real-app";

import PopularGithubImportComponent from "./PopularGithubImportComponent.vue";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

const popularPath = `/org/${org.id}/integrations/github/gh-1/repositories/popular`;

const popular = {
  data: [
    {
      id: "repo-1",
      url: "https://github.com/vuejs/core",
      default_branch: "main",
      visibility: "public",
      fully_qualified_name: "vuejs/core",
      description: "",
      created_at: "2026-01-01T00:00:00.000Z",
      imported_already: false,
      integration_id: "gh-1",
      stars: 48000,
    },
  ],
  entry_count: 1,
  page: 0,
  entries_per_page: 100,
  total_entries: 1,
  total_pages: 1,
  status: "success",
  matching_count: 1,
  filter_count: {},
};

// The "Popular on GitHub" import page.
async function openPopular(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", popularPath, popular);
  await app.visit("/projects/add");
  render(PopularGithubImportComponent, {
    props: { integration: "gh-1" },
    global: app.global,
  });
  await screen.findByText("vuejs/core");
  return app;
}

// The query of the last request for the popular list.
const lastQuery = (app: TestApp): URLSearchParams =>
  app.http.requests.filter((r) => r.path === popularPath).at(-1)!.query;

describe("PopularGithubImportComponent", () => {
  // jsdom lacks the pointer capture calls the select menu makes.
  beforeAll(() => {
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.releasePointerCapture ??= () => undefined;
  });

  it("lists the popular repositories ranked by stars, in every language", async () => {
    const app = await openPopular();

    expect(screen.getByRole("columnheader", { name: /Stars/ })).toBeTruthy();
    const query = lastQuery(app);
    expect(query.get("sort_key")).toBe("stars");
    expect(query.get("languages")).toBe("");
    expect(query.get("active_filters")).toBe("[only_non_imported]");
  });

  it("asks for the chosen language only, outside the filters", async () => {
    const app = await openPopular();

    await userEvent.click(screen.getByRole("combobox", { name: "Language" }));
    const choices = screen
      .getAllByRole("option")
      .map((o) => o.textContent?.trim());
    expect(choices).toEqual([
      "All (JavaScript, TypeScript, PHP)",
      "JavaScript",
      "TypeScript",
      "PHP",
    ]);
    await userEvent.click(screen.getByRole("option", { name: "PHP" }));

    await vi.waitFor(() => expect(lastQuery(app).get("languages")).toBe("PHP"));
    expect(lastQuery(app).get("active_filters")).toBe("[only_non_imported]");
  });
});
