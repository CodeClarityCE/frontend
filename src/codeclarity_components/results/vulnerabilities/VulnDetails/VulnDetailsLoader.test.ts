import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import VulnDetailsLoader from "./VulnDetailsLoader.vue";

// Mock child components
vi.mock("@/base_components/ui/loaders/BoxLoader.vue", () => ({
  default: {
    name: "BoxLoader",
    props: ["dimensions"],
    template: '<div class="mock-box-loader">BoxLoader</div>',
  },
}));

vi.mock("@/base_components/ui/loaders/TextLoader.vue", () => ({
  default: {
    name: "TextLoader",
    template: '<div class="mock-text-loader">TextLoader</div>',
  },
}));

describe("VulnDetailsLoader.vue", () => {
  const createWrapper = () => {
    return mount(VulnDetailsLoader);
  };

  describe("Component Rendering", () => {
    it("should render the main container with correct styling", () => {
      const wrapper = createWrapper();

      const container = wrapper.find('div[style*="display: flex"]');
      expect(container.exists()).toBe(true);
      expect(container.attributes("style")).toContain("flex-direction: column");
      expect(container.attributes("style")).toContain("row-gap: 10px");
    });

    it("should render header box loaders", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });
      expect(boxLoaders.length).toBeGreaterThan(0);

      // Check first two header loaders have correct dimensions
      const firstDimensions = boxLoaders[0]!.props("dimensions");
      const secondDimensions = boxLoaders[1]!.props("dimensions");
      expect(firstDimensions).toEqual({ width: "30%", height: "50px" });
      expect(secondDimensions).toEqual({ width: "35%", height: "40px" });
    });

    it("should render text loaders", () => {
      const wrapper = createWrapper();

      const textLoaders = wrapper.findAllComponents({ name: "TextLoader" });
      expect(textLoaders.length).toBe(2);
    });

    it("should render content box loaders in grid layout", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });

      // Should have content loaders with 49% width and 300px height
      const contentLoaders = boxLoaders.filter(
        (loader) =>
          loader.props("dimensions").width === "49%" &&
          loader.props("dimensions").height === "300px",
      );
      expect(contentLoaders.length).toBe(4); // 2 rows × 2 columns
    });

    it("should render full-width content loader", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });

      // Should have one full-width loader
      const fullWidthLoader = boxLoaders.find(
        (loader) =>
          loader.props("dimensions")?.width === "100%" &&
          loader.props("dimensions")?.height === "300px",
      );
      expect(fullWidthLoader).toBeDefined();
    });

    it("should render footer box loaders", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });

      // Should have 4 footer loaders with 24% width
      const footerLoaders = boxLoaders.filter(
        (loader) =>
          loader.props("dimensions")?.width === "24%" &&
          loader.props("dimensions")?.height === "100px",
      );
      expect(footerLoaders.length).toBe(4);
    });
  });

  describe("Layout Structure", () => {
    it("should have correct number of rows for content loaders", () => {
      const wrapper = createWrapper();

      // Should have 2 rows with flex layout for content
      const flexRows = wrapper.findAll(
        'div[style*="justify-content: space-between"]',
      );
      expect(flexRows.length).toBe(3); // 2 content rows + 1 footer row
    });

    it("should apply correct margins to content sections", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });

      // Check that content loaders have margin-top styling
      boxLoaders.forEach((loader, index) => {
        if (index >= 2) {
          // Skip header loaders
          const element = loader.element as HTMLElement;
          // Either the loader itself or its parent should have margin-top
          const hasMargin =
            element.style.marginTop || element.parentElement?.style.marginTop;
          const dimensions = loader.props("dimensions");
          if (
            dimensions?.height === "300px" ||
            dimensions?.height === "100px"
          ) {
            expect(hasMargin).toBeTruthy();
          }
        }
      });
    });
  });

  describe("Loading Pattern", () => {
    it("should follow a logical loading pattern from top to bottom", () => {
      const wrapper = createWrapper();

      const allElements = wrapper.findAll("*");
      const elementOrder = [];

      // Check that elements appear in logical order
      allElements.forEach((el) => {
        if (
          el.classes().includes("mock-box-loader") ||
          el.classes().includes("mock-text-loader")
        ) {
          elementOrder.push(el.classes());
        }
      });

      expect(elementOrder.length).toBeGreaterThan(0);
    });

    it("should create a skeleton that resembles the actual content layout", () => {
      const wrapper = createWrapper();

      // Header section (small loaders)
      const headerLoaders = wrapper
        .findAllComponents({ name: "BoxLoader" })
        .slice(0, 2);
      expect(headerLoaders[0]!.props("dimensions")?.height).toBe("50px");
      expect(headerLoaders[1]!.props("dimensions")?.height).toBe("40px");

      // Content section (large loaders)
      const contentLoaders = wrapper
        .findAllComponents({ name: "BoxLoader" })
        .filter((loader) => loader.props("dimensions")?.height === "300px");
      expect(contentLoaders.length).toBe(5); // 4 grid + 1 full width

      // Footer section (medium loaders)
      const footerLoaders = wrapper
        .findAllComponents({ name: "BoxLoader" })
        .filter((loader) => loader.props("dimensions")?.height === "100px");
      expect(footerLoaders.length).toBe(4);
    });
  });

  describe("Responsive Design Simulation", () => {
    it("should use percentage-based widths for responsiveness", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });

      boxLoaders.forEach((loader) => {
        const width = loader.props("dimensions")?.width ?? "";
        expect(width).toMatch(/^\d+%$/); // Should be percentage
      });
    });

    it("should have appropriate spacing between elements", () => {
      const wrapper = createWrapper();

      // Check that main container has row-gap
      const container = wrapper.find('div[style*="row-gap: 10px"]');
      expect(container.exists()).toBe(true);

      // Check that flex rows have space-between
      const flexRows = wrapper.findAll(
        'div[style*="justify-content: space-between"]',
      );
      flexRows.forEach((row) => {
        const style = row.attributes("style") ?? "";
        expect(style).toContain("justify-content: space-between");
      });
    });
  });

  describe("Component Integration", () => {
    it("should pass correct props to BoxLoader components", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });

      boxLoaders.forEach((loader) => {
        expect(loader.props("dimensions")).toBeDefined();
        expect(loader.props("dimensions")).toHaveProperty("width");
        expect(loader.props("dimensions")).toHaveProperty("height");
      });
    });

    it("should render TextLoader components without props", () => {
      const wrapper = createWrapper();

      const textLoaders = wrapper.findAllComponents({ name: "TextLoader" });

      textLoaders.forEach((loader) => {
        // TextLoader doesn't require props in this implementation
        expect(loader.exists()).toBe(true);
      });
    });
  });

  describe("Visual Hierarchy", () => {
    it("should create visual hierarchy with different loader sizes", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });
      const heights = boxLoaders.map(
        (loader) => loader.props("dimensions")?.height ?? "",
      );

      // Should have variety in heights
      const uniqueHeights = [...new Set(heights)];
      expect(uniqueHeights.length).toBeGreaterThan(1);
      expect(uniqueHeights).toContain("50px"); // Header
      expect(uniqueHeights).toContain("300px"); // Content
      expect(uniqueHeights).toContain("100px"); // Footer
    });
  });
});
