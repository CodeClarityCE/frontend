/**
 * Filters out undefined values from an object.
 * This is useful for vee-validate's componentField bindings which may contain
 * undefined values that violate exactOptionalPropertyTypes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterUndefined<T extends object>(obj: T): any {
    return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined));
}
