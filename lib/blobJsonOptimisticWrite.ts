import { NextResponse } from "next/server";

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Order-independent signature for id-keyed rows (detects lost updates across parallel writes). */
export function stableArraySignature<T extends { id: string }>(items: T[]): string {
  return JSON.stringify([...items].sort((a, b) => a.id.localeCompare(b.id)));
}

/**
 * Thrown from `mutate` to return a 4xx response without retrying (validation / not found).
 */
export class MutationHttpError extends Error {
  constructor(public readonly response: NextResponse) {
    super("MutationHttpError");
    this.name = "MutationHttpError";
  }
}

function cloneRows<T>(rows: T[]): T[] {
  try {
    return rows.map((row) => structuredClone(row));
  } catch {
    return JSON.parse(JSON.stringify(rows)) as T[];
  }
}

/**
 * Read → clone → mutate → write → re-read until signature matches (or max attempts).
 * Fixes parallel admin saves on Vercel overwriting each other's JSON blob writes.
 */
export async function writeBlobJsonArrayWithRetry<T extends { id: string }>(options: {
  read: () => Promise<T[]>;
  write: (items: T[]) => Promise<void>;
  /** Must return the full next array to persist. */
  mutate: (draft: T[]) => T[] | Promise<T[]>;
  maxAttempts?: number;
  /**
   * When `read()` merges blob + bundled data, it will not match the blob-only payload we just wrote.
   * Supply a verifier that reads the same store we wrote to (e.g. raw Blob JSON).
   */
  verifyAfterWrite?: (written: T[]) => Promise<boolean>;
}): Promise<T[]> {
  const maxAttempts = options.maxAttempts ?? 28;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const before = await options.read();
    const draft = cloneRows(before);
    let next: T[];
    try {
      next = await options.mutate(draft);
    } catch (e) {
      if (e instanceof MutationHttpError) throw e;
      throw e;
    }
    const want = stableArraySignature(next);
    await options.write(next);
    const ok = options.verifyAfterWrite
      ? await options.verifyAfterWrite(next)
      : stableArraySignature(await options.read()) === want;
    if (ok) {
      return next;
    }
    await sleep(Math.min(500, 15 + attempt * 20));
  }
  throw new Error("writeBlobJsonArrayWithRetry: concurrent writes could not be reconciled");
}
