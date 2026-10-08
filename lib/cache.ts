import type { BasicReport } from "./types";

const TTL_MS = 5 * 60 * 1000;
const MAX_KEYS = 500;

type Entry = {
  value: BasicReport;
  expiresAt: number;
};

const store = new Map<string, Entry>();

export function cacheKey(chain: string, address: string): string {
  const normalized = chain === "solana" ? address : address.toLowerCase();
  return `${chain}:${normalized}`;
}

export function cacheGet(key: string): BasicReport | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) return null;
  return entry.value;
}

/** Last written value, even if the fixed TTL has passed. Used only on RPC 429. */
export function cacheGetStale(key: string): BasicReport | null {
  return store.get(key)?.value ?? null;
}

export function cacheSet(key: string, value: BasicReport): void {
  if (store.size >= MAX_KEYS && !store.has(key)) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}
