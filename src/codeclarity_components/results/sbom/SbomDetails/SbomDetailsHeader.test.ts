import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";

import { dependency } from "./dependency.fixture";
import SbomDetailsHeader from "./SbomDetailsHeader.vue";

function links(overrides: Parameters<typeof dependency>[0] = {}) {
  render(SbomDetailsHeader, { props: { dependency: dependency(overrides) } });
  return screen.queryAllByRole("link").map((link) => ({
    name: link.textContent?.replace(/\s+/g, " ").trim(),
    href: link.getAttribute("href"),
    target: link.getAttribute("target"),
  }));
}

describe("SbomDetailsHeader", () => {
  it("links an npm package to its registries and repository", () => {
    expect(links()).toEqual([
      {
        name: "npm (opens in a new tab)",
        href: "https://www.npmjs.com/package/lodash/v/4.17.20",
        target: "_blank",
      },
      {
        name: "Yarn (opens in a new tab)",
        href: "https://yarnpkg.com/package?name=lodash&version=4.17.20",
        target: "_blank",
      },
      {
        name: "GitHub (opens in a new tab)",
        href: "https://github.com/lodash/lodash.git",
        target: "_blank",
      },
    ]);
  });

  it("links a Composer package to Packagist and GitLab", () => {
    const result = links({
      name: "monolog/monolog",
      version: "3.0.0",
      package_manager: "COMPOSER",
      source: { Type: "git", Url: "https://gitlab.com/monolog/monolog" },
    });
    expect(result.map((link) => link.href)).toEqual([
      "https://packagist.org/packages/monolog/monolog#3.0.0",
      "https://gitlab.com/monolog/monolog",
    ]);
  });

  it("shows no list when there is nothing to link", () => {
    expect(links({ package_manager: "PIP", source: undefined })).toEqual([]);
    expect(screen.queryByRole("list")).toBeNull();
  });
});
