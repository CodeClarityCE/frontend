import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import {
  IntegrationProvider,
  IntegrationType,
  type VCS,
} from "@/codeclarity_components/organizations/integrations/Integrations";

import IntegrationsComponent from "./IntegrationsComponent.vue";

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

      const card = wrapper.find('[data-testid="popular-github-card"]');
      expect(card.exists()).toBe(true);
      expect(card.attributes("aria-disabled")).toBe("false");
      expect(card.text()).toContain("Popular on GitHub");
      expect(card.text()).toContain("Top 100 starred JS/TS/PHP repos");

      await card.trigger("click");

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

      const card = wrapper.find('[data-testid="popular-github-card"]');
      expect(card.attributes("aria-disabled")).toBe("true");
      expect(card.text()).toContain("Requires a GitHub integration");

      await card.trigger("click");

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

      await wrapper.find('[data-testid="github-card"]').trigger("click");
      await wrapper.find('[data-testid="gitlab-card"]').trigger("click");

      expect(wrapper.emitted("onSelectedVCS")).toEqual([[github], [gitlab]]);
    });

    it("emits onLocalUpload for the upload card", async () => {
      const wrapper = mount(IntegrationsComponent, {
        props: { vcsIntegrations: [] },
      });

      const cards = wrapper.findAll(".cursor-pointer");
      await cards[cards.length - 1]!.trigger("click");

      expect(wrapper.emitted("onLocalUpload")).toHaveLength(1);
    });
  });
});
