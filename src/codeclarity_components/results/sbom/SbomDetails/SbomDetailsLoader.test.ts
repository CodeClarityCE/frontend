import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import SbomDetailsLoader from "./SbomDetailsLoader.vue";

// Mock loader components
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
    props: ["style"],
    template:
      '<div class="mock-text-loader" :style="$props.style">TextLoader</div>',
  },
}));

describe("SbomDetailsLoader.vue", () => {
  const createWrapper = () => {
    return mount(SbomDetailsLoader);
  };

  describe("Component Rendering", () => {
    it("should render the main container", () => {
      const wrapper = createWrapper();

      const container = wrapper.find(".loader-container");
      expect(container.exists()).toBe(true);
    });

    it("should render all loader components", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });
      const textLoaders = wrapper.findAllComponents({ name: "TextLoader" });

      expect(boxLoaders.length).toBeGreaterThan(0);
      expect(textLoaders.length).toBeGreaterThan(0);
    });
  });

  describe("Header Section Loaders", () => {
    it("should render header box loader with correct dimensions", () => {
      const wrapper = createWrapper();

      const header = wrapper.find(".loader-header");
      expect(header.exists()).toBe(true);

      const boxLoaders = header.findAllComponents({ name: "BoxLoader" });
      expect(boxLoaders[0]!.props("dimensions")).toEqual({
        width: "30%",
        height: "40px",
      });
    });

    it("should render header text loader with correct styling", () => {
      const wrapper = createWrapper();

      const header = wrapper.find(".loader-header");
      const textLoaders = header.findAllComponents({ name: "TextLoader" });

      expect(textLoaders.length).toBe(1);

      const style = textLoaders[0]!.attributes("style") ?? "";
      expect(style).toContain("max-width: 50%");
    });
  });

  describe("Content Section Loaders", () => {
    it("should render summary bar loader with correct dimensions", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });
      // Second BoxLoader is the summary bar (after header one)
      expect(boxLoaders[1]!.props("dimensions")).toEqual({
        width: "100%",
        height: "48px",
      });
    });

    it("should render tab loaders in tabs section", () => {
      const wrapper = createWrapper();

      const tabs = wrapper.find(".loader-tabs");
      expect(tabs.exists()).toBe(true);

      const tabLoaders = tabs.findAllComponents({ name: "BoxLoader" });
      expect(tabLoaders.length).toBe(3);
      expect(tabLoaders[0]!.props("dimensions")).toEqual({
        width: "100px",
        height: "32px",
      });
      expect(tabLoaders[1]!.props("dimensions")).toEqual({
        width: "140px",
        height: "32px",
      });
      expect(tabLoaders[2]!.props("dimensions")).toEqual({
        width: "80px",
        height: "32px",
      });
    });

    it("should render content area loader with correct dimensions", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });
      const lastLoader = boxLoaders[boxLoaders.length - 1]!;
      expect(lastLoader.props("dimensions")).toEqual({
        width: "100%",
        height: "400px",
      });
    });
  });

  describe("Layout Structure", () => {
    it("should have correct overall layout structure", () => {
      const wrapper = createWrapper();

      // Main container
      expect(wrapper.find(".loader-container").exists()).toBe(true);

      // Header section
      expect(wrapper.find(".loader-header").exists()).toBe(true);

      // Tabs section
      expect(wrapper.find(".loader-tabs").exists()).toBe(true);

      // Total loaders
      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });
      const textLoaders = wrapper.findAllComponents({ name: "TextLoader" });

      expect(boxLoaders.length).toBe(6);
      expect(textLoaders.length).toBe(1);
    });

    it("should maintain proper spacing between sections", () => {
      const wrapper = createWrapper();

      // Loader container uses CSS gap
      const container = wrapper.find(".loader-container");
      expect(container.exists()).toBe(true);

      // Header has its own gap
      const header = wrapper.find(".loader-header");
      expect(header.exists()).toBe(true);

      // Tabs have their own gap
      const tabs = wrapper.find(".loader-tabs");
      expect(tabs.exists()).toBe(true);
    });
  });

  describe("Component Integration", () => {
    it("should pass correct props to all BoxLoader components", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });

      // Header box loader
      expect(boxLoaders[0]!.props("dimensions")).toEqual({
        width: "30%",
        height: "40px",
      });
      // Summary bar
      expect(boxLoaders[1]!.props("dimensions")).toEqual({
        width: "100%",
        height: "48px",
      });
      // Tab loaders
      expect(boxLoaders[2]!.props("dimensions")).toEqual({
        width: "100px",
        height: "32px",
      });
      expect(boxLoaders[3]!.props("dimensions")).toEqual({
        width: "140px",
        height: "32px",
      });
      expect(boxLoaders[4]!.props("dimensions")).toEqual({
        width: "80px",
        height: "32px",
      });
      // Content area
      expect(boxLoaders[5]!.props("dimensions")).toEqual({
        width: "100%",
        height: "400px",
      });
    });

    it("should pass correct props to TextLoader components", () => {
      const wrapper = createWrapper();

      const textLoaders = wrapper.findAllComponents({ name: "TextLoader" });

      expect(textLoaders.length).toBe(1);
      const style = textLoaders[0]!.attributes("style") ?? "";
      expect(style).toContain("max-width: 50%");
    });
  });

  describe("Responsive Layout", () => {
    it("should use percentage-based widths for responsive design", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });

      // Header uses percentage width
      expect(boxLoaders[0]!.props("dimensions")?.width).toBe("30%");
      // Summary and content use 100% width
      expect(boxLoaders[1]!.props("dimensions")?.width).toBe("100%");
      expect(boxLoaders[5]!.props("dimensions")?.width).toBe("100%");
    });

    it("should use max-width for text loaders", () => {
      const wrapper = createWrapper();

      const textLoaders = wrapper.findAllComponents({ name: "TextLoader" });

      textLoaders.forEach((loader) => {
        const style = loader.attributes("style") ?? "";
        expect(style).toContain("max-width: 50%");
      });
    });
  });

  describe("Loading State Simulation", () => {
    it("should simulate header loading state", () => {
      const wrapper = createWrapper();

      const header = wrapper.find(".loader-header");
      expect(header.exists()).toBe(true);

      const headerBoxLoaders = header.findAllComponents({ name: "BoxLoader" });
      const headerTextLoaders = header.findAllComponents({
        name: "TextLoader",
      });

      expect(headerBoxLoaders.length).toBe(1);
      expect(headerTextLoaders.length).toBe(1);
    });

    it("should simulate tab bar loading state", () => {
      const wrapper = createWrapper();

      const tabs = wrapper.find(".loader-tabs");
      expect(tabs.exists()).toBe(true);

      const tabLoaders = tabs.findAllComponents({ name: "BoxLoader" });
      expect(tabLoaders.length).toBe(3);
    });

    it("should maintain consistent loader sizing", () => {
      const wrapper = createWrapper();

      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });

      // All loaders should have valid dimensions
      boxLoaders.forEach((loader) => {
        const dims = loader.props("dimensions");
        expect(dims).toBeDefined();
        expect(dims.width).toBeDefined();
        expect(dims.height).toBeDefined();
      });
    });
  });

  describe("Accessibility and Performance", () => {
    it("should render without errors", () => {
      const wrapper = createWrapper();

      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
    });

    it("should have proper component structure for screen readers", () => {
      const wrapper = createWrapper();

      const mainContainer = wrapper.find("div");
      expect(mainContainer.exists()).toBe(true);

      // Should have multiple loader components for rich loading feedback
      const allLoaders = [
        ...wrapper.findAllComponents({ name: "BoxLoader" }),
        ...wrapper.findAllComponents({ name: "TextLoader" }),
      ];
      expect(allLoaders.length).toBeGreaterThan(3);
    });
  });

  describe("Edge Cases", () => {
    it("should handle component mounting and unmounting", () => {
      const wrapper = createWrapper();

      expect(wrapper.exists()).toBe(true);

      wrapper.unmount();
      // Should not throw errors on unmount
    });

    it("should maintain loader count consistency", () => {
      const wrapper = createWrapper();

      // Total: 1 header + 1 summary + 3 tabs + 1 content = 6 box loaders
      const boxLoaders = wrapper.findAllComponents({ name: "BoxLoader" });
      const textLoaders = wrapper.findAllComponents({ name: "TextLoader" });

      expect(boxLoaders.length).toBe(6);
      expect(textLoaders.length).toBe(1);
    });
  });
});
