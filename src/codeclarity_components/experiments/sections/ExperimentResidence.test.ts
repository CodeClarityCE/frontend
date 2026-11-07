import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { ResidenceBlock } from "../experiment.entity";

import ExperimentResidence from "./ExperimentResidence.vue";

function days(n: number, median: number): object {
  return { n, median, p25: median - 10, p75: median + 10, min: median - 20, max: median + 20 };
}

function residence(overrides: Partial<ResidenceBlock> = {}): ResidenceBlock {
  return {
    introductions: 5,
    snapshot_precision_share: 0.8,
    present_at_first_observation: 4,
    undated: 1,
    overall: days(3, 40),
    by_severity: [
      { key: "CRITICAL", ...days(1, 88) },
      { key: "HIGH", ...days(2, 20) },
    ],
    points: [
      { severity: "CRITICAL", residence_days: 88, precision: "snapshot" },
      { severity: "HIGH", residence_days: 0, precision: "commit" },
      { severity: "HIGH", residence_days: 40, precision: "snapshot" },
    ],
    after_disclosure: days(1, 99),
    after_disclosure_by_severity: [{ key: "HIGH", ...days(1, 99) }],
    ...overrides,
  } as ResidenceBlock;
}

describe("ExperimentResidence", () => {
  it("charts residence by severity with the precision share and a table view", () => {
    const wrapper = mount(ExperimentResidence, { props: { residence: residence() } });

    expect(wrapper.text()).toContain("5 introductions");
    expect(wrapper.text()).toContain("4 exposures present at the first grid date have no introduction");
    expect(wrapper.text()).toContain("80.0% dated only to a snapshot interval");

    const chart = wrapper.find('[data-testid="residence-by-severity"]');
    const rows = chart.findAll('[data-testid="lag-row"]');
    expect(rows.map((row) => row.attributes("data-key"))).toEqual(["CRITICAL", "HIGH"]);
    expect(rows.map((row) => row.findAll('[data-testid="lag-dot"]').length)).toEqual([1, 2]);
    expect(rows[1]!.attributes("aria-label")).toBe("High: 2 introductions, median 20 days");
    expect(
      chart.findAll('[data-testid="lag-table-row"]').map((row) => row.findAll("td").map((cell) => cell.text())),
    ).toEqual([
      ["Critical", "1", "88", "78", "98"],
      ["High", "2", "20", "10", "30"],
    ]);
  });

  it("shows a dot's residence on hover", async () => {
    const wrapper = mount(ExperimentResidence, { props: { residence: residence() } });
    const chart = wrapper.find('[data-testid="residence-by-severity"]');

    await chart.findAll('[data-testid="lag-hit"]')[2]!.trigger("pointerenter");
    expect(chart.find('[data-testid="lag-tooltip"]').text()).toBe("High: introduced 40 days before disclosure");

    await chart.findAll('[data-testid="lag-hit"]')[1]!.trigger("pointerenter");
    expect(chart.find('[data-testid="lag-tooltip"]').text()).toBe("High: introduced on the day of disclosure");
  });

  it("reports introductions after disclosure apart, not as negative residence", () => {
    const wrapper = mount(ExperimentResidence, { props: { residence: residence() } });

    const after = wrapper.find('[data-testid="residence-after-disclosure"]');
    expect(after.text()).toContain("1 introduction adopted a version already known to be vulnerable");
    expect(
      after.findAll('[data-testid="residence-after-row"]').map((row) => row.findAll("td").map((cell) => cell.text())),
    ).toEqual([["High", "1", "99"]]);
    const chart = wrapper.find('[data-testid="residence-by-severity"]');
    expect(chart.findAll('[data-testid="lag-dot"]')).toHaveLength(3);
  });

  it("says when no introduction has a residence and none came after disclosure", () => {
    const empty = { n: 0, median: null, p25: null, p75: null, min: null, max: null };
    const wrapper = mount(ExperimentResidence, {
      props: {
        residence: residence({
          introductions: 0,
          snapshot_precision_share: null,
          undated: 0,
          overall: empty,
          by_severity: [],
          points: [],
          after_disclosure: empty,
          after_disclosure_by_severity: [],
        }),
      },
    });

    expect(wrapper.find('[data-testid="residence-by-severity"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="residence-after-disclosure"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("No introductions before disclosure yet.");
  });
});
