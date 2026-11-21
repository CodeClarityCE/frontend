import { fireEvent, render, screen, within } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";

import ChartExport from "./ChartExport.vue";
import ColumnChart from "./ColumnChart.vue";
import GridLineChart from "./GridLineChart.vue";

const { saveBlob } = vi.hoisted(() => ({ saveBlob: vi.fn() }));
vi.mock("@/utils/download", () => ({ saveBlob }));

afterEach(() => saveBlob.mockReset());

function renderChart(color = "var(--viz-series-1)"): void {
  render(ChartExport, {
    props: {
      name: "fixes",
      data: {
        columns: ["Month", "Fixes"],
        rows: [
          ["Jan", 3],
          ["Feb", 5],
        ],
      },
      caption: { description: "Fixes per month", n: "n = 8 fixes" },
    },
    slots: {
      default: () =>
        h(GridLineChart, {
          labels: ["Jan", "Feb"],
          series: [
            { key: "a", label: "Fixes", values: [3, 5], color },
            { key: "b", label: "Reverts", values: [1, 2], color },
          ],
          yMax: 5,
          formatY: String,
          describe: (i: number) => `Month ${i + 1}`,
          caption: "Fixes per month",
          xTitle: "Month",
        }),
    },
  });
}

async function exportedSvg(): Promise<string> {
  await fireEvent.click(screen.getByRole("button", { name: "Download SVG" }));
  await vi.waitFor(() => expect(saveBlob).toHaveBeenCalled());
  return (saveBlob.mock.calls[0]![0] as Blob).text();
}

describe("shared chart layer", () => {
  it("names the chart by its caption for screen readers", () => {
    renderChart();

    const chart = screen.getByRole("figure", { name: /Fixes per month/ });
    expect(chart).toHaveTextContent("n = 8 fixes. No exclusions.");
  });

  it("keeps the plotted values in a table behind Show table", async () => {
    renderChart();

    await fireEvent.click(screen.getByText("Show table"));

    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "Reverts" }),
    ).toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(3);
  });

  it.each([
    "var(--viz-series-1)",
    "var(--viz-severity-critical)",
    "var(--viz-severity-low)",
    "var(--viz-severity-medium-stroke)",
    "var(--viz-severity-low-stroke)",
    "var(--viz-status-success)",
    "var(--viz-status-danger)",
  ])("exports a chart drawn in %s with every colour resolved", async (role) => {
    renderChart(role);

    const svg = await exportedSvg();

    expect(svg).not.toContain("var(");
    expect(svg).toMatch(/stroke="#[0-9a-f]{6}"/i);
  });

  it("exports severity columns with the outlines of light colours resolved", async () => {
    const levels = ["critical", "high", "medium", "low"];
    render(ChartExport, {
      props: {
        name: "severity",
        data: { columns: ["Severity", "Count"], rows: [] },
        caption: { description: "Vulnerabilities by severity", n: "n = 10" },
      },
      slots: {
        default: () =>
          h(ColumnChart, {
            labels: levels,
            series: [
              {
                key: "count",
                label: "Vulnerabilities",
                values: [1, 2, 3, 4],
                color: "var(--viz-series-1)",
                colors: levels.map((l) => `var(--viz-severity-${l})`),
                strokes: [
                  undefined,
                  undefined,
                  "var(--viz-severity-medium-stroke)",
                  "var(--viz-severity-low-stroke)",
                ],
              },
            ],
            yMax: 4,
            formatY: String,
            describe: (i: number) => levels[i]!,
            caption: "Vulnerabilities by severity",
            xTitle: "Severity",
          }),
      },
    });

    const svg = await exportedSvg();

    expect(svg).not.toContain("var(");
    const outlined = [...svg.matchAll(/<path[^>]*\bstroke="#[0-9a-f]{6}"/gi)];
    expect(outlined).toHaveLength(2);
  });
});
