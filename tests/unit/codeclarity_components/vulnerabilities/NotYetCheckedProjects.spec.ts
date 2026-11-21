import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NotYetCheckedProjects from "@/codeclarity_components/vulnerabilities/NotYetCheckedProjects.vue";

const { getNotYetChecked } = vi.hoisted(() => ({
  getNotYetChecked: vi.fn(),
}));

vi.mock(
  "@/codeclarity_components/vulnerabilities/organization_vulnerabilities.repository",
  () => ({
    OrganizationVulnerabilitiesRepository: class {
      getNotYetChecked = getNotYetChecked;
    },
  }),
);

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString();

describe("NotYetCheckedProjects", () => {
  beforeEach(() => getNotYetChecked.mockReset());

  it("marks the projects analysed before the vulnerability was published", async () => {
    getNotYetChecked.mockResolvedValue({
      vulnerability_id: "CVE-2099-0100",
      published: "2026-11-08T12:00:00.000Z",
      projects: [
        {
          project_id: "p-old",
          project_name: "old-api",
          analysis_id: "a-old",
          analyzed_on: daysAgo(20),
          stale: true,
        },
      ],
    });
    const wrapper = mount(NotYetCheckedProjects, {
      props: { vulnerabilityId: "CVE-2099-0100" },
    });
    await flushPromises();

    expect(getNotYetChecked).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "test-org-id",
        vulnerabilityId: "CVE-2099-0100",
      }),
    );
    const section = wrapper.get('[aria-label="Not yet checked"]');
    expect(section.text()).toContain("Not yet checked in 1 project");
    expect(section.text()).toContain("Nov 8, 2026");
    const row = section.get('[data-testid="not-yet-checked-project"]');
    expect(row.text()).toContain("old-api");
    expect(row.text()).toContain("Analysed 20 days ago");
    expect(row.find('button[aria-label="Re-analyse old-api"]').exists()).toBe(
      true,
    );
  });

  it("shows nothing when every project was analysed since", async () => {
    getNotYetChecked.mockResolvedValue({
      vulnerability_id: "CVE-2099-0100",
      published: "2026-11-08T12:00:00.000Z",
      projects: [],
    });
    const wrapper = mount(NotYetCheckedProjects, {
      props: { vulnerabilityId: "CVE-2099-0100" },
    });
    await flushPromises();

    expect(wrapper.find('[aria-label="Not yet checked"]').exists()).toBe(false);
  });
});
