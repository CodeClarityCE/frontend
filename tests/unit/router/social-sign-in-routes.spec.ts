import { describe, expect, it } from "vitest";

import router from "@/router";

describe("router", () => {
  it.each(["/auth/github/callback", "/auth/gitlab/callback"])(
    "sends %s to the not found page",
    (path) => {
      expect(router.resolve(path).matched[0]?.path).toBe("/:catchAll(.*)");
    },
  );
});
