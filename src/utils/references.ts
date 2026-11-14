export interface Reference {
  url: string;
  tags: string[];
}

// One entry per URL, keeping every tag the duplicates carried.
export function uniqueReferences<T extends Reference>(
  references: readonly T[] | null | undefined,
): T[] {
  const byUrl = new Map<string, T>();
  for (const reference of references ?? []) {
    const seen = byUrl.get(reference.url);
    if (!seen) {
      byUrl.set(reference.url, { ...reference, tags: [...reference.tags] });
    } else {
      for (const tag of reference.tags) {
        if (!seen.tags.includes(tag)) seen.tags.push(tag);
      }
    }
  }
  return [...byUrl.values()];
}
