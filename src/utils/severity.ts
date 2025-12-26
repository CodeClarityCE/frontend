export function isNoneSeverity(n: number): boolean {
  return n === 0.0 || n === undefined;
}
export function isLowSeverity(n: number): boolean {
  return n < 4.0 && n > 0.0;
}
export function isMediumSeverity(n: number): boolean {
  return n >= 4.0 && n < 7.0;
}
export function isHighSeverity(n: number): boolean {
  return n >= 7.0 && n < 9.0;
}
export function isCriticalSeverity(n: number): boolean {
  return n >= 9.0;
}
