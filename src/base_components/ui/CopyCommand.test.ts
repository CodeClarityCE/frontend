import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import CopyCommand from "./CopyCommand.vue";

describe("CopyCommand", () => {
  const writeText = vi.fn<(text: string) => Promise<void>>();

  afterEach(() => {
    writeText.mockReset();
    vi.unstubAllGlobals();
  });

  it("shows the command and copies it to the clipboard", async () => {
    writeText.mockResolvedValue();
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const wrapper = mount(CopyCommand, {
      props: {
        command: "npm diff --diff=a@1 --diff=a@2",
        label: "registry diff",
      },
    });

    expect(wrapper.find("code").text()).toBe("npm diff --diff=a@1 --diff=a@2");
    const button = wrapper.get("button");
    expect(button.attributes("aria-label")).toBe("Copy registry diff command");

    await button.trigger("click");
    await flushPromises();

    expect(writeText).toHaveBeenCalledWith("npm diff --diff=a@1 --diff=a@2");
    expect(wrapper.get('[role="status"]').text()).toBe("Copied");
  });

  it("says when the clipboard refuses the copy", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const wrapper = mount(CopyCommand, { props: { command: "ls" } });

    await wrapper.get("button").trigger("click");
    await flushPromises();

    expect(wrapper.get("button").attributes("aria-label")).toBe("Copy command");
    expect(wrapper.get('[role="status"]').text()).toBe("Could not copy");
  });
});
