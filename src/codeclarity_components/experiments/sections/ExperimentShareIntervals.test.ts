import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ExperimentFixLag from "./ExperimentFixLag.vue";
import ExperimentResidence from "./ExperimentResidence.vue";
import ExperimentSurvival from "./ExperimentSurvival.vue";
import ExperimentUpstreamLeverage from "./ExperimentUpstreamLeverage.vue";

const INTERVAL = { low: 0.2, high: 0.4 };
const SUMMARY = {
  n: 0,
  median: null,
  p25: null,
  p75: null,
  min: null,
  max: null,
  before_disclosure: 0,
};
const FIX_KINDS = {
  fixes: 2,
  upgraded: 1,
  removed_direct: 0,
  removed_transitive: 1,
  unknown: 0,
  removed_transitive_share: 0.5,
  snapshot_precision_share: 0.25,
};

describe("share intervals on the result blocks", () => {
  it("shows the fix lag snapshot share's interval", () => {
    const wrapper = mount(ExperimentFixLag, {
      props: {
        fixLag: {
          fixes: 2,
          snapshot_precision_share: 0.25,
          overall: SUMMARY,
          by_severity: [],
          by_kind: [],
          points: [],
        },
        exposures: null,
        snapshotInterval: INTERVAL,
      },
    });
    expect(wrapper.text()).toContain("25.0% (95% CI 20.0% to 40.0%)");
  });

  it("shows the residence snapshot share's interval", () => {
    const wrapper = mount(ExperimentResidence, {
      props: {
        residence: {
          introductions: 2,
          snapshot_precision_share: 0.25,
          present_at_first_observation: 0,
          undated: 0,
          overall: SUMMARY,
          after_disclosure: SUMMARY,
          by_severity: [],
          after_disclosure_by_severity: [],
          points: [],
        },
        snapshotInterval: INTERVAL,
      },
    });
    expect(wrapper.text()).toContain("25.0% (95% CI 20.0% to 40.0%)");
  });

  it("shows the survival snapshot share's interval", () => {
    const wrapper = mount(ExperimentSurvival, {
      props: {
        survival: {
          censored_at: "2026-01-01",
          snapshot_precision_share: 0.25,
          overall: {
            key: "all",
            n: 1,
            fixed: 1,
            censored: 0,
            median_days: 1,
            curve: [],
          },
          by_severity: [],
        },
        snapshotInterval: INTERVAL,
      },
    });
    expect(wrapper.text()).toContain("25.0% (95% CI 20.0% to 40.0%)");
  });

  it("shows the removed_transitive and snapshot intervals, per interval too", () => {
    const wrapper = mount(ExperimentUpstreamLeverage, {
      props: {
        leverage: {
          packages_to_clear: [],
          fix_kinds: [
            { interval_from: "2025-01-01", interval_to: null, ...FIX_KINDS },
          ],
          overall: FIX_KINDS,
        },
        shareIntervals: {
          overall: INTERVAL,
          by_interval: [{ low: 0.1, high: 0.9 }],
        },
        snapshotInterval: INTERVAL,
      },
    });
    const text = wrapper
      .find('[data-testid="leverage-transitive-share"]')
      .text();
    expect(text).toContain("50.0% (95% CI 20.0% to 40.0%) of 2 fixes");
    expect(text).toContain("10.0% to 90.0%");
    expect(text).toContain("25.0% (95% CI 20.0% to 40.0%) of fixes dated");
  });
});
