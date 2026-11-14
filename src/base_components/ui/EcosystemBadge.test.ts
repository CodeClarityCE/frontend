import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import { ECOSYSTEMS, PackageEcosystem } from "@/utils/packageEcosystem";

import EcosystemBadge from "./EcosystemBadge.vue";

describe("EcosystemBadge", () => {
  it("shows the ecosystem name and names the language on hover", () => {
    const wrapper = mount(EcosystemBadge, {
      props: { ecosystem: ECOSYSTEMS[PackageEcosystem.PACKAGIST] },
    });

    expect(wrapper.text()).toContain("PHP");
    expect(wrapper.attributes("title")).toBe("PHP (PHP)");
    expect(wrapper.find("svg").exists()).toBe(true);
  });

  it("keeps the name for screen readers when it is hidden", () => {
    const wrapper = mount(EcosystemBadge, {
      props: { ecosystem: ECOSYSTEMS[PackageEcosystem.NPM], showName: false },
    });

    expect(wrapper.text()).not.toContain("JavaScript");
    expect(wrapper.attributes("aria-label")).toBe("JavaScript");
  });

  it("shows an unknown ecosystem without a logo", () => {
    const wrapper = mount(EcosystemBadge, {
      props: { ecosystem: ECOSYSTEMS[PackageEcosystem.UNKNOWN] },
    });

    expect(wrapper.text()).toContain("Unknown");
    expect(wrapper.find("svg").exists()).toBe(false);
  });
});
