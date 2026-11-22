import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Analysis } from "@/codeclarity_components/analyses/analysis.entity";
import type { Project } from "@/codeclarity_components/projects/project.entity";

import { analysisPath, paginated } from "../../../../tests/fixtures/results";
import { createTestApp, type TestApp } from "../../../../tests/real-app";

import ResultsVulnerabilities from "./ResultsVulnerabilities.vue";

// The show_blacklisted flag of the last request to this API path.
function lastShowBlacklisted(app: TestApp, path: string): string | null {
  const request = app.http.requests
    .filter((r) => r.path === `${analysisPath}${path}`)
    .at(-1);
  return request?.query.get("show_blacklisted") ?? null;
}

async function show(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  await app.visit("/projects");
  app.http.on("GET", `${analysisPath}/sbom/workspaces`, {
    data: { workspaces: ["."], package_manager: "NPM" },
  });
  app.http.on("GET", `${analysisPath}/vulnerabilities`, paginated([]));
  app.http.on("GET", `${analysisPath}/vulnerabilities/stats`, { data: {} });
  app.http.on("GET", `${analysisPath}/vulnerabilities/malicious-packages`, {
    data: [],
  });
  render(ResultsVulnerabilities, {
    props: {
      analysis: { id: "a-1", steps: [] } as unknown as Analysis,
      project: { id: "p-1" } as unknown as Project,
    },
    global: app.global,
  });
  await flushPromises();
  return app;
}

describe("ResultsVulnerabilities policy exclusions", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("asks the stats and the list for the same policy toggle", async () => {
    const app = await show();
    expect(lastShowBlacklisted(app, "/vulnerabilities/stats")).toBe("false");

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: /Filters/ }));
    const menu = await screen.findByRole("menu");
    await user.click(
      within(menu).getByRole("menuitemcheckbox", {
        name: "Show policy excluded",
      }),
    );
    await flushPromises();

    expect(lastShowBlacklisted(app, "/vulnerabilities")).toBe("true");
    expect(lastShowBlacklisted(app, "/vulnerabilities/stats")).toBe("true");
  });
});
