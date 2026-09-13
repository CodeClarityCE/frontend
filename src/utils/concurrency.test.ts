import { describe, expect, it } from "vitest";

import { runWithConcurrency } from "./concurrency";

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason: unknown) => void;
}

function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
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

  it("stops handing out further items once a worker rejects", async () => {
    const gates = [0, 1, 2, 3].map(() => deferred());
    const started: number[] = [];

    const run = runWithConcurrency([0, 1, 2, 3], 2, async (item) => {
      started.push(item);
      await gates[item]!.promise;
    });
    await flush();
    expect(started).toEqual([0, 1]);

    gates[1]!.reject(new Error("boom"));
    await expect(run).rejects.toThrow("boom");

    gates[0]!.resolve();
    await flush();
    expect(started).toEqual([0, 1]);
  });

  it.each([Number.NaN, 0, -3])(
    "runs one item at a time for the limit %s",
    async (limit) => {
      const seen: number[] = [];
      let active = 0;
      let maxActive = 0;

      await runWithConcurrency([1, 2, 3], limit, async (item) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        seen.push(item);
        await flush();
        active -= 1;
      });

      expect(seen).toEqual([1, 2, 3]);
      expect(maxActive).toBe(1);
    },
  );

  it("treats an infinite limit as one lane per item", async () => {
    let active = 0;
    let maxActive = 0;

    await runWithConcurrency([1, 2, 3], Number.POSITIVE_INFINITY, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await flush();
      active -= 1;
    });

    expect(maxActive).toBe(3);
  });
});
