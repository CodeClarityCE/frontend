import type { DependencyDetails } from "./SbomDetails";

// A dependency as the details endpoint returns it, for tests.
export function dependency(
  overrides: Partial<DependencyDetails> = {},
): DependencyDetails {
  return {
    name: "lodash",
    version: "4.17.20",
    latest_version: "4.17.21",
    dependencies: {},
    dev_dependencies: {},
    transitive: false,
    source: { Type: "git", Url: "git+https://github.com/lodash/lodash.git" },
    package_manager: "NPM",
    license: "MIT",
    engines: { node: ">=4" },
    release_date: new Date("2020-08-13T00:00:00Z"),
    lastest_release_date: new Date("2021-02-20T00:00:00Z"),
    vulnerabilities: [],
    severity_dist: { critical: 0, high: 0, medium: 0, low: 0, none: 0 },
    ...overrides,
  };
}
