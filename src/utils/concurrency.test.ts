import { describe, expect, it } from "vitest";

import { runWithConcurrency } from "./concurrency";

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("runWithConcurrency", () => {
  it("never runs more than `limit` workers at once and processes every item", async () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    const gates = items.map(() => deferred());
    const started: number[] = [];
    const finished: number[] = [];
    let active = 0;
    let maxActive = 0;

    const run = runWithConcurrency(items, 4, async (item) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      started.push(item);
      await gates[item]!.promise;
      active -= 1;
      finished.push(item);
    });

    await flush();
    expect(started).toEqual([0, 1, 2, 3]);

    gates[1]!.resolve();
    await flush();
    expect(started).toEqual([0, 1, 2, 3, 4]);

    gates.forEach((gate) => gate.resolve());
    await run;

    expect(maxActive).toBe(4);
    expect(finished.sort((a, b) => a - b)).toEqual(items);
  });

  it("copes with a limit larger than the number of items and with no items", async () => {
    const seen: string[] = [];
    await runWithConcurrency(["a", "b"], 10, async (item) => {
      seen.push(item);
    });
    expect(seen).toEqual(["a", "b"]);

    await expect(
      runWithConcurrency([], 3, async () => {
        throw new Error("should not run");
      }),
    ).resolves.toBeUndefined();
  });

  it("passes the item index to the worker", async () => {
    const indices: number[] = [];
    await runWithConcurrency(["x", "y", "z"], 2, async (_item, index) => {
      indices.push(index);
    });
    expect(indices.sort()).toEqual([0, 1, 2]);
  });

  it("propagates a worker rejection", async () => {
    await expect(
      runWithConcurrency([1, 2, 3], 2, async (item) => {
        if (item === 2) throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});
