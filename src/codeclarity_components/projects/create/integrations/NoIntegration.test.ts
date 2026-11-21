import { fireEvent, render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";

import {
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";

import NoIntegration from "./NoIntegration.vue";

const organization: Organization = {
  id: "org-1",
  name: "Test Organization",
  color_scheme: "1",
  description: "",
  created_on: new Date(),
  personal: false,
  role: MemberRole.ADMIN,
  number_of_members: 1,
  organizationMemberships: [],
  joined_on: new Date(),
};

function renderFor(role: MemberRole): ReturnType<typeof render> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", component: { template: "<div />" } },
      {
        path: "/orgs/:action?/:page?/:orgId?",
        name: "orgs",
        component: { template: "<div />" },
      },
    ],
  });
  return render(NoIntegration, {
    props: { defaultOrg: { ...organization, role } },
    global: { plugins: [router] },
  });
}

describe("NoIntegration", () => {
  it("tells an admin to add an integration and links to the settings", () => {
    renderFor(MemberRole.ADMIN);

    expect(
      screen.getByText(/Add an integration in the organisation/),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Manage integrations" }),
    ).toBeTruthy();
  });

  it("tells a member to ask an admin, without the settings link", () => {
    renderFor(MemberRole.USER);

    expect(screen.getByText(/Ask an organisation admin/)).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Manage integrations" }),
    ).toBeNull();
  });

  it("offers the archive upload and a refresh", async () => {
    const { emitted } = renderFor(MemberRole.USER);

    await fireEvent.click(
      screen.getByRole("button", { name: "Upload an archive" }),
    );
    await fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    expect(emitted("onLocalUpload")).toHaveLength(1);
    expect(emitted("onRefresh")).toHaveLength(1);
  });
});
