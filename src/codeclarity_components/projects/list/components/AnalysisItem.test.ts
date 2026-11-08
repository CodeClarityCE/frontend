import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";

import AnalysisItem from "./AnalysisItem.vue";

vi.mock("@/codeclarity_components/analyses/analysis.repository", () => ({
  AnalysisRepository: class {
    getAnalysisChartById = vi.fn().mockResolvedValue({ data: [] });
    deleteAnalysis = vi.fn();
  },
}));
vi.mock("@/router", () => ({ default: { go: vi.fn() } }));
vi.mock("./AnalysisRuns.vue", () => ({ default: { template: "<div />" } }));

const slotStub = { template: "<div><slot /></div>" };

function render(overrides: Record<string, unknown>) {
  const analysis = {
    id: "analysis-1",
    created_on: new Date("2026-01-01T00:00:00Z"),
    analyzer: {},
    status: AnalysisStatus.FAILURE,
    steps: [],
    branch: "main",
    ...overrides,
  } as unknown as Analysis;
  return mount(AnalysisItem, {
    props: { analysis, projectID: "project-1" },
    global: {
      stubs: {
        Icon: true,
        RouterLink: slotStub,
        Popover: slotStub,
        PopoverTrigger: slotStub,
        PopoverContent: slotStub,
        Dialog: true,
      },
    },
  });
}

describe("AnalysisItem", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("shows why an analysis failed", () => {
    const wrapper = render({
      failure_reason: "php-sbom failed: bad composer.lock",
    });
    expect(wrapper.text()).toContain("php-sbom failed: bad composer.lock");
  });

  it("says when a failed analysis has no recorded reason", () => {
    expect(render({}).text()).toContain("No reason was recorded");
  });

  it("shows no failure text on a completed analysis", () => {
    const wrapper = render({ status: AnalysisStatus.COMPLETED });
    expect(wrapper.text()).not.toContain("No reason was recorded");
  });

  it("shows a skipped plugin and why, apart from failed ones", () => {
    const wrapper = render({
      status: AnalysisStatus.COMPLETED,
      steps: [
        [
          {
            Name: "js-sbom",
            Status: AnalysisStatus.SKIPPED,
            Result: {
              skip_reason: "does not apply to the detected languages: php",
            },
          },
        ],
      ],
    });
    expect(wrapper.text()).toContain("Skipped");
    expect(wrapper.text()).toContain(
      "does not apply to the detected languages: php",
    );
    expect(wrapper.text()).not.toContain("Pending");
    expect(wrapper.text()).not.toContain("Failed");
  });

  it("counts skipped plugins as done in the progress", () => {
    const wrapper = render({
      status: AnalysisStatus.STARTED,
      steps: [
        [
          { Name: "js-sbom", Status: AnalysisStatus.SKIPPED },
          { Name: "php-sbom", Status: AnalysisStatus.STARTED },
        ],
      ],
    });
    expect(wrapper.text()).toContain("1 of 2 steps completed");
  });
});
