export function isNoneSeverity(n: number) {
    return n == 0.0 || n == undefined;
}
export function isLowSeverity(n: number) {
    return n < 4.0 && n > 0.0;
}
export function isMediumSeverity(n: number) {
    return n >= 4.0 && n < 7.0;
}
export function isHighSeverity(n: number) {
    return n >= 7.0 && n < 9.0;
}
export function isCriticalSeverity(n: number) {
    return n >= 9.0;
}
