import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardEmptyState from "@/codeclarity_components/dashboard/layout/DashboardEmptyState.vue";

function mountState(props: Record<string, unknown>) {
  return mount(DashboardEmptyState, {
    props: { orgId: "org-1", ...props },
    global: {
      stubs: {
        RouterLink: { props: ["to"], template: "<a><slot /></a>" },
      },
    },
  });
}

describe("DashboardEmptyState", () => {
  it("offers to connect a VCS or upload a project when there is nothing yet", () => {
    const wrapper = mountState({});

    expect(wrapper.find("h3").text()).toBe("Get started");
    expect(wrapper.text()).toContain("Connect a VCS");
    expect(wrapper.text()).toContain("Upload a project");
  });

  it("asks for a first project once a VCS is connected", () => {
    const wrapper = mountState({ hasIntegrations: true });

    expect(wrapper.find("h3").text()).toBe("Import your first project");
  });

  it("asks for a first analysis once there are projects", () => {
    const wrapper = mountState({ hasIntegrations: true, hasProjects: true });

    expect(wrapper.find("h3").text()).toBe("Run your first analysis");
    expect(wrapper.text()).toContain("Go to Projects");
  });

  it("offers to try again after an error", async () => {
    const wrapper = mountState({ isError: true });

    expect(wrapper.find("h3").text()).toBe(
      "Unable to load the project overview",
    );
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("retry")).toHaveLength(1);
  });
});
