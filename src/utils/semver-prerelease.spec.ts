import { describe, expect, it } from "vitest";

import { isPrerelease, shouldRecommendUpgrade } from "./semver";

// Test the filtering logic that would be used in the component
function shouldFilterNotification(notification: {
  content_type: string;
  content?: { new_version?: string; current_version?: string };
}): boolean {
  // Filter out package update notifications that shouldn't be recommended
  if (notification.content_type === "package_update") {
    const currentVersion = notification.content?.current_version;
    const newVersion = notification.content?.new_version;

    if (currentVersion && newVersion) {
      // Use the semver utility to determine if this upgrade should be recommended
      return !shouldRecommendUpgrade(currentVersion, newVersion);
    }
  }
  return false;
}

describe("prerelease filtering logic", () => {
  describe("isPrerelease", () => {
    it("should detect prerelease versions with dash", () => {
      expect(isPrerelease("1.6.0-bigip.6")).toBe(true);
      expect(isPrerelease("2.0.0-alpha.1")).toBe(true);
      expect(isPrerelease("1.0.0-beta")).toBe(true);
      expect(isPrerelease("3.1.0-rc.2")).toBe(true);
    });

    it("should not detect stable versions as prerelease", () => {
      expect(isPrerelease("1.6.0")).toBe(false);
      expect(isPrerelease("2.0.0")).toBe(false);
      expect(isPrerelease("10.15.3")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isPrerelease("")).toBe(false);
      expect(isPrerelease("1.0")).toBe(false);
      expect(isPrerelease("v1.0.0")).toBe(false);
    });
  });

  describe("shouldFilterNotification", () => {
    it("should filter out package updates to prerelease versions from stable versions", () => {
      const notification = {
        content_type: "package_update",
        content: {
          current_version: "1.5.2",
          new_version: "1.6.0-bigip.6",
        },
      };
      expect(shouldFilterNotification(notification)).toBe(true);
    });

    it("should keep package updates from prerelease to prerelease", () => {
      const notification = {
        content_type: "package_update",
        content: {
          current_version: "1.6.0-alpha.1",
          new_version: "1.6.0-alpha.2",
        },
      };
      expect(shouldFilterNotification(notification)).toBe(false);
    });

    it("should keep package updates from prerelease to stable", () => {
      const notification = {
        content_type: "package_update",
        content: {
          current_version: "1.6.0-rc.1",
          new_version: "1.6.0",
        },
      };
      expect(shouldFilterNotification(notification)).toBe(false);
    });

    it("should keep package updates between stable versions", () => {
      const notification = {
        content_type: "package_update",
        content: {
          current_version: "1.5.2",
          new_version: "1.6.0",
        },
      };
      expect(shouldFilterNotification(notification)).toBe(false);
    });

    it("should not filter non-package-update notifications", () => {
      const vulnerabilityNotification = {
        content_type: "vuln_summary",
        content: {
          current_version: "1.5.2",
          new_version: "1.6.0-alpha.1",
        },
      };
      expect(shouldFilterNotification(vulnerabilityNotification)).toBe(false);

      const fixNotification = {
        content_type: "fix_available",
        content: {
          current_version: "1.5.2",
          new_version: "1.6.0-beta.1",
        },
      };
      expect(shouldFilterNotification(fixNotification)).toBe(false);
    });

    it("should handle missing version information gracefully", () => {
      const notificationWithoutVersions = {
        content_type: "package_update",
        content: {},
      };
      expect(shouldFilterNotification(notificationWithoutVersions)).toBe(false);

      const notificationWithoutNewVersion = {
        content_type: "package_update",
        content: {
          current_version: "1.5.2",
        },
      };
      expect(shouldFilterNotification(notificationWithoutNewVersion)).toBe(
        false,
      );
    });

    it("should handle real-world examples", () => {
      // Example from the screenshot: @unovis/vue 1.5.2 → 1.6.0-bigip.6
      const unovisNotification = {
        content_type: "package_update",
        content: {
          current_version: "1.5.2",
          new_version: "1.6.0-bigip.6",
        },
      };
      expect(shouldFilterNotification(unovisNotification)).toBe(true);

      // Common prerelease patterns
      const alphaNotification = {
        content_type: "package_update",
        content: {
          current_version: "2.0.0",
          new_version: "2.1.0-alpha.1",
        },
      };
      expect(shouldFilterNotification(alphaNotification)).toBe(true);

      const betaNotification = {
        content_type: "package_update",
        content: {
          current_version: "3.0.0",
          new_version: "3.1.0-beta.5",
        },
      };
      expect(shouldFilterNotification(betaNotification)).toBe(true);
    });
  });
});
