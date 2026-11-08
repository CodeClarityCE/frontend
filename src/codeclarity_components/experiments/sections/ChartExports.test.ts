import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";

import ChartExport from "../charts/ChartExport.vue";
import GridLineChart from "../charts/GridLineChart.vue";
import type { ExperimentResults as Results } from "../experiment.entity";

import ExperimentResults from "./ExperimentResults.vue";

const { saveBlob } = vi.hoisted(() => ({ saveBlob: vi.fn() }));

vi.mock("@/utils/download", () => ({ saveBlob }));
vi.mock("@/utils/toasts", () => ({ errorToast: vi.fn() }));

function lag(n: number, median: number, before = 0): object {
  return {
    n,
    median,
    p25: median - 5,
    p75: median + 5,
    min: median - 9,
    max: median + 9,
    before_disclosure: before,
  };
}

function days(n: number, median: number): object {
  return {
    n,
    median,
    p25: median - 5,
    p75: median + 5,
    min: median - 9,
    max: median + 9,
  };
}

function step(time: number, survival: number): object {
  return {
    time,
    survival,
    lower: survival - 0.1,
    upper: survival + 0.1,
    at_risk: 4,
    events: 1,
    censored: 0,
  };
}

function coverageRow(
  grid_date: string | null,
  failed = 0,
  skipped = 0,
): object {
  return {
    grid_date,
    runs: 4,
    done: 4 - failed - skipped,
    empty: 0,
    failed,
    skipped,
    pending: 0,
    mixed_knowledge: false,
  };
}

function kinds(fixes: number, unknown: number, share: number | null): object {
  return {
    fixes,
    upgraded: 0,
    removed_direct: 0,
    removed_transitive: fixes - unknown,
    unknown,
    removed_transitive_share: share,
    snapshot_precision_share: null,
  };
}

function results(overrides: object = {}): Results {
  const scalars = {
    n_projects: 4,
    n_affected: 2,
    affected_share: 0.5,
    instances: 10,
    distinct_vuln_packages: 3,
    load_median: 1,
    load_mean: 1,
    load_max: 2,
    high_critical_share: 0.5,
    top10_pkg_share: 0.5,
    top10_proj_share: 0.5,
    gini_pkg: 0.5,
    gini_proj: 0.5,
    pkgs_clear_50: 1,
    pkgs_clear_80: 2,
    pkgs_clear_90: 2,
  };
  return {
    coverage: {
      runs: 8,
      attempted: 8,
      done: 5,
      failed: 2,
      skipped: 1,
      pending: 0,
      failure_reasons: {},
      skip_reasons: {},
    },
    grid_coverage: [coverageRow("2026-09-01", 2, 1), coverageRow(null)],
    headline: {
      ...scalars,
      sev_counts: { CRITICAL: 1, HIGH: 1, MEDIUM: 1, LOW: 1, NONE: 1 },
      top_packages: [],
      high_critical_share_of_classed: 0.5,
    },
    sweep: [],
    epss: {
      nonnull_share: 0.5,
      median: 0.1,
      p90: 0.2,
      over_10pct: 1,
      over_50pct: 0,
      missing_non_cve: 0,
      missing_cve: 0,
    },
    match_flags: {},
    winning_source_head: {},
    rqc: { spearman_rho: 0.1, p: 0.5, n: 4, excluded_zero_dep_projects: 0 },
    rqd: [],
    exposures: {
      exposures: 5,
      open: 2,
      fixed: 3,
      introductions: 1,
      present_at_first_observation: 4,
      fix_precision: { commit: 0, snapshot: 3 },
      introduction_precision: { commit: 0, snapshot: 1 },
    },
    fix_lag: {
      fixes: 4,
      snapshot_precision_share: null,
      overall: lag(3, 46, 1),
      by_severity: [
        { key: "HIGH", ...lag(2, 80) },
        { key: "LOW", ...lag(1, -13, 1) },
      ],
      by_kind: [{ key: "upgraded", ...lag(3, 46, 1) }],
      points: [
        {
          severity: "HIGH",
          kind: "upgraded",
          lag_days: 46,
          precision: "commit",
        },
        {
          severity: "HIGH",
          kind: "upgraded",
          lag_days: 114,
          precision: "commit",
        },
        {
          severity: "LOW",
          kind: "upgraded",
          lag_days: -13,
          precision: "commit",
        },
      ],
    },
    residence: {
      introductions: 5,
      snapshot_precision_share: null,
      present_at_first_observation: 4,
      undated: 1,
      overall: days(3, 40),
      by_severity: [{ key: "HIGH", ...days(3, 40) }],
      points: [
        { severity: "HIGH", residence_days: 40, precision: "commit" },
        { severity: "HIGH", residence_days: 30, precision: "commit" },
        { severity: "HIGH", residence_days: 50, precision: "commit" },
      ],
      after_disclosure: days(1, 99),
      after_disclosure_by_severity: [],
    },
    exposure_survival: {
      censored_at: "2026-10-01",
      snapshot_precision_share: null,
      overall: {
        key: "all",
        n: 4,
        fixed: 2,
        censored: 2,
        median_days: 50,
        curve: [step(24, 0.75), step(50, 0.5)],
      },
      by_severity: [],
    },
    upstream_leverage: {
      packages_to_clear: [
        {
          grid_date: "2026-09-01",
          projects: 0,
          instances: 0,
          distinct_packages: 0,
          pkgs_clear_50: null,
          pkgs_clear_80: null,
        },
        {
          grid_date: null,
          projects: 2,
          instances: 40,
          distinct_packages: 4,
          pkgs_clear_50: 2,
          pkgs_clear_80: 4,
        },
      ],
      fix_kinds: [
        {
          interval_from: "2026-09-01",
          interval_to: null,
          ...kinds(6, 2, 0.5),
        },
      ],
      overall: kinds(6, 2, 0.5),
    },
    load_over_time: [
      {
        grid_date: "2026-09-01",
        as_of_date: "2026-09-01",
        projects: 2,
        hindsight: 5,
        as_of: 3,
        undated: 1,
      },
      {
        grid_date: null,
        as_of_date: "2026-10-01",
        projects: 3,
        hindsight: 9,
        as_of: 7,
        undated: 0,
      },
    ],
    provenance: {
      api_version: "v1",
      analyzer_steps: null,
      knowledge_start: null,
      knowledge_end: null,
      knowledge_changed: false,
      created_by: "John Doe",
      created_on: "2026-11-01T10:00:00Z",
      started_on: null,
      ended_on: null,
    },
    ...overrides,
  } as unknown as Results;
}

