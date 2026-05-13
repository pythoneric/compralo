// Two transforms applied on the way out of the API:
//   1. BigInt → number (FE works in JS numbers; safe under 2^53 cents).
//   2. For known JSON-as-TEXT columns (SQLite dev), parse strings to objects so
//      clients receive structured data. On Postgres these fields are Json and
//      already structured — this becomes a no-op.
const JSON_FIELDS = new Set([
  "translations",
  "attributes",
  "attributeSchema",
  "vinDecoded",
  "raw",
  "shippingAddress",
  "signals",
  "filters",
]);

function transformValue(key: string, value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((v) => transformValue(key, v));
  if (value && typeof value === "object") return transformRow(value as Record<string, unknown>);
  if (typeof value === "string" && JSON_FIELDS.has(key)) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function transformRow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = transformValue(k, v);
  }
  return out as T;
}

export function serializeListing<T extends Record<string, unknown>>(row: T): T {
  return transformRow(row);
}
