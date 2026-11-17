import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, h } from "vue";
import { toast } from "vue-sonner";

import router from "@/router";
import { useAuthStore } from "@/stores/auth";

import { installLogger, logger } from "./logger";

// Runs the real API client and auth store so only the network is faked.
vi.unmock("@/utils/api/BaseRepository");
vi.unmock("pinia");
vi.unmock("@/stores/auth");
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-sonner", () => ({ toast: { error: vi.fn() } }));

interface SentReport {
  url: string;
  authorization: string | null;
  body: { level: string; msg: string; fields?: Record<string, unknown> };
}

function sentReports(): SentReport[] {
  return vi.mocked(fetch).mock.calls.map(([url, init]) => ({
    url: url as string,
    authorization: new Headers(init?.headers).get("Authorization"),
    body: JSON.parse(init?.body as string) as SentReport["body"],
  }));
}

function signIn(): void {
  const auth = useAuthStore();
  auth.setAuthenticated(true);
  auth.setRefreshToken("session-token");
}

// Each test starts a minute later, past the duplicate window of the last one.
let clock = Date.UTC(2026, 0, 1);

describe("logger", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clock += 60_000;
    vi.setSystemTime(clock);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    vi.mocked(toast.error).mockClear();
    setActivePinia(createPinia());
    signIn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("sends an error report to the API with the session token", () => {
    logger.error("Could not load the project");

    const [report] = sentReports();
    expect(report?.url).toBe("https://localhost:3000/api/logs");
    expect(report?.authorization).toBe("Bearer session-token");
    expect(report?.body).toMatchObject({
      level: "error",
      msg: "Could not load the project",
    });
  });

  it("sends warnings too", () => {
    logger.warn("Retrying the analysis poll");

    expect(sentReports().map((r) => r.body)).toEqual([
      expect.objectContaining({
        level: "warn",
        msg: "Retrying the analysis poll",
      }),
    ]);
  });

  it("sends only allow-listed context keys", () => {
    logger.error("Save failed", {
      route: "/projects/p1",
      component: "ProjectSettings",
      organizationId: "o1",
      projectId: "p1",
      analysisId: "a1",
      stack: "Error: Save failed\n    at save (settings.ts:10)",
      password: "hunter2",
      token: "secret-token",
      formValues: { name: "x" },
    });

    expect(sentReports()[0]?.body.fields).toEqual({
      route: "/projects/p1",
      component: "ProjectSettings",
      organizationId: "o1",
      projectId: "p1",
      analysisId: "a1",
      stack: "Error: Save failed\n    at save (settings.ts:10)",
    });
  });

  it("trims a long stack to about 4 KB", () => {
    const frame = "    at someFunction (https://localhost/src/file.ts:10:20)\n";
    logger.error("Render failed", { stack: frame.repeat(500) });

    const stack = String(sentReports()[0]?.body.fields?.stack);
    expect(stack.length).toBeLessThanOrEqual(4096);
    expect(stack.startsWith(frame)).toBe(true);
  });

  it("sends an identical report once within 10 seconds", () => {
    logger.error("Chart failed to render");
    vi.advanceTimersByTime(9_000);
    logger.error("Chart failed to render");
    logger.warn("Chart failed to render");
    logger.error("Table failed to render");

    expect(sentReports().map((r) => `${r.body.level}:${r.body.msg}`)).toEqual([
      "error:Chart failed to render",
      "warn:Chart failed to render",
      "error:Table failed to render",
    ]);

    vi.advanceTimersByTime(1_001);
    logger.error("Chart failed to render");
    expect(sentReports()).toHaveLength(4);
  });

  it("sends nothing while signed out", () => {
    useAuthStore().$reset();

    logger.error("Login page crashed");
    logger.warn("Login page slow");

    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["the network is down", () => Promise.reject(new TypeError("offline"))],
    [
      "the server fails",
      () =>
        Promise.resolve(
          new Response(JSON.stringify({ error_code: "InternalError" }), {
            status: 500,
          }),
        ),
    ],
    [
      "the rate limit is hit",
      () => Promise.resolve(new Response("", { status: 429 })),
    ],
  ])("drops the report quietly when %s", async (_case, respond) => {
    vi.mocked(fetch).mockImplementation(respond);
    const rejections: unknown[] = [];
    const onRejection = (event: PromiseRejectionEvent): void => {
      rejections.push(event.reason);
    };
    window.addEventListener("unhandledrejection", onRejection);

    expect(() => logger.error("Upload failed")).not.toThrow();
    await vi.runAllTimersAsync();
    window.removeEventListener("unhandledrejection", onRejection);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
    expect(rejections).toEqual([]);
  });

  it("stays on the page when the server says the session is gone", async () => {
    vi.mocked(router.push).mockClear();
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status_code: 401,
          status: "failure",
          error_code: "NotAuthenticated",
          error_message: "Not authenticated",
        }),
        { status: 401 },
      ),
    );

    logger.error("Upload failed");
    await vi.runAllTimersAsync();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("drops reports made before the app has a store", () => {
    setActivePinia(undefined);

    expect(() => logger.error("Startup failed")).not.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("cuts a message to the 2 KB the server accepts", () => {
    logger.error("x".repeat(5000));

    expect(sentReports()[0]?.body.msg).toHaveLength(2048);
  });

  it("names the current page when the caller gives no route", () => {
    window.history.pushState({}, "", "/orgs/o1/projects");

    logger.warn("Slow page");

    expect(sentReports()[0]?.body.fields?.route).toBe("/orgs/o1/projects");
  });

  it("prints info and debug in dev builds without sending them", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    logger.info("Loaded 3 projects", { projectId: "p1" });
    logger.debug("Poll tick");

    expect(fetch).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith("Loaded 3 projects", { projectId: "p1" });
    expect(debug).toHaveBeenCalledWith("Poll tick", {});
  });

  it("also prints errors and warnings in dev builds", () => {
    logger.error("Save failed", { projectId: "p1" });
    logger.warn("Slow save");

    expect(console.error).toHaveBeenCalledWith("Save failed", {
      projectId: "p1",
    });
    expect(console.warn).toHaveBeenCalledWith("Slow save", {});
  });

  it("prints nothing for errors and warnings in production builds", () => {
    vi.stubEnv("DEV", false);

    logger.error("Save failed");
    logger.warn("Slow save");

    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(sentReports()).toHaveLength(2);
  });

  it("prints and sends nothing for info and debug in production builds", () => {
    vi.stubEnv("DEV", false);
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    logger.info("Loaded 3 projects");
    logger.debug("Poll tick");

    expect(fetch).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(debug).not.toHaveBeenCalled();
  });
});

