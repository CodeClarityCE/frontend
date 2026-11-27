import { render, screen } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import {
  createTestApp,
  type TestApp,
  withToaster,
} from "../../../tests/real-app";

import { BaseRepository, BusinessLogicError } from "./BaseRepository";

class ProbeRepository extends BaseRepository {
  send(): Promise<unknown> {
    return this.postRequest({
      url: this.buildUrl("/probe"),
      data: { a: 1 },
    });
  }

  remove(): Promise<unknown> {
    return this.deleteRequest({
      url: this.buildUrl("/probe"),
      data: undefined,
    });
  }

  load(handleBusinessErrors?: boolean): Promise<unknown> {
    return this.getRequest({
      url: this.buildUrl("/probe"),
      handleBusinessErrors,
    });
  }
}

// A page with the app's toaster, whose GET /probe fails with a business error.
function failingPage(): TestApp {
  const app = createTestApp();
  app.http.on(
    "GET",
    "/probe",
    {
      status_code: 400,
      status: "failure",
      error_code: "EntityNotFound",
      error_message: "The entity was not found in the db.",
    },
    400,
  );
  render(withToaster(defineComponent(() => () => null)), {
    global: app.global,
  });
  return app;
}

describe("BaseRepository business errors", () => {
  it("toasts in plain words, without the error code or the server's reason", async () => {
    failingPage();

    await expect(new ProbeRepository().load()).rejects.toBeInstanceOf(
      BusinessLogicError,
    );

    expect(
      await screen.findByText(
        "The request could not be processed. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/EntityNotFound|not found in the db/)).toBeNull();
  });

  it("leaves the message to callers that handle business errors", async () => {
    failingPage();

    await expect(new ProbeRepository().load(true)).rejects.toMatchObject({
      error_code: "EntityNotFound",
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole("listitem")).toBeNull();
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