function mountResults(overrides: object = {}): VueWrapper {
  return mount(ExperimentResults, {
    props: { results: results(overrides) } as never,
  });
}

function lastSaved(): { blob: Blob; name: string } {
  const [blob, name] = saveBlob.mock.calls.at(-1) as [Blob, string];
  return { blob, name };
}

async function click(wrapper: VueWrapper, selector: string): Promise<void> {
  await wrapper.find(selector).trigger("click");
  await flushPromises();
}

async function savedCsv(wrapper: VueWrapper, block: string): Promise<string> {
  await click(wrapper, `[data-testid="${block}"] [data-testid="export-csv"]`);
  return lastSaved().blob.text();
}

const EVERY_CHART = [
  "experiment-load",
  "fix-lag-by-severity",
  "fix-lag-by-kind",
  "experiment-survival",
  "residence-by-severity",
  "leverage-packages-to-clear",
  "leverage-transitive-share",
];

describe("experiment chart export", () => {
  beforeEach(() => {
    saveBlob.mockReset();
  });

  it.each(EVERY_CHART)("offers every export on %s", (block) => {
    const wrapper = mountResults();
    for (const button of ["svg", "png", "csv", "caption"]) {
      expect(
        wrapper
          .find(`[data-testid="${block}"] [data-testid="export-${button}"]`)
          .exists(),
      ).toBe(true);
    }
  });

  it("writes plotted load values with empty cells for missing ones", async () => {
    const wrapper = mountResults();
    expect(await savedCsv(wrapper, "experiment-load")).toBe(
      [
        "grid_date,as_of_date,projects,hindsight,as_of,undated",
        "2026-09-01,2026-09-01,2,5,3,1",
        "HEAD,2026-10-01,3,9,7,0",
        "",
      ].join("\n"),
    );
  });

  it("writes one row per dot of a lag chart, keeping negative lags numeric", async () => {
    const wrapper = mountResults();
    expect(await savedCsv(wrapper, "fix-lag-by-severity")).toBe(
      [
        "group,lag_days,group_n,group_median,group_p25,group_p75",
        "High,46,2,80,75,85",
        "High,114,2,80,75,85",
        "Low,-13,1,-13,-18,-8",
        "",
      ].join("\n"),
    );
  });

  it("writes one column per line of a grid chart", async () => {
    const wrapper = mountResults();
    expect(await savedCsv(wrapper, "leverage-packages-to-clear")).toBe(
      ["Grid date,Clear 50%,Clear 80%", "2026-09-01,,", "HEAD,2,4", ""].join(
        "\n",
      ),
    );
  });

  it("includes the survival band in the survival CSV", async () => {
    const wrapper = mountResults();
    const csv = await savedCsv(wrapper, "experiment-survival");
    expect(csv.split("\n")[0]).toBe(
      "time_days,survival,lower,upper,at_risk,events,censored,median_days",
    );
    expect(csv.split("\n")[1]).toBe("0,1,1,1,4,0,0,50");
    expect(csv.split("\n")[2]).toBe("24,0.75,0.65,0.85,4,1,0,50");
  });

  it("quotes text cells and stops spreadsheets running them as formulas", async () => {
    const wrapper = mountResults({
      fix_lag: {
        fixes: 3,
        snapshot_precision_share: null,
        overall: lag(3, 46, 1),
        by_severity: [
          { key: '=HYPERLINK("http://x","a,b")', ...lag(1, 1) },
          { key: "@org/repo", ...lag(1, 2) },
          { key: "+1", ...lag(1, 3) },
          { key: "-1", ...lag(1, 4) },
          { key: "plain, name", ...lag(1, 5) },
          { key: 'say "hi"', ...lag(1, 6) },
          { key: "\tindented", ...lag(1, 7) },
        ],
        by_kind: [],
        points: [
          '=HYPERLINK("http://x","a,b")',
          "@org/repo",
          "+1",
          "-1",
          "plain, name",
          'say "hi"',
          "\tindented",
        ].map((severity, i) => ({
          severity,
          kind: null,
          lag_days: -i,
          precision: "commit",
        })),
      },
    });

    const lines = (await savedCsv(wrapper, "fix-lag-by-severity")).split("\n");

    expect(lines.slice(1, 8).map((line) => line.split(",-")[0])).toEqual([
      `"'=HYPERLINK(""http://x"",""a,b"")",0,1,1,-4,6`.split(",-")[0],
      "'@org/repo",
      "'+1",
      "'-1",
      '"plain, name"',
      '"say ""hi"""',
      "'\tindented",
    ]);
    // Numbers are left as numbers
    expect(lines[2]).toBe("'@org/repo,-1,1,2,-3,7");
  });

  async function exportedSvg(
    wrapper: VueWrapper,
    block: string,
  ): Promise<Element> {
    await click(wrapper, `[data-testid="${block}"] [data-testid="export-svg"]`);
    const text = await lastSaved().blob.text();
    return new DOMParser().parseFromString(text, "image/svg+xml")
      .documentElement;
  }

  async function choosePreset(
    wrapper: VueWrapper,
    block: string,
    preset: "single" | "double",
  ): Promise<void> {
    await wrapper
      .find(`[data-testid="${block}"] [data-testid="export-preset"]`)
      .setValue(preset);
  }

  function captionOf(wrapper: VueWrapper, block: string): string {
    return wrapper
      .find(`[data-testid="${block}"] [data-testid="export-caption"]`)
      .text();
  }

  describe("captions", () => {
    it("states n and the exclusions taken from the data", () => {
      const caption = captionOf(mountResults(), "fix-lag-by-severity");
      expect(caption).toContain("n = 3 fixes");
      expect(caption).toContain("1 fix without a disclosure date");
      expect(caption).toContain("2 snapshots failed");
      expect(caption).toContain("1 snapshot skipped");
      expect(caption).not.toContain("approximat");
    });

    it("says so when nothing was excluded", () => {
      const caption = captionOf(
        mountResults({
          grid_coverage: [coverageRow("2026-09-01"), coverageRow(null)],
        }),
        "experiment-survival",
      );
      expect(caption).toContain("n = 4 exposures, 2 fixed, 2 censored");
      expect(caption).toContain("No exclusions.");
    });

    it("states the residence and leverage exclusions", () => {
      const wrapper = mountResults();
      const residence = captionOf(wrapper, "residence-by-severity");
      expect(residence).toContain("n = 3 introductions");
      expect(residence).toContain("1 introduction after disclosure");
      expect(residence).toContain("1 introduction without a disclosure date");
      expect(residence).toContain("4 exposures present at the first grid date");
      expect(captionOf(wrapper, "leverage-transitive-share")).toContain(
        "n = 4 fixes of known kind",
      );
      expect(captionOf(wrapper, "leverage-transitive-share")).toContain(
        "2 fixes of unknown kind",
      );
      expect(captionOf(wrapper, "leverage-packages-to-clear")).toContain(
        "1 grid date without a done snapshot",
      );
    });

    it("states the approximation on as-of captions", () => {
      const caption = captionOf(mountResults(), "experiment-load");
      expect(caption).toContain("n = 2 to 3 projects");
      expect(caption).toContain("approximates");
      expect(caption).toContain(
        "withdrawn, re-scored or with a widened affected range",
      );
    });

    it("downloads the caption as text", async () => {
      const wrapper = mountResults();
      await click(
        wrapper,
        '[data-testid="experiment-load"] [data-testid="export-caption-file"]',
      );
      expect(lastSaved().name).toBe("load-over-time-caption.txt");
      expect(await lastSaved().blob.text()).toBe(
        captionOf(wrapper, "experiment-load"),
      );
    });
  });

  describe("width presets", () => {
    it.each([
      ["single", "3.5in", "320"],
      ["double", "7in", "640"],
    ] as const)(
      "lays the figure out for the %s column width",
      async (preset, width, viewWidth) => {
        const wrapper = mountResults();
        await choosePreset(wrapper, "fix-lag-by-severity", preset);

        const svg = await exportedSvg(wrapper, "fix-lag-by-severity");

        expect(svg.getAttribute("width")).toBe(width);
        expect(svg.getAttribute("viewBox")?.split(" ")[2]).toBe(viewWidth);
      },
    );

    it.each(["single", "double"] as const)(
      "keeps every label at least 7 pt tall at the %s column width",
      async (preset) => {
        const wrapper = mountResults();
        await choosePreset(wrapper, "experiment-load", preset);

        const svg = await exportedSvg(wrapper, "experiment-load");

        const inches = parseFloat(svg.getAttribute("width")!);
        const viewWidth = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
        const pointsPerUnit = (inches * 72) / viewWidth;
        const sizes = [...svg.querySelectorAll("text")].map(
          (text) => Number(text.getAttribute("font-size")) * pointsPerUnit,
        );
        expect(sizes.length).toBeGreaterThan(0);
        expect(Math.min(...sizes)).toBeGreaterThanOrEqual(7);
      },
    );

    it("leaves the chart on the page at its normal width", async () => {
      const wrapper = mountResults();
      await choosePreset(wrapper, "experiment-load", "single");
      await exportedSvg(wrapper, "experiment-load");
      await flushPromises();

      expect(
        wrapper
          .find('[data-testid="experiment-load"] svg[role="group"]')
          .attributes("viewBox"),
      ).toBe("0 0 640 240");
    });
  });

  it("keeps the survival median label inside the figure when the median is far right", async () => {
    const svg = await exportedSvg(mountResults(), "experiment-survival");
    const label = [...svg.querySelectorAll("text")].find((t) =>
      t.textContent?.includes("median 50 days"),
    );
    expect(label?.getAttribute("text-anchor")).toBe("end");
  });

  describe("legends", () => {
    it("draws an HTML legend into the exported figure", async () => {
      const svg = await exportedSvg(mountResults(), "experiment-load");

      const labels = [...svg.querySelectorAll("text")].map((t) =>
        t.textContent?.trim(),
      );
      expect(labels).toContain("Hindsight");
      expect(labels).toContain("As-of");
      // The legend sits above the plot, inside the figure
      const minY = Number(svg.getAttribute("viewBox")!.split(" ")[1]);
      expect(minY).toBeLessThan(0);
      const legendText = [...svg.querySelectorAll("text")].find(
        (t) => t.textContent?.trim() === "Hindsight",
      )!;
      expect(Number(legendText.getAttribute("y"))).toBeGreaterThan(minY);
      expect(Number(legendText.getAttribute("y"))).toBeLessThan(0);
    });

    it("exports the chart itself, not a legend swatch", async () => {
      const svg = await exportedSvg(
        mountResults(),
        "leverage-packages-to-clear",
      );
      expect(svg.getAttribute("viewBox")).toMatch(/ 640 /);
    });

    it("wraps a legend that is too wide for the column", async () => {
      const series = ["A long series label", "Another long series label"].map(
        (label, i) => ({
          key: label,
          label,
          values: [1, 2],
          color: `var(--viz-series-${i + 1})`,
        }),
      );
      const wrapper = mount(ChartExport, {
        props: {
          name: "wide",
          data: { columns: [], rows: [] },
          caption: { description: "Wide", n: "n = 1" },
        },
        slots: {
          default: () =>
            h(GridLineChart, {
              labels: ["a", "b"],
              series,
              yMax: 2,
              formatY: String,
              describe: String,
              caption: "Wide",
              xTitle: "x",
            }),
        },
      });
      await wrapper.find('[data-testid="export-preset"]').setValue("single");
      await click(wrapper, '[data-testid="export-svg"]');
      const svg = new DOMParser().parseFromString(
        await lastSaved().blob.text(),
        "image/svg+xml",
      ).documentElement;

      const y = (label: string): string | null =>
        [...svg.querySelectorAll("text")]
          .find((t) => t.textContent === label)!
          .getAttribute("y");
      expect(y("A long series label")).not.toBe(y("Another long series label"));
    });
  });

  describe("print styling", () => {
    function gray(hex: string): number {
      const [r, g, b] = [1, 3, 5].map((i) =>
        parseInt(hex.slice(i, i + 2), 16),
      ) as [number, number, number];
      return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    it("keeps series apart in grayscale by shade and line pattern", async () => {
      const svg = await exportedSvg(mountResults(), "experiment-load");

      const lines = [...svg.querySelectorAll('path[fill="none"]')];
      expect(lines).toHaveLength(2);
      const [first, second] = lines as [Element, Element];
      expect(
        Math.abs(
          gray(first.getAttribute("stroke")!) -
            gray(second.getAttribute("stroke")!),
        ),
      ).toBeGreaterThan(40);
      expect(first.getAttribute("stroke-dasharray")).toBeNull();
      expect(second.getAttribute("stroke-dasharray")).toBeTruthy();
    });

    it("gives the legend swatches the same line pattern as their series", async () => {
      const svg = await exportedSvg(mountResults(), "experiment-load");
      const dashed = svg.querySelector('path[fill="none"][stroke-dasharray]')!;
      const swatch = [...svg.querySelectorAll("line")].find(
        (line) =>
          line.getAttribute("stroke") === dashed.getAttribute("stroke") &&
          line.getAttribute("stroke-dasharray") ===
            dashed.getAttribute("stroke-dasharray"),
      );
      expect(swatch).toBeTruthy();
    });

    it.each([
      ["experiment-load", "load-column"],
      ["leverage-packages-to-clear", "line-column"],
      ["fix-lag-by-severity", "lag-hit"],
    ])("leaves hover targets out of %s", async (block, hit) => {
      const wrapper = mountResults();
      await wrapper
        .find(`[data-testid="${block}"] [data-testid="${hit}"]`)
        .trigger("pointerenter");

      const svg = await exportedSvg(wrapper, block);

      expect(svg.querySelector('[fill="transparent"]')).toBeNull();
    });
  });

  describe("PNG", () => {
    // A valid signature and IHDR, enough to hold the density chunk after it
    const PNG = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48,
      0x44, 0x52, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4, 0x89,
      0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    let drawn: { width: number; height: number }[];

    beforeEach(() => {
      drawn = [];
      vi.stubGlobal(
        "Image",
        class {
          onload: (() => void) | null = null;
          set src(_: string) {
            void Promise.resolve().then(() => this.onload?.());
          }
        },
      );
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
        function (this: HTMLCanvasElement) {
          return {
            fillStyle: "",
            fillRect: vi.fn(),
            drawImage: () =>
              drawn.push({ width: this.width, height: this.height }),
          } as never;
        } as never,
      );
      vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
        (callback) => callback(new Blob([PNG], { type: "image/png" })),
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it.each([
      ["single", 1050],
      ["double", 2100],
    ] as const)(
      "rasterises the %s column width at 300 dpi",
      async (preset, width) => {
        const wrapper = mountResults();
        await choosePreset(wrapper, "experiment-survival", preset);

        await click(
          wrapper,
          '[data-testid="experiment-survival"] [data-testid="export-png"]',
        );

        expect(drawn.at(-1)?.width).toBe(width);
        const { name, blob } = lastSaved();
        expect(name).toBe("exposure-survival-all.png");
        expect(blob.type).toBe("image/png");
      },
    );

    it("records 300 dpi in the file", async () => {
      const wrapper = mountResults();
      await click(
        wrapper,
        '[data-testid="experiment-survival"] [data-testid="export-png"]',
      );

      const bytes = new Uint8Array(await lastSaved().blob.arrayBuffer());
      // 11811 pixels per metre on both axes, unit metre, then its checksum
      expect([...bytes.slice(33, 54)]).toEqual([
        0, 0, 0, 9, 0x70, 0x48, 0x59, 0x73, 0, 0, 0x2e, 0x23, 0, 0, 0x2e, 0x23,
        1, 0x78, 0xa5, 0x3f, 0x76,
      ]);
      expect([...bytes.slice(0, 33)]).toEqual([...PNG.slice(0, 33)]);
      expect([...bytes.slice(54)]).toEqual([...PNG.slice(33)]);
    });
  });
});
