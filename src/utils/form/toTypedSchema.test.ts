import type { InferInput, InferOutput } from "vee-validate";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as z from "zod";

import { requiredMessage, toTypedSchema } from "./toTypedSchema";

const schema = z
  .object({
    name: z
      .string({ error: requiredMessage("A name is required") })
      .trim()
      .min(2, "At least 2 characters"),
    email: z.string().optional(),
    isDefault: z.boolean().default(false),
    address: z.object({ city: z.string().min(1, "Enter a city") }),
    tags: z.array(z.string().min(1, "Tags cannot be empty")),
    password: z.string(),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "The passwords do not match",
    path: ["confirm"],
  });

const valid = {
  name: "  Alice ",
  address: { city: "Paris" },
  tags: ["a"],
  password: "secret",
  confirm: "secret",
};

describe("toTypedSchema", () => {
  it("returns the parsed output for valid input", async () => {
    const result = await toTypedSchema(schema).parse(valid);

    expect(result.errors).toEqual([]);
    expect(result.value).toEqual({
      name: "Alice",
      isDefault: false,
      address: { city: "Paris" },
      tags: ["a"],
      password: "secret",
      confirm: "secret",
    });
  });

  it("types the output as the schema's output and the input as partial", () => {
    type Typed = ReturnType<typeof toTypedSchema<typeof schema>>;

    expectTypeOf<InferOutput<Typed>>().toEqualTypeOf<z.output<typeof schema>>();
    expectTypeOf<InferInput<Typed>>().toMatchTypeOf<{
      name?: string;
      address?: { city?: string };
      tags?: (string | undefined)[];
    }>();
    expectTypeOf<{ address: { city: string } }>().toMatchTypeOf<
      InferInput<Typed>
    >();
  });

  it("gives a field's own message for an empty value and for a missing one", async () => {
    const typed = toTypedSchema(schema);

    const empty = await typed.parse({ ...valid, name: " " });
    const missing = await typed.parse({ ...valid, name: undefined });

    expect(empty.errors).toEqual([
      { path: "name", errors: ["At least 2 characters"] },
    ]);
    expect(missing.errors).toEqual([
      { path: "name", errors: ["A name is required"] },
    ]);
  });

  it("says Required for a missing field without its own message", async () => {
    const result = await toTypedSchema(schema).parse({
      ...valid,
      password: undefined,
    });

    expect(result.errors).toContainEqual({
      path: "password",
      errors: ["Required"],
    });
  });

  it("reports a nested field error at its dotted path", async () => {
    const result = await toTypedSchema(schema).parse({
      ...valid,
      address: { city: "" },
    });

    expect(result.errors).toEqual([
      { path: "address.city", errors: ["Enter a city"] },
    ]);
  });

  it("reports an array item error at its bracket path", async () => {
    const result = await toTypedSchema(schema).parse({
      ...valid,
      tags: ["a", ""],
    });

    expect(result.errors).toEqual([
      { path: "tags[1]", errors: ["Tags cannot be empty"] },
    ]);
  });

  it("reports a refinement at the path it names", async () => {
    const result = await toTypedSchema(schema).parse({
      ...valid,
      confirm: "other",
    });

    expect(result.errors).toEqual([
      { path: "confirm", errors: ["The passwords do not match"] },
    ]);
  });

  it("collects the messages of each union option", async () => {
    const union = z.object({
      id: z.union([
        z.string().min(3, "Too short"),
        z.number({ error: "Not a number" }),
      ]),
    });

    const result = await toTypedSchema(union).parse({ id: "a" });

    expect(result.errors).toContainEqual({
      path: "id",
      errors: expect.arrayContaining(["Too short"]),
    });
  });

  it("casts partial values by filling in the schema's defaults", () => {
    const cast = toTypedSchema(schema).cast?.({ name: "Bob" });

    expect(cast).toEqual({
      name: "Bob",
      email: undefined,
      isDefault: false,
      address: { city: undefined },
      tags: undefined,
      password: undefined,
      confirm: undefined,
    });
  });

  it("describes which fields are required and which exist", () => {
    const typed = toTypedSchema(schema);

    expect(typed.describe?.("name")).toEqual({ required: true, exists: true });
    expect(typed.describe?.("email")).toEqual({
      required: false,
      exists: true,
    });
    expect(typed.describe?.("isDefault")).toEqual({
      required: false,
      exists: true,
    });
    expect(typed.describe?.("address.city")).toEqual({
      required: true,
      exists: true,
    });
    expect(typed.describe?.("tags[0]")).toEqual({
      required: true,
      exists: true,
    });
    expect(typed.describe?.("nope" as "name")).toEqual({
      required: false,
      exists: false,
    });
    expect(typed.describe?.()).toEqual({ required: true, exists: true });
  });
});
