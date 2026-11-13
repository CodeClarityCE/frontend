import { describe, expect, it } from "vitest";

describe("Data Display Index Exports", () => {
  it("exports the table components", async () => {
    const module = await import(`@/base_components/data-display`);

    expect(Object.keys(module).sort()).toEqual([
      "SortSelector",
      "SortableTable",
    ]);
  });

  it("direct imports match index exports", async () => {
    const indexModule = await import(`@/base_components/data-display`);
    const directTable = (
      await import(`@/base_components/data-display/tables/SortableTable.vue`)
    ).default;

    expect(indexModule.SortableTable).toBe(directTable);
  });
});
