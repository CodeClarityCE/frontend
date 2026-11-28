import { render, screen } from "@testing-library/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

import { createTestApp, type TestApp, withToaster } from "../../tests/real-app";

import { copyToClipboard } from "./clipboard";

const writeText = vi.fn<(text: string) => Promise<void>>();

// Renders only the app's toaster, so a toast shows up as text.
function showToaster(app: TestApp): void {
  render(withToaster(defineComponent(() => () => h("div"))), {
    global: app.global,
  });
}

describe("copyToClipboard", () => {
  let app: TestApp;

  beforeEach(() => {
    app = createTestApp({ signedIn: true });
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    showToaster(app);
  });

  afterEach(() => {
    writeText.mockReset();
    vi.unstubAllGlobals();
  });

  it("copies the text and resolves true", async () => {
    writeText.mockResolvedValue();

    await expect(copyToClipboard("npm install ms@^2.1.3")).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith("npm install ms@^2.1.3");
  });

  it("tells the user when the browser refuses, without throwing or reporting", async () => {
    writeText.mockRejectedValue(
      new DOMException(
        "Failed to execute 'writeText' on 'Clipboard': Write permission denied.",
        "NotAllowedError",
      ),
    );

    await expect(copyToClipboard("npm install ms@^2.1.3")).resolves.toBe(false);

    expect(
      await screen.findByText(
        "Couldn't copy. Select the text and copy it yourself.",
      ),
    ).toBeTruthy();
    expect(app.http.requests.some((r) => r.path === "/logs")).toBe(false);
  });

  it("tells the user when the page has no clipboard at all", async () => {
    vi.stubGlobal("navigator", { ...navigator, clipboard: undefined });

    await expect(copyToClipboard("ls")).resolves.toBe(false);

    expect(
      await screen.findByText(
        "Couldn't copy. Select the text and copy it yourself.",
      ),
    ).toBeTruthy();
  });
});
