import { fireEvent, render, screen, within } from "@testing-library/vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import CreateProject from "./CreateProject.vue";

const { getVCS } = vi.hoisted(() => ({ getVCS: vi.fn() }));
const defaultOrg = ref({ id: "org-1", role: 0 });

vi.mock("pinia", async () => ({
  ...(await vi.importActual("pinia")),
  storeToRefs: () => ({ defaultOrg }),
}));

vi.mock(
  "@/codeclarity_components/organizations/integrations/IntegrationsRepository",
  () => ({
    IntegrationsRepository: class {
      getVCS = getVCS;
    },
  }),
);

vi.mock("@/utils/api/BaseRepository", () => ({
  BaseRepository: class {},
  BusinessLogicError: class extends Error {},
}));

// The importers load repositories themselves; only which one opens matters here.
vi.mock("./import/GithubImportComponent.vue", () => ({
  default: { name: "GithubImport", template: "<p>GitHub importer</p>" },
}));
vi.mock("./import/GitlabImportComponent.vue", () => ({
  default: { name: "GitlabImport", template: "<p>GitLab importer</p>" },
}));
vi.mock("./import/PopularGithubImportComponent.vue", () => ({
  default: { name: "PopularImport", template: "<p>Popular importer</p>" },
}));
vi.mock("./import/LocalUploadComponent.vue", () => ({
  default: { name: "LocalUpload", template: "<p>Upload form</p>" },
}));
vi.mock("./integrations/NoIntegration.vue", () => ({
  default: { name: "NoIntegration", template: "<p>No integration yet</p>" },
}));

function vcs(provider: string, invalid = false) {
  return {
    id: `${provider}-1`,
    integration_provider: provider,
    service_domain: `${provider.toLowerCase()}.com`,
    invalid,
  };
}

describe("CreateProject", () => {
  beforeEach(() => {
    getVCS.mockReset();
    defaultOrg.value = { id: "org-1", role: 0 };
    getVCS.mockResolvedValue({ data: [vcs("GITHUB"), vcs("GITLAB")] });
  });

  it("offers each valid integration, the popular list and the upload", async () => {
    getVCS.mockResolvedValue({
      data: [vcs("GITHUB"), vcs("GITLAB", true)],
    });
    render(CreateProject);

    const methods = await screen.findByRole("list", {
      name: "Import methods",
    });
    const buttons = within(methods).getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]!.textContent).toMatch(/^\s*GitHub\s+Import from/);
    expect(buttons[1]!.textContent).toMatch(/Popular on GitHub/);
    expect(buttons[2]!.textContent).toMatch(/Upload an archive/);
  });

  it("opens the chosen importer and goes back to the methods", async () => {
    render(CreateProject);

    await fireEvent.click(await screen.findByText("GitLab"));
    expect(
      screen.getByRole("heading", { name: "GitLab repositories" }),
    ).toBeTruthy();
    expect(screen.getByText("GitLab importer")).toBeTruthy();

    await fireEvent.click(
      screen.getByRole("button", { name: "Back to import methods" }),
    );
    expect(screen.getByRole("list", { name: "Import methods" })).toBeTruthy();
  });

  it("opens the upload form", async () => {
    render(CreateProject);

    await fireEvent.click(await screen.findByText("Upload an archive"));

    expect(screen.getByText("Upload form")).toBeTruthy();
  });

  it("explains what to do without any integration", async () => {
    getVCS.mockResolvedValue({ data: [] });
    render(CreateProject);

    expect(await screen.findByText("No integration yet")).toBeTruthy();
  });

  it("says when the integrations cannot be loaded and retries", async () => {
    getVCS.mockRejectedValueOnce(new Error("down"));
    render(CreateProject);

    expect(
      await screen.findByText(/The integrations could not be loaded/),
    ).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("list", { name: "Import methods" }),
    ).toBeTruthy();
  });

  it("lists the new organisation's integrations after switching", async () => {
    getVCS.mockResolvedValue({ data: [vcs("GITHUB")] });
    render(CreateProject);
    expect(await screen.findByText("GitHub")).toBeTruthy();

    getVCS.mockResolvedValue({ data: [vcs("GITLAB")] });
    defaultOrg.value = { id: "org-2", role: 0 };

    expect(await screen.findByText("GitLab")).toBeTruthy();
    expect(screen.queryByText("GitHub")).toBeNull();
  });
});
