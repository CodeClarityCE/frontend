function kind(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

/**
 * Lists where a fixture's JSON shape differs from a captured API response:
 * missing or extra keys and different types. Values are ignored, null matches
 * any type, and array items are checked against the first captured item.
 */
export function shapeDiff(
  fixture: unknown,
  captured: unknown,
  path = "$",
): string[] {
  const a = kind(fixture);
  const b = kind(captured);
  if (a === "null" || b === "null") return [];
  if (a !== b) return [`${path}: fixture is ${a}, the API returns ${b}`];

  if (a === "array") {
    const items = captured as unknown[];
    if (items.length === 0) return [];
    return (fixture as unknown[]).flatMap((item, i) =>
      shapeDiff(item, items[0], `${path}[${i}]`),
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
    return shapeDiff(f[key], c[key], at);
  });
}
