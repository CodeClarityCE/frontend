import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { ExposuresBlock, ProbesBlock } from "../experiment.entity";

import ExperimentProbes from "./ExperimentProbes.vue";

const probes: ProbesBlock = {
  fixes: { found: 6, ambiguous: 1, not_found: 2, not_probed: 1 },
  introductions: { found: 3, ambiguous: 0, not_found: 1, not_probed: 0 },
  not_found_reasons: {
    "no lockfile-touching commit in the interval": 2,
    "probe of d4e1234 failed: clone failed": 1,
  },
};

const exposures: ExposuresBlock = {
  exposures: 12,
  open: 2,
  fixed: 10,
  introductions: 4,
  present_at_first_observation: 8,
  fix_precision: { commit: 6, snapshot: 4 },
  introduction_precision: { commit: 3, snapshot: 1 },
};

describe("ExperimentProbes", () => {
  it("counts probe outcomes and dating precision for fixes and introductions", () => {
    const wrapper = mount(ExperimentProbes, { props: { probes, exposures } });

    const rows = wrapper.findAll('[data-testid="probe-outcome-row"]');
    expect(
      rows.map((row) => row.findAll("td").map((cell) => cell.text())),
    ).toEqual([
      ["Fixes", "6", "1", "2", "1", "60.0%", "40.0%"],
      ["Introductions", "3", "0", "1", "0", "75.0%", "25.0%"],
    ]);
  });

  it("lists why probes found no commit, most frequent first", () => {
    const wrapper = mount(ExperimentProbes, { props: { probes, exposures } });

    expect(
      wrapper
        .findAll('[data-testid="probe-reason"]')
        .map((item) => item.text()),
    ).toEqual([
      "no lockfile-touching commit in the interval: 2",
      "probe of d4e1234 failed: clone failed: 1",
    ]);
  });

  it("shows the analysis budget and how much of it was submitted", () => {
    const wrapper = mount(ExperimentProbes, {
      props: {
        probes: {
          ...probes,
          budget: {
            analysis_budget: 150,
            analyses_submitted: 150,
            spent: true,
          },
        },
        exposures,
      },
    });

    expect(wrapper.find('[data-testid="probe-budget"]').text()).toBe(
      "Analysis budget: 150 of 150 analyses submitted. Spent: no further fix probe runs.",
    );
  });

  it("shows no budget line for an experiment without one", () => {
    const wrapper = mount(ExperimentProbes, {
      props: {
        probes: {
          ...probes,
          budget: {
            analysis_budget: null,
            analyses_submitted: null,
            spent: false,
          },
        },
        exposures,
      },
    });

    expect(wrapper.find('[data-testid="probe-budget"]').exists()).toBe(false);
  });

  it("shows a dash for the precision share without events", () => {
    const wrapper = mount(ExperimentProbes, {
      props: {
        probes: {
          ...probes,
          introductions: {
            found: 0,
            ambiguous: 0,
            not_found: 0,
            not_probed: 0,
          },
          not_found_reasons: {},
        },
        exposures: {
          ...exposures,
          introduction_precision: { commit: 0, snapshot: 0 },
        },
      },
    });

    const cells = wrapper
      .findAll('[data-testid="probe-outcome-row"]')[1]!
      .findAll("td");
    expect(cells.map((cell) => cell.text()).slice(5)).toEqual(["-", "-"]);
    expect(wrapper.find('[data-testid="probe-reasons"]').exists()).toBe(false);
  });
});
