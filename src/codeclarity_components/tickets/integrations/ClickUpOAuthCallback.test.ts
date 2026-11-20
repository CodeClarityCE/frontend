import { render } from "@testing-library/vue";
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { takeClickUpOAuthToken } from "./clickup-oauth-handoff";
import ClickUpConfigModal from "./ClickUpConfigModal.vue";
import ClickUpOAuthCallback from "./ClickUpOAuthCallback.vue";

const ACCESS_TOKEN = "clickup-access-token-123";

const { exchangeClickUpOAuthCode, getWorkspaces, push } = vi.hoisted(() => ({
  exchangeClickUpOAuthCode: vi.fn(),
  getWorkspaces: vi.fn(),
  push: vi.fn(),
}));

vi.mock("../tickets.repository", () => ({
  TicketsRepository: class {
    exchangeClickUpOAuthCode = exchangeClickUpOAuthCode;
    getWorkspaces = getWorkspaces;
  },
}));

vi.mock("@/stores/user", () => ({
  useUserStore: () => ({ defaultOrg: { id: "org-1" } }),
}));

vi.mock("@/stores/auth", () => ({
  useAuthStore: () => ({ getToken: "test-token" }),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: { code: "auth-code" } }),
  useRouter: () => ({ push }),
  RouterLink: { template: "<a><slot /></a>" },
}));

// The shared setup stubs storage as a no-op, so use real in-memory ones here.
function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => items.delete(key),
    setItem: (key, value) => items.set(key, String(value)),
  };
}

function storedValues(): string[] {
  const values: string[] = [];
  for (const storage of [localStorage, sessionStorage]) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null) values.push(storage.getItem(key) ?? "");
    }
  }
  return values;
}

describe("ClickUpOAuthCallback", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", memoryStorage());
    exchangeClickUpOAuthCode.mockReset();
    getWorkspaces.mockReset();
    getWorkspaces.mockResolvedValue({ data: [] });
    push.mockReset();
    takeClickUpOAuthToken();
    sessionStorage.setItem("clickup_oauth_org_id", "org-1");
    exchangeClickUpOAuthCode.mockResolvedValue({
      data: { access_token: ACCESS_TOKEN },
    });
  });

  it("keeps the token out of browser storage and still sends it to the API", async () => {
    render(ClickUpOAuthCallback);
    await flushPromises();
    render(ClickUpConfigModal);
    await flushPromises();

    expect(exchangeClickUpOAuthCode).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        data: expect.objectContaining({ code: "auth-code" }),
        bearerToken: "test-token",
      }),
    );
    expect(getWorkspaces).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org-1",
        credentials: { access_token: ACCESS_TOKEN },
      }),
    );
    expect(storedValues().join(" ")).not.toContain(ACCESS_TOKEN);
  });

  it("hands the token to the setup dialog in memory, once", async () => {
    render(ClickUpOAuthCallback);
    await flushPromises();

    expect(takeClickUpOAuthToken()).toBe(ACCESS_TOKEN);
    expect(takeClickUpOAuthToken()).toBeNull();
  });
});
