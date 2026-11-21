import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import LicenseDist from "@/codeclarity_components/dashboard/charts/LicenseDist.vue";

import { createTestApp, org } from "../../../../real-app";

// Runs against real stores and the real router; only HTTP is faked.
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});

// The chart on the dashboard, with the license counts the API answers.
async function mountChart(counts: Record<string, number>) {
  const app = createTestApp({ signedIn: true });
  app.http.on("GET", `/org/${org.id}/dashboard/overall_license_dist`, {
    data: counts,
  });
  await app.visit("/");
  const wrapper = mount(LicenseDist, {
    props: { integrationIds: [] },
    global: app.global,
  });
  await flushPromises();
  return wrapper;
}

describe("LicenseDist", () => {
  it("charts licenses from the most used, with counts and shares", async () => {
    const wrapper = await mountChart({ ISC: 1, MIT: 3 });

    const chart = wrapper.find('[aria-label="Dependencies by license"]');
    expect(
      chart.findAll('[role="img"]').map((c) => c.attributes("aria-label")),
    ).toEqual(["MIT: 3 dependencies (75%)", "ISC: 1 dependency (25%)"]);
  });

  it("says when no license is known", async () => {
    const wrapper = await mountChart({});

    expect(wrapper.text()).toContain("No data yet.");
  });
});
