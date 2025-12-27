import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import BulletLegend, { type LegendItem } from "./BulletLegend.vue";

// Helper function to convert hex to rgb format for comparison
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result?.[1] || !result[2] || !result[3]) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgb(${r}, ${g}, ${b})`;
};

describe("BulletLegend.vue", () => {
  const createMockItems = (): LegendItem[] => [
    { label: "Critical", color: "#dc2626", count: 5 },
    { label: "High", color: "#ea580c", count: 12 },
    { label: "Medium", color: "#ca8a04", count: 8 },
    { label: "Low", color: "#65a30d", count: 3 },
  ];

  const createWrapper = (items: LegendItem[] = createMockItems()) => {
    return mount(BulletLegend, {
      props: {
        items,
      },
    });
  };

  describe("Component Rendering", () => {
    it("should render the main container", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".flex.flex-col.gap-1").exists()).toBe(true);
    });

    it("should render all legend items", () => {
      const items = createMockItems();
      const wrapper = createWrapper(items);

      const legendItems = wrapper.findAll(".flex.items-center.gap-2");
      expect(legendItems.length).toBe(items.length);
    });

    it("should render correct labels", () => {
      const items = createMockItems();
      const wrapper = createWrapper(items);

      items.forEach((item) => {
        expect(wrapper.text()).toContain(item.label);
      });
    });

    it("should render correct counts", () => {
      const items = createMockItems();
      const wrapper = createWrapper(items);

      items.forEach((item) => {
        expect(wrapper.text()).toContain(item.count.toString());
      });
    });
  });

  describe("Circle Rendering", () => {
    it("should render circle divs for each item", () => {
      const items = createMockItems();
      const wrapper = createWrapper(items);

      const circles = wrapper.findAll(".w-3.h-3.rounded-full.shrink-0");
      expect(circles.length).toBe(items.length);
    });

    it("should apply correct colors to circles", () => {
      const items = createMockItems();
      const wrapper = createWrapper(items);

      const circles = wrapper.findAll(".w-3.h-3.rounded-full.shrink-0");

      items.forEach((item, index) => {
        const circleStyle = circles[index]?.attributes("style");
        // Browsers normalize hex colors to rgb format
        const expectedColor = hexToRgb(item.color);
        expect(circleStyle).toContain(`background-color: ${expectedColor}`);
      });
    });
  });

  describe("Styling and Colors", () => {
    it("should apply colors to count text", () => {
      const items = [{ label: "Test Item", color: "#ff0000", count: 42 }];
      const wrapper = createWrapper(items);

      const countSpan = wrapper.find(".ml-auto.text-sm.font-semibold");
      expect(countSpan.exists()).toBe(true);
      expect(countSpan.attributes("style")).toContain("color: rgb(255, 0, 0)");
    });

    it("should have correct CSS classes for layout", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".flex.flex-col.gap-1").exists()).toBe(true);
      expect(wrapper.find(".flex.items-center.gap-2").exists()).toBe(true);
      expect(wrapper.find(".text-sm").exists()).toBe(true);
      expect(wrapper.find(".ml-auto.text-sm.font-semibold").exists()).toBe(
        true,
      );
    });
  });

  describe("Props Validation", () => {
    it("should accept items prop", () => {
      const items = createMockItems();
      const wrapper = createWrapper(items);

      expect(wrapper.props("items")).toEqual(items);
    });

    it("should handle empty items array", () => {
      const wrapper = createWrapper([]);

      expect(wrapper.findAll(".flex.items-center.gap-2").length).toBe(0);
      expect(wrapper.find(".flex.flex-col.gap-1").exists()).toBe(true);
    });

    it("should handle single item", () => {
      const items = [{ label: "Single", color: "#000000", count: 1 }];
      const wrapper = createWrapper(items);

      expect(wrapper.findAll(".flex.items-center.gap-2").length).toBe(1);
      expect(wrapper.text()).toContain("Single");
      expect(wrapper.text()).toContain("1");
    });
  });

  describe("Different Data Types", () => {
    it("should handle different severity types", () => {
      const items = [
        { label: "Critical", color: "#dc2626", count: 5 },
        { label: "High", color: "#ea580c", count: 12 },
        { label: "Medium", color: "#ca8a04", count: 8 },
        { label: "Low", color: "#65a30d", count: 3 },
        { label: "None", color: "#6b7280", count: 0 },
      ];
      const wrapper = createWrapper(items);

      items.forEach((item) => {
        expect(wrapper.text()).toContain(item.label);
        expect(wrapper.text()).toContain(item.count.toString());
      });
    });

    it("should handle large counts", () => {
      const items = [{ label: "Large Count", color: "#000000", count: 9999 }];
      const wrapper = createWrapper(items);

      expect(wrapper.text()).toContain("9999");
    });

    it("should handle zero counts", () => {
      const items = [{ label: "Zero Count", color: "#000000", count: 0 }];
      const wrapper = createWrapper(items);

      expect(wrapper.text()).toContain("0");
    });

    it("should handle different color formats", () => {
      const items = [
        { label: "Hex", color: "#ff0000", count: 1 },
        { label: "RGB", color: "rgb(0, 255, 0)", count: 2 },
        { label: "Named", color: "blue", count: 3 },
      ];
      const wrapper = createWrapper(items);

      const circles = wrapper.findAll(".w-3.h-3.rounded-full.shrink-0");
      // Browsers normalize hex colors to rgb format
      expect(circles[0]?.attributes("style")).toContain(
        "background-color: rgb(255, 0, 0)",
      );
      expect(circles[1]?.attributes("style")).toContain(
        "background-color: rgb(0, 255, 0)",
      );
      expect(circles[2]?.attributes("style")).toContain(
        "background-color: blue",
      );
    });
  });

  describe("Layout and Accessibility", () => {
    it("should have proper spacing between items", () => {
      const wrapper = createWrapper();

      expect(wrapper.find(".flex.flex-col.gap-1").exists()).toBe(true);
      expect(wrapper.find(".flex.items-center.gap-2").exists()).toBe(true);
    });

    it("should align count to the right", () => {
      const wrapper = createWrapper();

      const countElement = wrapper.find(".ml-auto");
      expect(countElement.exists()).toBe(true);
      expect(countElement.classes()).toContain("ml-auto");
    });

    it("should have readable text sizes", () => {
      const wrapper = createWrapper();

      const labelElements = wrapper.findAll(".text-sm");
      expect(labelElements.length).toBeGreaterThan(0);

      const countElements = wrapper.findAll(".font-semibold");
      expect(countElements.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle long labels", () => {
      const items = [
        {
          label: "Very Long Label That Might Cause Layout Issues",
          color: "#000000",
          count: 1,
        },
      ];
      const wrapper = createWrapper(items);

      expect(wrapper.text()).toContain(
        "Very Long Label That Might Cause Layout Issues",
      );
    });

    it("should handle special characters in labels", () => {
      const items = [
        { label: "Label with symbols !@#$%", color: "#000000", count: 1 },
        { label: "Unicode 测试", color: "#000000", count: 2 },
      ];
      const wrapper = createWrapper(items);

      expect(wrapper.text()).toContain("Label with symbols !@#$%");
      expect(wrapper.text()).toContain("Unicode 测试");
    });

    it("should handle missing color gracefully", () => {
      const items = [{ label: "No Color", color: "", count: 1 }];
      const wrapper = createWrapper(items);

      const circle = wrapper.find(".w-3.h-3.rounded-full.shrink-0");
      const style = circle.attributes("style");
      if (style) {
        expect(style).toContain("background-color");
      }
    });

    it("should handle negative counts", () => {
      const items = [{ label: "Negative", color: "#000000", count: -5 }];
      const wrapper = createWrapper(items);

      expect(wrapper.text()).toContain("-5");
    });
  });

  describe("Component Structure", () => {
    it("should maintain proper DOM structure", () => {
      const wrapper = createWrapper();

      // Main container
      const container = wrapper.find(".flex.flex-col.gap-1");
      expect(container.exists()).toBe(true);

      // Item containers
      const items = container.findAll(".flex.items-center.gap-2");
      expect(items.length).toBeGreaterThan(0);

      // Each item should have circle, label, and count
      items.forEach((item) => {
        expect(item.find(".w-3.h-3.rounded-full.shrink-0").exists()).toBe(
          true,
        );
        expect(item.find(".text-sm").exists()).toBe(true);
        expect(item.find(".ml-auto.text-sm.font-semibold").exists()).toBe(true);
      });
    });

    it("should render in correct order", () => {
      const items = [
        { label: "First", color: "#000000", count: 1 },
        { label: "Second", color: "#000000", count: 2 },
        { label: "Third", color: "#000000", count: 3 },
      ];
      const wrapper = createWrapper(items);

      const itemElements = wrapper.findAll(".flex.items-center.gap-2");
      expect(itemElements[0]?.text()).toContain("First");
      expect(itemElements[1]?.text()).toContain("Second");
      expect(itemElements[2]?.text()).toContain("Third");
    });
  });
});
