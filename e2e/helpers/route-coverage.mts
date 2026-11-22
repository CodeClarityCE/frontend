import { posix } from "node:path";
import ts from "typescript";

// A page of the app: a route, one of its known subpages, or a results tab.
export interface AppRoute {
  key: string;
  path: string;
}

/** Lists what is wrong with the route registry; an empty list means every page has a spec. */
export function routeCoverageProblems(input: {
  routes: AppRoute[];
  registry: Record<string, string>;
  specFiles: string[];
}): string[] {
  const { routes, registry, specFiles } = input;
  const problems: string[] = [];
  for (const route of routes) {
    const spec = registry[route.key];
    if (spec === undefined)
      problems.push(
        `${route.key} (${route.path}) has no spec registered in e2e/route-registry.mts`,
      );
    else if (!specFiles.includes(spec))
      problems.push(
        `${route.key} (${route.path}) is registered against e2e/${spec}, which does not exist`,
      );
  }
  const keys = new Set(routes.map((route) => route.key));
  for (const key of Object.keys(registry)) {
    if (!keys.has(key))
      problems.push(
        `${key} is in e2e/route-registry.mts but there is no such route in src/router.ts`,
      );
  }
  return problems;
}

// Subpages are the literals a view compares its :page param (or a view derived from it) with.
const SUBPAGE = /\b(?:page|view)\s*===\s*(["'])([^"']+)\1/g;
// Results tabs are the keys of the view's `const tab = ref({ ... })`.
const TABS = /const tab = ref\(\{([^}]*)\}\)/;
const TAB_KEY = /["']?([\w-]+)["']?\s*:/g;
// A subpage's component is the element whose v-if picks that subpage.
const SUBPAGE_ELEMENT =
  /<([A-Z]\w*)\b[^>]*?\bv-(?:else-)?if="[^"]*?\b(?:page|view)\s*===\s*(["'])([^"']+)\2/g;
// Components a view imports, lazily or statically, by name.
const LAZY_IMPORT =
  /const (\w+) = defineAsyncComponent\([^;]*?import\((["'])([^"']+)\2/g;
const STATIC_IMPORT = /import (\w+) from (["'])([^"']+)\2/g;
// A subpage component's `?tab=` values are the literals it compares `tab` with.
const QUERY_TAB = /\btab\s*===\s*(["'])([\w-]+)\1/g;

/**
 * Lists the pages of the app from the router source: each named route, the
 * subpages its view switches on, and its `?tab=` values. `readView` returns a
 * view's source from its import path, as written in the router.
 */
export function discoverRoutes(
  routerSource: string,
  readView: (importPath: string) => string,
): AppRoute[] {
  const file = ts.createSourceFile(
    "router.ts",
    routerSource,
    ts.ScriptTarget.Latest,
  );
  const imports = new Map<string, string>();
  const routes: AppRoute[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isImportDeclaration(node) &&
      node.importClause?.name &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      imports.set(node.importClause.name.text, node.moduleSpecifier.text);
    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(file) === "routes" &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const element of node.initializer.elements)
        if (ts.isObjectLiteralExpression(element))
          routes.push(...routePages(element, file, imports, readView));
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return routes;
}

// The pages one route object opens; none for a redirect.
function routePages(
  route: ts.ObjectLiteralExpression,
  file: ts.SourceFile,
  imports: Map<string, string>,
  readView: (importPath: string) => string,
): AppRoute[] {
  const field = (name: string): ts.Expression | undefined =>
    route.properties
      .filter(ts.isPropertyAssignment)
      .find((p) => p.name.getText(file) === name)?.initializer;
  const name = field("name");
  const path = field("path");
  let component = field("component");
  if (!name || !path || !component) return [];
  if (!ts.isStringLiteral(name) || !ts.isStringLiteral(path)) return [];
  while (ts.isAsExpression(component)) component = component.expression;
  const from = imports.get(component.getText(file));
  const view = from === undefined ? "" : readView(from);

  const keys = [name.text];
  // Subpages come from the URL, so only a route with a :page param has them.
  if (path.text.includes("/:page")) {
    for (const match of view.matchAll(SUBPAGE))
      keys.push(`${name.text}/${match[2]}`);
    if (from !== undefined)
      for (const [subpage, tab] of subpageTabs(view, from, readView))
        keys.push(`${name.text}/${subpage}?tab=${tab}`);
  }
  const tabs = TABS.exec(view.replace(/\/\/.*$/gm, ""))?.[1] ?? "";
  for (const match of tabs.matchAll(TAB_KEY))
    keys.push(`${name.text}?tab=${match[1]}`);
  return [...new Set(keys)].map((key) => ({ key, path: path.text }));
}

// The [subpage, tab] pairs read by the components a view renders per subpage.
function subpageTabs(
  view: string,
  from: string,
  readView: (importPath: string) => string,
): [string, string][] {
  const imports = new Map<string, string>();
  for (const match of [
    ...view.matchAll(LAZY_IMPORT),
    ...view.matchAll(STATIC_IMPORT),
  ])
    imports.set(match[1]!, match[3]!);
  const pairs: [string, string][] = [];
  for (const [, element, , subpage] of view.matchAll(SUBPAGE_ELEMENT)) {
    const child = imports.get(element!);
    if (child === undefined) continue;
    const path = child.startsWith(".")
      ? posix.join(posix.dirname(from), child)
      : child;
    for (const match of readView(path).matchAll(QUERY_TAB))
      pairs.push([subpage!, match[2]!]);
  }
  return pairs;
}
