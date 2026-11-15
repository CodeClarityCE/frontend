import type { Plugin } from "@/codeclarity_components/organizations/analyzers/Plugin";

// The same rules the API applies when an analyzer is saved: a plugin needs one
// of the SBOM producers it lists plus every other plugin it depends on.

/** SBOM producers are named "<language>-sbom". */
export function isSbomProducer(name: string): boolean {
  return name.endsWith("-sbom");
}

/** What a plugin lacks in a workflow holding `present`, e.g. ["js-sbom or php-sbom"]. */
function missingDependencies(plugin: Plugin, present: Set<string>): string[] {
  const missing: string[] = [];
  const sbom = plugin.depends_on.filter(isSbomProducer);
  if (sbom.length > 0 && !sbom.some((name) => present.has(name))) {
    missing.push(sbom.join(" or "));
  }
  for (const name of plugin.depends_on) {
    if (!isSbomProducer(name) && !present.has(name)) missing.push(name);
  }
  return missing;
}

/**
 * The installed plugins to add for `plugin`, dependencies first. Only the
 * first installed SBOM producer is added, and only when none is present.
 */
export function pluginsToAdd(
  plugin: Plugin,
  present: string[],
  installed: Plugin[],
): Plugin[] {
  const have = new Set(present);
  const added: Plugin[] = [];
  const visit = (current: Plugin): void => {
    if (have.has(current.name)) return;
    have.add(current.name);
    const sbom = current.depends_on.filter(isSbomProducer);
    const needed = current.depends_on.filter((name) => !isSbomProducer(name));
    if (!sbom.some((name) => have.has(name))) {
      const first = sbom.find((name) => installed.some((p) => p.name === name));
      if (first) needed.unshift(first);
    }
    for (const name of needed) {
      const dependency = installed.find((p) => p.name === name);
      if (dependency) visit(dependency);
    }
    added.push(current);
  };
  visit(plugin);
  return added;
}

/** Why an analyzer of these plugins cannot be saved, or null when it can. */
export function workflowProblem(plugins: Plugin[]): string | null {
  if (plugins.length === 0) return "Add at least one plugin to the analyzer.";
  const present = new Set(plugins.map((p) => p.name));
  for (const plugin of plugins) {
    const missing = missingDependencies(plugin, present);
    if (missing.length > 0) {
      return `${plugin.name} needs ${missing.join(" and ")}. Add ${missing.length > 1 ? "them" : "it"} to the analyzer.`;
    }
  }
  return null;
}
