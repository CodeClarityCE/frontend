import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import SecurityImpact from "./SecurityImpact.vue";

// Mock RadarChart component
vi.mock("@/base_components/data-display/charts/RadarChart.vue", () => ({
  default: {
    name: "RadarChart",
    props: ["id", "data", "options"],
    template: '<div class="mock-radar-chart" :id="id">RadarChart</div>',
  },
}));

describe.skip("SecurityImpact.vue", () => {
  const createMockStats = (overrides = {}) => {
    return {
      mean_confidentiality_impact: 0.7,
      mean_integrity_impact: 0.5,
      mean_availability_impact: 0.8,
      ...overrides,
    };
  };

  const createWrapper = (stats = createMockStats()) => {
    return mount(SecurityImpact, {
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
        wrapper.find(".flex.flex-row.justify-center.items-center").exists(),
      ).toBe(true);
    });

    it("should render RadarChart component", () => {
      const wrapper = createWrapper();

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      expect(radarChart.exists()).toBe(true);
      expect(radarChart.props("id")).toBe("ciaImpact");
    });
  });

  describe("Data Processing", () => {
    it("should create correct radar chart data structure", () => {
      const stats = createMockStats({
        mean_confidentiality_impact: 0.6,
        mean_integrity_impact: 0.4,
        mean_availability_impact: 0.9,
      });
      const wrapper = createWrapper(stats);

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");

      expect(chartData).toHaveLength(1);
      expect(chartData[0]).toHaveProperty("name", "Security Impact");
      expect(chartData[0]).toHaveProperty("axes");
      expect(chartData[0].axes).toHaveLength(3);
    });

    it("should map CIA triad values correctly", () => {
      const stats = createMockStats({
        mean_confidentiality_impact: 0.3,
        mean_integrity_impact: 0.7,
        mean_availability_impact: 0.2,
      });
      const wrapper = createWrapper(stats);

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      const confidentialityAxis = axes.find(
        (axis: any) => axis.axis === "CONFIDENTIALITY",
      );
      const integrityAxis = axes.find((axis: any) => axis.axis === "INTEGRITY");
      const availabilityAxis = axes.find(
        (axis: any) => axis.axis === "AVAILABILITY",
      );

      expect(confidentialityAxis.value).toBe(0.3);
      expect(integrityAxis.value).toBe(0.7);
      expect(availabilityAxis.value).toBe(0.2);
    });

    it("should handle null values with fallback to 0", () => {
      const stats = createMockStats({
        mean_confidentiality_impact: null,
        mean_integrity_impact: undefined,
        mean_availability_impact: 0.5,
      });
      const wrapper = createWrapper(stats);

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      const confidentialityAxis = axes.find(
        (axis: any) => axis.axis === "CONFIDENTIALITY",
      );
      const integrityAxis = axes.find((axis: any) => axis.axis === "INTEGRITY");
      const availabilityAxis = axes.find(
        (axis: any) => axis.axis === "AVAILABILITY",
      );

      expect(confidentialityAxis.value).toBe(0);
      expect(integrityAxis.value).toBe(0);
      expect(availabilityAxis.value).toBe(0.5);
    });

    it("should use correct axis labels", () => {
      const wrapper = createWrapper();

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      const axisLabels = axes.map((axis: any) => axis.axis);
      expect(axisLabels).toContain("CONFIDENTIALITY");
      expect(axisLabels).toContain("INTEGRITY");
      expect(axisLabels).toContain("AVAILABILITY");
    });
  });

  describe("Chart Options", () => {
    it("should set correct radar chart options", () => {
      const wrapper = createWrapper();

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const options = radarChart.props("options");

      expect(options.format).toBe("0.1f");
      expect(options.maxValue).toBe(1.0);
    });

    it("should use correct chart ID", () => {
      const wrapper = createWrapper();

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      expect(radarChart.props("id")).toBe("ciaImpact");
    });
  });

  describe("Props Validation", () => {
    it("should accept stats prop with CIA impact values", () => {
      const stats = createMockStats();
      const wrapper = createWrapper(stats);

      expect(wrapper.props("stats")).toEqual(stats);
    });

    it("should handle missing CIA impact properties", () => {
      const stats = {} as any;
      const wrapper = createWrapper(stats);

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      // All values should default to 0
      axes.forEach((axis: any) => {
        expect(axis.value).toBe(0);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero impact values", () => {
      const stats = createMockStats({
        mean_confidentiality_impact: 0,
        mean_integrity_impact: 0,
        mean_availability_impact: 0,
      });
      const wrapper = createWrapper(stats);

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      axes.forEach((axis: any) => {
        expect(axis.value).toBe(0);
      });
    });

    it("should handle maximum impact values", () => {
      const stats = createMockStats({
        mean_confidentiality_impact: 1.0,
        mean_integrity_impact: 1.0,
        mean_availability_impact: 1.0,
      });
      const wrapper = createWrapper(stats);

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      axes.forEach((axis: any) => {
        expect(axis.value).toBe(1.0);
      });
    });

    it("should handle values above maximum", () => {
      const stats = createMockStats({
        mean_confidentiality_impact: 1.5,
        mean_integrity_impact: 2.0,
        mean_availability_impact: 0.8,
      });
      const wrapper = createWrapper(stats);

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      const confidentialityAxis = axes.find(
        (axis: any) => axis.axis === "CONFIDENTIALITY",
      );
      const integrityAxis = axes.find((axis: any) => axis.axis === "INTEGRITY");
      const availabilityAxis = axes.find(
        (axis: any) => axis.axis === "AVAILABILITY",
      );

      expect(confidentialityAxis.value).toBe(1.5);
      expect(integrityAxis.value).toBe(2.0);
      expect(availabilityAxis.value).toBe(0.8);
    });

    it("should handle negative impact values", () => {
      const stats = createMockStats({
        mean_confidentiality_impact: -0.1,
        mean_integrity_impact: -0.5,
        mean_availability_impact: 0.3,
      });
      const wrapper = createWrapper(stats);

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      const confidentialityAxis = axes.find(
        (axis: any) => axis.axis === "CONFIDENTIALITY",
      );
      const integrityAxis = axes.find((axis: any) => axis.axis === "INTEGRITY");
      const availabilityAxis = axes.find(
        (axis: any) => axis.axis === "AVAILABILITY",
      );

      expect(confidentialityAxis.value).toBe(-0.1);
      expect(integrityAxis.value).toBe(-0.5);
      expect(availabilityAxis.value).toBe(0.3);
    });

    it("should handle decimal precision", () => {
      const stats = createMockStats({
        mean_confidentiality_impact: 0.123456789,
        mean_integrity_impact: 0.987654321,
        mean_availability_impact: 0.555555555,
      });
      const wrapper = createWrapper(stats);

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      const confidentialityAxis = axes.find(
        (axis: any) => axis.axis === "CONFIDENTIALITY",
      );
      const integrityAxis = axes.find((axis: any) => axis.axis === "INTEGRITY");
      const availabilityAxis = axes.find(
        (axis: any) => axis.axis === "AVAILABILITY",
      );

      expect(confidentialityAxis.value).toBe(0.123456789);
      expect(integrityAxis.value).toBe(0.987654321);
      expect(availabilityAxis.value).toBe(0.555555555);
    });
  });

  describe("Reactive Updates", () => {
    it("should update chart data when stats change", async () => {
      const wrapper = createWrapper();

      const initialStats = {
        mean_confidentiality_impact: 0.3,
        mean_integrity_impact: 0.5,
        mean_availability_impact: 0.7,
      };

      await wrapper.setProps({ stats: initialStats });

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      const confidentialityAxis = axes.find(
        (axis: any) => axis.axis === "CONFIDENTIALITY",
      );
      const integrityAxis = axes.find((axis: any) => axis.axis === "INTEGRITY");
      const availabilityAxis = axes.find(
        (axis: any) => axis.axis === "AVAILABILITY",
      );

      expect(confidentialityAxis.value).toBe(0.3);
      expect(integrityAxis.value).toBe(0.5);
      expect(availabilityAxis.value).toBe(0.7);
    });
  });

  describe("Layout and Styling", () => {
    it("should have correct CSS classes for layout", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".p-2").exists()).toBe(true);
      expect(
        wrapper.find(".flex.flex-row.justify-center.items-center").exists(),
      ).toBe(true);
    });

    it("should center align radar chart", () => {
      const wrapper = createWrapper();

      const container = wrapper.find(
        ".flex.flex-row.justify-center.items-center",
      );
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain("justify-center");
      expect(container.classes()).toContain("items-center");
    });
  });

  describe("Data Structure Integrity", () => {
    it("should maintain consistent data structure format", () => {
      const wrapper = createWrapper();

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");

      expect(Array.isArray(chartData)).toBe(true);
      expect(chartData).toHaveLength(1);

      const dataItem = chartData[0];
      expect(dataItem).toHaveProperty("name");
      expect(dataItem).toHaveProperty("axes");
      expect(Array.isArray(dataItem.axes)).toBe(true);
      expect(dataItem.axes).toHaveLength(3);

      dataItem.axes.forEach((axis: any) => {
        expect(axis).toHaveProperty("axis");
        expect(axis).toHaveProperty("value");
        expect(typeof axis.axis).toBe("string");
        expect(typeof axis.value).toBe("number");
      });
    });

    it("should maintain axis order consistency", () => {
      const wrapper = createWrapper();

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const chartData = radarChart.props("data");
      const axes = chartData[0].axes;

      expect(axes[0].axis).toBe("CONFIDENTIALITY");
      expect(axes[1].axis).toBe("INTEGRITY");
      expect(axes[2].axis).toBe("AVAILABILITY");
    });
  });

  describe("Chart Configuration", () => {
    it("should use appropriate format for decimal display", () => {
      const wrapper = createWrapper();

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const options = radarChart.props("options");

      expect(options.format).toBe("0.1f");
    });

    it("should set appropriate maximum value for CIA triad", () => {
      const wrapper = createWrapper();

      const radarChart = wrapper.findComponent({ name: "RadarChart" });
      const options = radarChart.props("options");

      expect(options.maxValue).toBe(1.0);
    });
  });
});