describe("installLogger", () => {
  let uninstall: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    clock += 60_000;
    vi.setSystemTime(clock);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    setActivePinia(createPinia());
    signIn();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    uninstall?.();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports an error thrown by a component once", () => {
    const Broken = defineComponent({
      name: "BrokenWidget",
      setup() {
        return () => {
          throw new Error("Cannot read properties of undefined");
        };
      },
    });
    const app = createApp({ render: () => h(Broken) });
    uninstall = installLogger(app);

    app.mount(document.createElement("div"));

    const reports = sentReports();
    expect(reports).toHaveLength(1);
    expect(reports[0]?.body).toMatchObject({
      level: "error",
      msg: "Cannot read properties of undefined",
      fields: { component: "BrokenWidget" },
    });
    expect(reports[0]?.body.fields?.stack).toContain("Error:");
  });

  it("reports an unhandled promise rejection once", () => {
    uninstall = installLogger(createApp({ render: () => null }));

    const event = new Event("unhandledrejection");
    Object.assign(event, { reason: new Error("Analysis poll failed") });
    window.dispatchEvent(event);

    const reports = sentReports();
    expect(reports).toHaveLength(1);
    expect(reports[0]?.body).toMatchObject({
      level: "error",
      msg: "Analysis poll failed",
    });
    expect(reports[0]?.body.fields?.stack).toContain("Analysis poll failed");
  });

  it("reports a rejection that is not an Error", () => {
    uninstall = installLogger(createApp({ render: () => null }));

    const event = new Event("unhandledrejection");
    Object.assign(event, { reason: "token refresh timed out" });
    window.dispatchEvent(event);

    expect(sentReports()[0]?.body.msg).toBe("token refresh timed out");
  });
});
