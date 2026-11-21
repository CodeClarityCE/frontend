import { describe, expect, it, vi } from "vitest";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import { useUserStore } from "@/stores/user";

import { createTestApp, type TestApp, user } from "../../tests/real-app";

import { LanguageDetectionService } from "./languageDetection";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

// A finished analysis; each test uses its own id, as the cache outlives a test.
const analysisWith = (id: string): Analysis =>
  ({
    id,
    steps: [[{ Name: "js-sbom", Status: AnalysisStatus.SUCCESS }]],
  }) as unknown as Analysis;

// A signed-in page whose analysis has a JavaScript SBOM with one dependency.
async function signedInWithSbom(): Promise<TestApp> {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", "/result", {
    data: {
      plugin: "js-sbom",
      result: { workspaces: { ".": { dependencies: { a: {} } } } },
    },
  });
  await app.visit("/projects");
  return app;
}

const resultRequests = (app: TestApp): number =>
  app.http.requests.filter((r) => r.path === "/result").length;

describe("LanguageDetectionService", () => {
  it("fetches an analysis's languages once for the same user", async () => {
    const app = await signedInWithSbom();
    const service = new LanguageDetectionService();
    const analysis = analysisWith("an-1");

    await service.detectProjectLanguages("o", "p", analysis, "t");
    const again = await service.detectProjectLanguages("o", "p", analysis, "t");

    expect(again.map((l) => l.name)).toEqual(["JavaScript"]);
    expect(resultRequests(app)).toBe(1);
    expect(
      app.http.requests.find((r) => r.path === "/result")?.query.get("type"),
    ).toBe("js-sbom");
  });

  it("fetches again once another user signs in", async () => {
    const app = await signedInWithSbom();
    const service = new LanguageDetectionService();
    const analysis = analysisWith("an-2");
    await service.detectProjectLanguages("o", "p", analysis, "t");

    useUserStore().setUser({ ...user, id: "another-user" } as never);
    await service.detectProjectLanguages("o", "p", analysis, "t");

    expect(resultRequests(app)).toBe(2);
  });

  it("finds no language when the SBOM has no dependencies", async () => {
    const app = await signedInWithSbom();
    app.http.on("GET", "/result", {
      data: { plugin: "js-sbom", result: { workspaces: { ".": {} } } },
    });

    const found = await new LanguageDetectionService().detectProjectLanguages(
      "o",
      "p",
      analysisWith("an-3"),
      "t",
    );

    expect(found).toEqual([]);
  });
});
