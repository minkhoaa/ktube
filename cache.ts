export interface MemoryCacheOptions {
  maxItems?: number;
  defaultTtlMs?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T> {
  private readonly maxItems: number;
  private readonly defaultTtlMs: number;
  private readonly map = new Map<string, CacheEntry<T>>();

  constructor(options: MemoryCacheOptions = {}) {
    this.maxItems = Math.max(1, options.maxItems ?? 1000);
    this.defaultTtlMs = options.defaultTtlMs ?? 60 * 60 * 1000; // default 1 hour
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    // Refresh access order for LRU (re-insert)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.map.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return false;
    }

    return true;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxItems) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }

    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = ttl === Infinity ? Infinity : Date.now() + ttl;

    this.map.set(key, { value, expiresAt });
  }

  delete(key: string): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}
