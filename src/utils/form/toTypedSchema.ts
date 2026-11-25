// vee-validate's TypedSchema for a zod 4 schema, in place of @vee-validate/zod (zod 3 only).
import {
  cleanupNonNestedPath,
  isNotNestedPath,
  type TypedSchema,
  type TypedSchemaError,
  type TypedSchemaPathDescription,
} from "vee-validate";
import * as z from "zod";

// Every key optional, all the way down, as form values are while being typed.
type DeepPartial<T> = T extends (infer U)[]
  ? (DeepPartial<U> | undefined)[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

type Issue = z.core.$ZodIssue;

// A missing value reads "Required" unless the field sets its own message.
const parseOptions: z.core.ParseContext<Issue> = {
  error: (issue) =>
    issue.code === "invalid_type" && issue.input === undefined
      ? "Required"
      : undefined,
};

/** The field's message for a missing value; other errors keep their own. */
export function requiredMessage(
  message: string,
): (issue: z.core.$ZodRawIssue) => string | undefined {
  return (issue) => (issue.input === undefined ? message : undefined);
}

// vee-validate paths use brackets for array indexes: tags[1].name.
function formPath(path: PropertyKey[]): string {
  return path.reduce<string>((joined, key) => {
    if (typeof key === "number") return `${joined}[${key}]`;
    const name = String(key);
    return joined === "" ? name : `${joined}.${name}`;
  }, "");
}

// Union option issues have paths relative to the union, so they get its path in front.
function collectIssues(
  issues: readonly Issue[],
  errors: Map<string, TypedSchemaError>,
  parent: PropertyKey[] = [],
): void {
  for (const issue of issues) {
    const fullPath = [...parent, ...issue.path];
    const path = formPath(fullPath);
    if (issue.code === "invalid_union") {
      collectIssues(issue.errors.flat(), errors, fullPath);
      if (path === "") continue;
    }
    const entry = errors.get(path) ?? { path, errors: [] };
    entry.errors.push(issue.message);
    errors.set(path, entry);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

// Copies source into target, merging nested plain objects.
function merge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const [key, value] of Object.entries(source)) {
    const current = target[key];
    target[key] =
      isPlainObject(value) && isPlainObject(current)
        ? merge(current, value)
        : value;
  }
  return target;
}

// Each key's .default() value; nested objects get theirs.
function defaultsOf(schema: z.ZodType): unknown {
  if (!(schema instanceof z.ZodObject)) return undefined;
  const shape = schema.shape as Record<string, z.ZodType>;
  return Object.fromEntries(
    Object.entries(shape).map(([key, field]) => {
      if (field instanceof z.ZodDefault) return [key, field.def.defaultValue];
      if (field instanceof z.ZodObject) return [key, defaultsOf(field)];
      return [key, undefined];
    }),
  );
}

// The schema of the field at a vee-validate path, or undefined.
function schemaAt(schema: z.ZodType, path: string): z.ZodType | undefined {
  const keys = isNotNestedPath(path)
    ? [cleanupNonNestedPath(path)]
    : path.split(/\.|\[(\d+)\]/).filter(Boolean);
  let current: z.ZodType | undefined = schema;
  for (const key of keys) {
    if (current instanceof z.ZodObject) {
      current = (current.shape as Record<string, z.ZodType | undefined>)[key];
    } else if (current instanceof z.ZodArray && /^\d+$/.test(key)) {
      current = current.element as z.ZodType;
    } else {
      return undefined;
    }
  }
  return current;
}

function describeSchema(
  schema: z.ZodType | undefined,
): TypedSchemaPathDescription {
  if (!schema) return { required: false, exists: false };
  return { required: !schema.safeParse(undefined).success, exists: true };
}

/** Wraps a zod 4 schema for vee-validate's `useForm({ validationSchema })`. */
export function toTypedSchema<
  TSchema extends z.ZodType,
  TOutput = z.output<TSchema>,
  TInput = DeepPartial<z.input<TSchema>>,
>(schema: TSchema): TypedSchema<TInput, TOutput> {
  return {
    __type: "VVTypedSchema",
    async parse(values) {
      const result = await schema.safeParseAsync(values, parseOptions);
      if (result.success) {
        return { value: result.data as TOutput, errors: [] };
      }
      const errors = new Map<string, TypedSchemaError>();
      collectIssues(result.error.issues, errors);
      return { errors: [...errors.values()] };
    },
    cast(values) {
      try {
        const parsed = schema.safeParse(values);
        if (parsed.success) return parsed.data as TInput;
      } catch {
        // An async schema cannot parse synchronously; fall back to the defaults.
      }
      // zod cannot cast, so fill the defaults in under the given values.
      const defaults = defaultsOf(schema);
      if (isPlainObject(defaults) && isPlainObject(values)) {
        return merge(defaults, values) as TInput;
      }
      return values as TInput;
    },
    describe(path) {
      try {
        return describeSchema(path ? schemaAt(schema, path) : schema);
      } catch {
        return { required: false, exists: false };
      }
    },
  };
}
