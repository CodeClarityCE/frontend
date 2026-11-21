import { fireEvent, render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { MemberRole } from "@/codeclarity_components/organizations/organization.entity";

import { createTestApp, org } from "../../../../tests/real-app";

import IntegrationsConfigPanel from "./IntegrationsConfigPanel.vue";

const ADMIN_ONLY = ["Test", "Configure", "Disconnect"];
const HINT =
  "Ask an organisation admin or owner to set up or change integrations.";

// The tickets page's integrations panel, for a member with this role.
async function renderPanel(
  role: MemberRole,
  connected: boolean,
): Promise<void> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}`, { data: { ...org, role } });
  app.http.on("GET", `/org/${org.id}/tickets/integrations`, {
    data: connected
      ? [
          {
            id: "i-1",
            provider: "CLICKUP",
            enabled: true,
            created_on: "2026-11-01T09:00:00Z",
            has_config: true,
          },
        ]
      : [],
  });
  await app.visit("/tickets");
  render(IntegrationsConfigPanel, { global: app.global });
}

// Button names, without Connect's screen reader suffix.
async function buttonNames(): Promise<string[]> {
  // Let the integrations load.
  await flushPromises();
  await screen.findByRole("heading", { name: "ClickUp" });
  return screen
    .getAllByRole("button")
    .map((b) => (b.textContent ?? "").trim().replace(/\s*ClickUp$/, ""));
}

describe("IntegrationsConfigPanel", () => {
  describe.each([MemberRole.USER, MemberRole.MODERATOR])(
    "for a member below admin (role %s)",
    (role) => {
      it("shows a connected provider and Refresh, but no admin actions", async () => {
        await renderPanel(role, true);

        const names = await buttonNames();

        expect(names).toEqual(["Refresh"]);
        expect(await screen.findByText("Connected")).toBeTruthy();
        expect(screen.getByText(HINT)).toBeTruthy();
      });

      it("offers no Connect for an unconnected provider", async () => {
        await renderPanel(role, false);

        expect(await buttonNames()).toEqual(["Refresh"]);
        expect(screen.getByText(HINT)).toBeTruthy();
        expect(screen.queryByRole("dialog")).toBeNull();
      });
    },
  );

  describe.each([MemberRole.ADMIN, MemberRole.OWNER])(
    "for an admin or owner (role %s)",
    (role) => {
      it("shows Test, Configure and Disconnect for a connected provider", async () => {
        await renderPanel(role, true);

        const names = await buttonNames();

        expect(names).toEqual(["Refresh", ...ADMIN_ONLY]);
        expect(screen.queryByText(HINT)).toBeNull();
      });

      it("shows Connect for an unconnected provider and opens the setup", async () => {
        await renderPanel(role, false);

        expect(await buttonNames()).toEqual(["Refresh", "Connect"]);
        await fireEvent.click(screen.getByRole("button", { name: /Connect/ }));

        expect(
          await screen.findByRole("dialog", { name: "Connect ClickUp" }),
        ).toBeInTheDocument();
      });
    },
  );
});
