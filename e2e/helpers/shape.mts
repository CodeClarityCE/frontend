function kind(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/** Paths, with array indices written as `[]`, that a contract checks loosely. */
export interface ShapeRules {
  // Null on either side, or a captured empty array, is accepted here.
  nullable?: readonly string[];
  // Objects keyed by data (like a plugin's config): only the type is checked.
  records?: readonly string[];
}

/**
 * Lists where a fixture's JSON shape differs from a captured API response:
 * missing or extra keys and different types, null included. Values are
 * ignored, and array items are checked against the first captured item.
 */
export function shapeDiff(
  fixture: unknown,
  captured: unknown,
  rules: ShapeRules = {},
  path = "$",
): string[] {
  const a = kind(fixture);
  const b = kind(captured);
  const rulePath = path.replace(/\[\d+\]/g, "[]");
  if (rules.nullable?.includes(rulePath)) {
    if (a === "null" || b === "null") return [];
    if (b === "array" && (captured as unknown[]).length === 0) return [];
  }
  if (a !== b) return [`${path}: fixture is ${a}, the API returns ${b}`];
  if (rules.records?.includes(rulePath)) return [];

  if (a === "array") {
    const items = captured as unknown[];
    const fixtureItems = fixture as unknown[];
    if (items.length === 0) {
      return fixtureItems.length === 0
        ? []
        : [
            `${path}: the API returned an empty array, so its items are unchecked`,
          ];
    }
    return fixtureItems.flatMap((item, i) =>
      shapeDiff(item, items[0], rules, `${path}[${i}]`),
    );
  }

  if (a !== "object") return [];
  const f = fixture as Record<string, unknown>;
  const c = captured as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(f), ...Object.keys(c)])].sort();
  return keys.flatMap((key) => {
    const at = `${path}.${key}`;
    if (!(key in c))
      return [`${at}: fixture has it, the API does not return it`];
    if (!(key in f)) return [`${at}: the API returns it, the fixture lacks it`];
    return shapeDiff(f[key], c[key], rules, at);
  });
}
