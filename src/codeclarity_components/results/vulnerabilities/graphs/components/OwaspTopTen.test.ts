import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import OwaspTopTen from "./OwaspTopTen.vue";

// Mock BarChart component
vi.mock("@/base_components/data-display/charts/BarChart.vue", () => ({
  default: {
    name: "BarChart",
    props: ["id", "data", "options"],
    template: '<div class="mock-bar-chart" :id="id">BarChart</div>',
  },
}));

// Mock BulletLegend component
vi.mock("./BulletLegend.vue", () => ({
  default: {
    name: "BulletLegend",
    props: ["items"],
    template: '<div class="mock-bullet-legend">BulletLegend</div>',
  },
}));

describe("OwaspTopTen.vue", () => {
  const createMockStats = (overrides = {}) => {
    return {
      number_of_owasp_top_10_2021_a1: 5,
      number_of_owasp_top_10_2021_a2: 3,
      number_of_owasp_top_10_2021_a3: 8,
      number_of_owasp_top_10_2021_a4: 0,
      number_of_owasp_top_10_2021_a5: 2,
      number_of_owasp_top_10_2021_a6: 1,
      number_of_owasp_top_10_2021_a7: 0,
      number_of_owasp_top_10_2021_a8: 4,
      number_of_owasp_top_10_2021_a9: 0,
      number_of_owasp_top_10_2021_a10: 1,
      number_of_vulnerabilities: 30,
      ...overrides,
    };
  };

  const createWrapper = (stats = createMockStats()) => {
    return mount(OwaspTopTen, {
      props: {
        stats,
      },
    });
  };

  describe("Component Rendering", () => {
    it("should render the main container", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".p-2").exists()).toBe(true);
      expect(
        wrapper
          .find(".flex.flex-col.justify-center.items-center.gap-2")
          .exists(),
      ).toBe(true);
    });

    it("should render BarChart component", () => {
      const wrapper = createWrapper();

      const barChart = wrapper.findComponent({ name: "BarChart" });
      expect(barChart.exists()).toBe(true);
      expect(barChart.props("id")).toBe("barChartOwaspTopTen");
    });

    it("should render BulletLegend component", () => {
      const wrapper = createWrapper();

      const bulletLegend = wrapper.findComponent({ name: "BulletLegend" });
      expect(bulletLegend.exists()).toBe(true);
    });
  });

  describe("Data Processing", () => {
    it("should filter out zero values from OWASP categories", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 5,
        number_of_owasp_top_10_2021_a2: 0,
        number_of_owasp_top_10_2021_a3: 3,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 2,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 1,
        number_of_vulnerabilities: 20,
      });
      const wrapper = createWrapper(stats);

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      // Should only include A01, A03, A05, A10, and Uncategorized
      expect(chartData.length).toBe(5);
      expect(chartData.some((item: any) => item.label.includes("A01"))).toBe(
        true,
      );
      expect(chartData.some((item: any) => item.label.includes("A03"))).toBe(
        true,
      );
      expect(chartData.some((item: any) => item.label.includes("A05"))).toBe(
        true,
      );
      expect(chartData.some((item: any) => item.label.includes("A10"))).toBe(
        true,
      );
      expect(
        chartData.some((item: any) => item.label === "Uncategorized"),
      ).toBe(true);
    });

    it("should include uncategorized vulnerabilities when total is less than overall count", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 5,
        number_of_owasp_top_10_2021_a2: 3,
        number_of_owasp_top_10_2021_a3: 2,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
        number_of_vulnerabilities: 15, // 10 categorized + 5 uncategorized
      });
      const wrapper = createWrapper(stats);

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      const uncategorizedItem = chartData.find(
        (item: any) => item.label === "Uncategorized",
      );
      expect(uncategorizedItem).toBeDefined();
      expect(uncategorizedItem.count).toBe(5);
    });

    it("should not include uncategorized when all vulnerabilities are categorized", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 5,
        number_of_owasp_top_10_2021_a2: 3,
        number_of_owasp_top_10_2021_a3: 2,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
        number_of_vulnerabilities: 10, // exactly matches categorized count
      });
      const wrapper = createWrapper(stats);

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      const uncategorizedItem = chartData.find(
        (item: any) => item.label === "Uncategorized",
      );
      expect(uncategorizedItem).toBeUndefined();
    });

    it("should use correct OWASP labels", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 1,
        number_of_owasp_top_10_2021_a2: 0,
        number_of_owasp_top_10_2021_a3: 1,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 1,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
        number_of_vulnerabilities: 3,
      });
      const wrapper = createWrapper(stats);

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      expect(
        chartData.some(
          (item: any) => item.label === "A01: Broken Access Control",
        ),
      ).toBe(true);
      expect(
        chartData.some((item: any) => item.label === "A03: Injection"),
      ).toBe(true);
      expect(
        chartData.some(
          (item: any) => item.label === "A05: Security Misconfiguration",
        ),
      ).toBe(true);
    });

    it("should assign colors correctly", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 1,
        number_of_owasp_top_10_2021_a2: 1,
        number_of_owasp_top_10_2021_a3: 0,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
        number_of_vulnerabilities: 3,
      });
      const wrapper = createWrapper(stats);

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      // First item (A01) should get first color
      const a01Item = chartData.find((item: any) => item.label.includes("A01"));
      expect(a01Item.color).toBe("#003532");

      // Second item (A02) should get second color
      const a02Item = chartData.find((item: any) => item.label.includes("A02"));
      expect(a02Item.color).toBe("#1A4876");

      // Uncategorized should get uncategorized color
      const uncategorizedItem = chartData.find(
        (item: any) => item.label === "Uncategorized",
      );
      expect(uncategorizedItem.color).toBe("#D3D3D3");
    });
  });

  describe("Props Validation", () => {
    it("should accept stats prop with all OWASP fields", () => {
      const stats = createMockStats();
      const wrapper = createWrapper(stats);

      expect(wrapper.props("stats")).toEqual(stats);
    });

    it("should pass data to BarChart component", () => {
      const wrapper = createWrapper();

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      expect(Array.isArray(chartData)).toBe(true);
      expect(chartData.length).toBeGreaterThan(0);

      chartData.forEach((item: any) => {
        expect(item).toHaveProperty("label");
        expect(item).toHaveProperty("color");
        expect(item).toHaveProperty("count");
      });
    });

    it("should pass same data to BulletLegend component", () => {
      const wrapper = createWrapper();

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const bulletLegend = wrapper.findComponent({ name: "BulletLegend" });

      expect(bulletLegend.props("items")).toEqual(barChart.props("data"));
    });
  });

  describe("Edge Cases", () => {
    it("should handle all zero OWASP values", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 0,
        number_of_owasp_top_10_2021_a2: 0,
        number_of_owasp_top_10_2021_a3: 0,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
        number_of_vulnerabilities: 5,
      });
      const wrapper = createWrapper(stats);

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      // Should only have uncategorized
      expect(chartData.length).toBe(1);
      expect(chartData[0].label).toBe("Uncategorized");
      expect(chartData[0].count).toBe(5);
    });

    it("should handle zero total vulnerabilities", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 0,
        number_of_owasp_top_10_2021_a2: 0,
        number_of_owasp_top_10_2021_a3: 0,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
        number_of_vulnerabilities: 0,
      });
      const wrapper = createWrapper(stats);

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      expect(chartData.length).toBe(0);
    });

    it("should handle large OWASP values", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 9999,
        number_of_owasp_top_10_2021_a2: 8888,
        number_of_owasp_top_10_2021_a3: 0,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
        number_of_vulnerabilities: 20000,
      });
      const wrapper = createWrapper(stats);

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      const a01Item = chartData.find((item: any) => item.label.includes("A01"));
      const a02Item = chartData.find((item: any) => item.label.includes("A02"));

      expect(a01Item.count).toBe(9999);
      expect(a02Item.count).toBe(8888);
    });

    it("should handle case where categorized exceeds total", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 10,
        number_of_owasp_top_10_2021_a2: 5,
        number_of_owasp_top_10_2021_a3: 0,
        number_of_owasp_top_10_2021_a4: 0,
        number_of_owasp_top_10_2021_a5: 0,
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
        number_of_vulnerabilities: 10, // less than categorized total
      });
      const wrapper = createWrapper(stats);

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      // Should not include uncategorized when it would be negative
      const uncategorizedItem = chartData.find(
        (item: any) => item.label === "Uncategorized",
      );
      expect(uncategorizedItem).toBeUndefined();
    });
  });

  describe("Chart Options", () => {
    it("should pass empty options to BarChart", () => {
      const wrapper = createWrapper();

      const barChart = wrapper.findComponent({ name: "BarChart" });
      expect(barChart.props("options")).toEqual({});
    });

    it("should use correct chart ID", () => {
      const wrapper = createWrapper();

      const barChart = wrapper.findComponent({ name: "BarChart" });
      expect(barChart.props("id")).toBe("barChartOwaspTopTen");
    });
  });

  describe("Color Assignment Logic", () => {
    it("should assign colors in sequence for active categories", () => {
      const stats = createMockStats({
        number_of_owasp_top_10_2021_a1: 0, // skip
        number_of_owasp_top_10_2021_a2: 1, // first color
        number_of_owasp_top_10_2021_a3: 1, // second color
        number_of_owasp_top_10_2021_a4: 0, // skip
        number_of_owasp_top_10_2021_a5: 1, // third color
        number_of_owasp_top_10_2021_a6: 0,
        number_of_owasp_top_10_2021_a7: 0,
        number_of_owasp_top_10_2021_a8: 0,
        number_of_owasp_top_10_2021_a9: 0,
        number_of_owasp_top_10_2021_a10: 0,
        number_of_vulnerabilities: 4,
      });
      const wrapper = createWrapper(stats);

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const chartData = barChart.props("data");

      // Find items in the order they appear
      const a02Item = chartData.find((item: any) => item.label.includes("A02"));
      const a03Item = chartData.find((item: any) => item.label.includes("A03"));
      const a05Item = chartData.find((item: any) => item.label.includes("A05"));
      const uncategorizedItem = chartData.find(
        (item: any) => item.label === "Uncategorized",
      );

      expect(a02Item).toBeDefined();
      expect(a03Item).toBeDefined();
      expect(a05Item).toBeDefined();
      expect(uncategorizedItem).toBeDefined();

      expect(a02Item.color).toBe("#003532"); // first color
      expect(a03Item.color).toBe("#1A4876"); // second color
      expect(a05Item.color).toBe("#008491"); // third color
      expect(uncategorizedItem.color).toBe("#D3D3D3"); // uncategorized color
    });
  });

  describe("Layout and Styling", () => {
    it("should have correct CSS classes for layout", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".p-2").exists()).toBe(true);
      expect(
        wrapper
          .find(".flex.flex-col.justify-center.items-center.gap-2")
          .exists(),
      ).toBe(true);
    });

    it("should center align chart and legend", () => {
      const wrapper = createWrapper();

      const container = wrapper.find(
        ".flex.flex-col.justify-center.items-center.gap-2",
      );
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain("justify-center");
      expect(container.classes()).toContain("items-center");
    });
  });

  describe("Component Integration", () => {
    it("should maintain consistent data between chart and legend", () => {
      const wrapper = createWrapper();

      const barChart = wrapper.findComponent({ name: "BarChart" });
      const bulletLegend = wrapper.findComponent({ name: "BulletLegend" });

      const chartData = barChart.props("data");
      const legendItems = bulletLegend.props("items");

      expect(chartData).toEqual(legendItems);
      expect(chartData.length).toBe(legendItems.length);
    });
  });
});
