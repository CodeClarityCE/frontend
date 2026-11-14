import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import type { License } from "./License";
import LicenseComponent from "./LicenseComponent.vue";

function license(overrides: Partial<License> = {}): License {
  return {
    id: "MIT",
    licenseId: "MIT",
    name: "MIT License",
    description: "A short and simple permissive license.",
    license_category: "permissive",
    license_compliance_violation: false,
    unable_to_infer: false,
    deps_using_license: ["express@4.18.2", "ms@2.1.3"],
    license_properties: {
      permissions: ["commercial-use", "patent-use"],
      conditions: ["include-copyright"],
      limitations: ["liability", "patent-use"],
      usage: "",
    },
    references: ["https://opensource.org/licenses/MIT"],
    _key: "MIT",
    ...overrides,
  };
}

async function open(value: License): Promise<HTMLElement> {
  render(LicenseComponent, {
    props: { license: value, analysisID: "a-1", projectID: "p-1" },
  });
  await userEvent.click(
    screen.getByRole("button", { name: `Details of ${value.name}` }),
  );
  return screen.getByRole("dialog", { name: value.name });
}

describe("LicenseComponent", () => {
  it("opens the license with its status and type", async () => {
    const dialog = await open(license());
    expect(within(dialog).getByText("Compliant")).toBeTruthy();
    expect(within(dialog).getByText("Permissive license")).toBeTruthy();
    expect(
      within(dialog).getByText("A short and simple permissive license."),
    ).toBeTruthy();
  });

  it("explains what the license allows, requires and limits", async () => {
    const dialog = await open(license());
    expect(
      within(dialog).getByRole("heading", { name: /Permissions/ }),
    ).toBeTruthy();
    expect(within(dialog).getByText("Commercial Use")).toBeTruthy();
    expect(
      within(dialog).getByText(
        "This license provides an express grant of patent rights from contributors.",
      ),
    ).toBeTruthy();
    expect(
      within(dialog).getByText(
        "This license explicitly states that it does NOT grant any rights in the patents of contributors.",
      ),
    ).toBeTruthy();
    expect(within(dialog).getByText("choosealicense.com")).toBeTruthy();
  });

  it("links to every dependency that uses it", async () => {
    const dialog = await open(license());
    expect(
      within(dialog).getByRole("heading", {
        name: "Dependencies using it (2)",
      }),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("link", { name: "express@4.18.2" }),
    ).toBeTruthy();
  });

  it("opens references in a new tab and says so", async () => {
    const dialog = await open(license());
    const link = within(dialog).getByRole("link", {
      name: "opensource.org (opens in a new tab)",
    });
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("shows Violation for a license against the policy", async () => {
    const dialog = await open(
      license({
        id: "GPL-3.0",
        name: "GNU GPL v3",
        license_category: "copyleft",
        license_compliance_violation: true,
      }),
    );
    expect(within(dialog).getByText("Violation")).toBeTruthy();
    expect(within(dialog).getByText("Copyleft license")).toBeTruthy();
    expect(within(dialog).getByText("(GPL-3.0)")).toBeTruthy();
  });

  it("leaves out the property sections when none are known", async () => {
    const dialog = await open(
      license({
        license_properties: null as unknown as License["license_properties"],
      }),
    );
    expect(
      within(dialog).queryByRole("heading", { name: /Permissions/ }),
    ).toBeNull();
    expect(within(dialog).queryByText("choosealicense.com")).toBeNull();
  });
});
