import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "vue-sonner";

import { BaseRepository, BusinessLogicError } from "./BaseRepository";

// Runs the real repository so only the network is faked.
vi.unmock("@/utils/api/BaseRepository");
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn() } }));

class ProbeRepository extends BaseRepository {
  send(): Promise<unknown> {
    return this.postRequest({
      url: this.buildUrl("/probe"),
      bearerToken: "token",
      data: { a: 1 },
    });
  }

  remove(): Promise<unknown> {
    return this.deleteRequest({
      url: this.buildUrl("/probe"),
      bearerToken: "token",
      data: undefined,
    });
  }

  load(handleBusinessErrors?: boolean): Promise<unknown> {
    return this.getRequest({
      url: this.buildUrl("/probe"),
      bearerToken: "token",
      handleBusinessErrors,
    });
  }
}

function failWith(code: string, message: string): void {
  vi.mocked(fetch).mockResolvedValue(
    new Response(
      JSON.stringify({
        status_code: 400,
        status: "failure",
        error_code: code,
        error_message: message,
      }),
      { status: 400 },
    ),
  );
}

describe("BaseRepository business errors", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("toasts in plain words, without the error code or the server's reason", async () => {
    failWith("EntityNotFound", "The entity was not found in the db.");

    await expect(new ProbeRepository().load()).rejects.toBeInstanceOf(
      BusinessLogicError,
    );

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      "The request could not be processed. Please try again.",
    );
  });

  it("leaves the message to callers that handle business errors", async () => {
    failWith("EntityNotFound", "The entity was not found in the db.");

    await expect(new ProbeRepository().load(true)).rejects.toMatchObject({
      error_code: "EntityNotFound",
    });

    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("BaseRepository API address", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the page's port, so a forwarded port still reaches the API", async () => {
    // jsdom serves the page from localhost:3000.
    expect(window.location.port).not.toBe("");

    await new ProbeRepository().load();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`https://${window.location.host}/`),
      expect.anything(),
    );
  });
});

describe("BaseRepository empty responses", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves a 204 No Content answer without a body", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(new ProbeRepository().send()).resolves.toBeUndefined();
  });

  it("resolves an empty 200 answer without a body", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 200 }));

    await expect(new ProbeRepository().remove()).resolves.toBeUndefined();
  });

  it("still parses a JSON body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: "p1" }), { status: 201 }),
    );

    await expect(new ProbeRepository().send()).resolves.toEqual({ id: "p1" });
  });
});
