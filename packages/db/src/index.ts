import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";
export * from "./enums";

declare global {
  // eslint-disable-next-line no-var
  var __compralo_prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__compralo_prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__compralo_prisma = prisma;
}

// Helpers for JSON columns stored as TEXT on SQLite.
// Postgres swap: delete these, use Json types directly.
export function parseJson<T>(value: string | null | undefined): T | null {
  if (value == null) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function stringifyJson(value: unknown): string | null {
  return value === undefined || value === null ? null : JSON.stringify(value);
}
