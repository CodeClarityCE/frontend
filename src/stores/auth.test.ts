import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/utils/logger";

import { loadAuthStoreFromLocalStorage, useAuthStore } from "./auth";

// Runs the real store; only the logger is faked.
vi.unmock("pinia");
vi.unmock("@/stores/auth");
vi.mock("@/utils/logger");

describe("loadAuthStoreFromLocalStorage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.spyOn(localStorage, "getItem").mockReturnValue("{not json");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts signed out and warns when the saved state is corrupt", () => {
    loadAuthStoreFromLocalStorage();

    const auth = useAuthStore();
    expect(auth.getAuthenticated).toBe(false);
    expect(auth.getToken).toBeUndefined();
    expect(auth.getInitialized).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      "Could not restore the saved session",
      expect.objectContaining({ stack: expect.any(String) as string }),
    );
  });
});
