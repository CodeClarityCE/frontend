import { fireEvent, render, screen } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MemberRole,
  type Organization,
} from "@/codeclarity_components/organizations/organization.entity";

import IntegrationsConfigPanel from "./IntegrationsConfigPanel.vue";

const { getIntegrations, defaultOrg } = vi.hoisted(() => ({
  getIntegrations: vi.fn(),
  defaultOrg: { value: undefined as Organization | undefined },
}));

vi.mock("../tickets.repository", () => ({
  TicketsRepository: class {
    getIntegrations = getIntegrations;
    testIntegration = vi.fn();
    deleteIntegration = vi.fn();
  },
}));

// storeToRefs is mocked to pass the store through, so defaultOrg is a ref here.
vi.mock("@/stores/user", () => ({ useUserStore: () => ({ defaultOrg }) }));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "test-token" }),
}));

// The shared icon mock lacks this panel's icons, so render the real ones.
vi.mock("@lucide/vue", async () => await vi.importActual("@lucide/vue"));

// Stands in for the ClickUp setup dialog, so a test can see whether it mounts.
vi.mock("./ClickUpConfigModal.vue", () => ({
  default: {
    name: "ClickUpConfigModal",
    template: '<div data-testid="clickup-setup" />',
  },
}));

const ADMIN_ONLY = ["Test", "Configure", "Disconnect"];
const HINT =
  "Ask an organisation admin or owner to set up or change integrations.";

function setRole(role: MemberRole): void {
  defaultOrg.value = { id: "org-1", role } as Organization;
}

function clickUp(connected: boolean): void {
  getIntegrations.mockResolvedValue({
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
}

// Button names, without the icon text jsdom renders or Connect's screen
// reader suffix.
async function buttonNames(): Promise<string[]> {
  // Let the integrations load.
  await flushPromises();
  await screen.findByRole("heading", { name: "ClickUp" });
  return screen.getAllByRole("button").map((b) =>
    (b.textContent ?? "")
      .replace(/\{[\s\S]*\}/, "")
      .trim()
      .replace(/\s*ClickUp$/, ""),
  );
}

describe("IntegrationsConfigPanel", () => {
  beforeEach(() => {
    getIntegrations.mockReset();
  });

  describe.each([MemberRole.USER, MemberRole.MODERATOR])(
    "for a member below admin (role %s)",
    (role) => {
      beforeEach(() => setRole(role));

      it("shows a connected provider and Refresh, but no admin actions", async () => {
        clickUp(true);
        render(IntegrationsConfigPanel);

        const names = await buttonNames();

        expect(names).toEqual(["Refresh"]);
        expect(await screen.findByText("Connected")).toBeTruthy();
        expect(screen.getByText(HINT)).toBeTruthy();
      });

      it("offers no Connect for an unconnected provider", async () => {
        clickUp(false);
        render(IntegrationsConfigPanel);

        expect(await buttonNames()).toEqual(["Refresh"]);
        expect(screen.getByText(HINT)).toBeTruthy();
        expect(screen.queryByTestId("clickup-setup")).toBeNull();
      });
    },
  );

  describe.each([MemberRole.ADMIN, MemberRole.OWNER])(
    "for an admin or owner (role %s)",
    (role) => {
      beforeEach(() => setRole(role));

      it("shows Test, Configure and Disconnect for a connected provider", async () => {
        clickUp(true);
        render(IntegrationsConfigPanel);

        const names = await buttonNames();

        expect(names).toEqual(["Refresh", ...ADMIN_ONLY]);
        expect(screen.queryByText(HINT)).toBeNull();
      });

      it("shows Connect for an unconnected provider and opens the setup", async () => {
        clickUp(false);
        render(IntegrationsConfigPanel);

        expect(await buttonNames()).toEqual(["Refresh", "Connect"]);
        await fireEvent.click(screen.getByRole("button", { name: /Connect/ }));

        expect(await screen.findByTestId("clickup-setup")).toBeTruthy();
      });
    },
  );
});
