import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import {
  IntegrationProvider,
  IntegrationType,
  type VCS,
} from "@/codeclarity_components/organizations/integrations/Integrations";

import IntegrationsComponent from "./IntegrationsComponent.vue";

// The import method card whose text starts with the name.
function card(wrapper: ReturnType<typeof mount>, name: string) {
  const found = wrapper
    .findAll("button")
    .find((button) => button.text().startsWith(name));
  if (!found) throw new Error(`no ${name} card`);
  return found;
}

function vcs(provider: IntegrationProvider, invalid = false): VCS {
  return {
    id: `${provider.toLowerCase()}-1`,
    added_on: new Date("2026-01-01"),
    added_by: "user-1",
    service_domain:
      provider === IntegrationProvider.GITHUB ? "github.com" : "gitlab.com",
    integration_type: IntegrationType.VCS,
    integration_provider: provider,
    invalid,
  };
}

describe("IntegrationsComponent", () => {
  describe("Popular on GitHub card", () => {
    it("is enabled and emits the GitHub integration when one is valid", async () => {
      const github = vcs(IntegrationProvider.GITHUB);
      const wrapper = mount(IntegrationsComponent, {
        props: { vcsIntegrations: [vcs(IntegrationProvider.GITLAB), github] },
      });

      const popular = card(wrapper, "Popular on GitHub");
      expect(popular.attributes("aria-disabled")).toBe("false");
      expect(popular.text()).toContain("Top 100 starred JS/TS/PHP repos");

      await popular.trigger("click");

      expect(wrapper.emitted("onPopularGithub")).toHaveLength(1);
      expect(wrapper.emitted("onPopularGithub")![0]).toEqual([github]);
      expect(wrapper.emitted("onSelectedVCS")).toBeUndefined();
    });

    it("is disabled with a hint when no valid GitHub integration exists", async () => {
      const wrapper = mount(IntegrationsComponent, {
        props: {
          vcsIntegrations: [
            vcs(IntegrationProvider.GITLAB),
            vcs(IntegrationProvider.GITHUB, true),
          ],
        },
      });

      const popular = card(wrapper, "Popular on GitHub");
      expect(popular.attributes("aria-disabled")).toBe("true");
      expect(popular.text()).toContain("Requires a GitHub integration");

      await popular.trigger("click");

      expect(wrapper.emitted("onPopularGithub")).toBeUndefined();
    });
  });

  describe("existing cards", () => {
    it("still emits the selected VCS for the GitHub and GitLab cards", async () => {
      const github = vcs(IntegrationProvider.GITHUB);
      const gitlab = vcs(IntegrationProvider.GITLAB);
      const wrapper = mount(IntegrationsComponent, {
        props: { vcsIntegrations: [github, gitlab] },
      });

      await card(wrapper, "GitHub").trigger("click");
      await card(wrapper, "GitLab").trigger("click");

      expect(wrapper.emitted("onSelectedVCS")).toEqual([[github], [gitlab]]);
    });

    it("emits onLocalUpload for the upload card", async () => {
      const wrapper = mount(IntegrationsComponent, {
        props: { vcsIntegrations: [] },
      });

      const upload = wrapper
        .findAll("button")
        .find((button) => button.text().includes("Upload an archive"));
      await upload!.trigger("click");

      expect(wrapper.emitted("onLocalUpload")).toHaveLength(1);
    });
  });
});
