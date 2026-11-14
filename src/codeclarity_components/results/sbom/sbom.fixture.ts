import type { Dependency } from "@/codeclarity_components/results/graph.entity";

// A dependency as the SBOM endpoint returns it, for tests.
export function sbomDependency(
  name: string,
  version: string,
  overrides: Partial<Dependency> = {},
): Dependency {
  return {
    name,
    version,
    newest_release: version,
    key: `${name}@${version}`,
    purl: `pkg:npm/${name}@${version}`,
    is_direct: false,
    is_direct_count: 0,
    is_transitive: true,
    is_transitive_count: 1,
    prod: true,
    dev: false,
    deprecated: false,
    deprecated_message: "",
    outdated: false,
    licenses: [{ id: "MIT" }],
    ...overrides,
  } as unknown as Dependency;
}
