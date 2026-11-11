/** Formats a number for a content stream, at most `digits` decimals. */
export function num(value: number, digits = 3): string {
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** A point as two content stream numbers. */
export function point(x: number, y: number): string {
  return `${num(x)} ${num(y)}`;
}
