/**
 * Run `worker` over `items` with at most `limit` invocations in flight.
 *
 * Items are handed out in order as lanes free up. The first rejection from
 * `worker` stops handing out further items and is rethrown; calls already in
 * flight are not cancelled. Callers that want per-item error handling catch
 * inside `worker`. A limit below 1, or NaN, runs one item at a time.
 */
export async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const laneCount = Number.isNaN(limit)
    ? 1
    : Math.max(1, Math.min(Math.floor(limit), items.length));
  let nextIndex = 0;
  let failed = false;

  const lane = async (): Promise<void> => {
    while (!failed && nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        await worker(items[index] as T, index);
      } catch (err) {
        failed = true;
        throw err;
      }
    }
  };

  await Promise.all(Array.from({ length: laneCount }, () => lane()));
}
