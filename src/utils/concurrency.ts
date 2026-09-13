/**
 * Run `worker` over `items` with at most `limit` invocations in flight.
 *
 * Items are handed out in order as lanes free up. A rejection from `worker`
 * propagates and stops handing out further items, so callers that want
 * per-item error handling catch inside `worker`.
 */
export async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const lanes = Math.max(1, Math.min(Math.floor(limit), items.length));
  let next = 0;

  const lane = async (): Promise<void> => {
    while (next < items.length) {
      const index = next;
      next += 1;
      await worker(items[index] as T, index);
    }
  };

  await Promise.all(Array.from({ length: lanes }, () => lane()));
}
