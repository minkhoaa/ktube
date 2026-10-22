import { describe, it, expect } from "bun:test";
import { MemoryCache } from "./cache";

describe("MemoryCache", () => {
  it("should store and retrieve values within TTL", () => {
    const cache = new MemoryCache<string>({ maxItems: 10, defaultTtlMs: 1000 });
    cache.set("foo", "bar");
    expect(cache.get("foo")).toBe("bar");
    expect(cache.has("foo")).toBe(true);
  });

  it("should expire items after TTL", async () => {
    const cache = new MemoryCache<string>({ maxItems: 10, defaultTtlMs: 50 });
    cache.set("expireKey", "value", 50);
    expect(cache.get("expireKey")).toBe("value");
    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get("expireKey")).toBeUndefined();
    expect(cache.has("expireKey")).toBe(false);
  });

  it("should evict least recently used items when capacity exceeded", () => {
    const cache = new MemoryCache<number>({ maxItems: 2, defaultTtlMs: 10000 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // a is recently used
    cache.set("c", 3); // b should be evicted
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("b")).toBeUndefined();
  });

  it("should support custom TTL per item", async () => {
    const cache = new MemoryCache<string>({ maxItems: 10, defaultTtlMs: 500 });
    cache.set("short", "val1", 20);
    cache.set("long", "val2", 200);
    await new Promise((r) => setTimeout(r, 35));
    expect(cache.get("short")).toBeUndefined();
    expect(cache.has("short")).toBe(false);
    expect(cache.get("long")).toBe("val2");
    expect(cache.has("long")).toBe(true);
  });

  it("should update existing keys and refresh LRU position", () => {
    const cache = new MemoryCache<number>({ maxItems: 2, defaultTtlMs: 10000 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 10); // updates a and moves to most recently used
    cache.set("c", 3);  // b should be evicted
    expect(cache.get("a")).toBe(10);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });

  it("should return false and undefined for non-existent keys", () => {
    const cache = new MemoryCache<string>();
    expect(cache.has("unknown")).toBe(false);
    expect(cache.get("unknown")).toBeUndefined();
  });

  it("should delete keys properly", () => {
    const cache = new MemoryCache<string>();
    cache.set("k1", "v1");
    expect(cache.has("k1")).toBe(true);
    expect(cache.delete("k1")).toBe(true);
    expect(cache.has("k1")).toBe(false);
    expect(cache.delete("k1")).toBe(false);
  });

  it("should clear all items and report size correctly", () => {
    const cache = new MemoryCache<number>({ maxItems: 10 });
    expect(cache.size).toBe(0);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has("a")).toBe(false);
  });

  it("should use default options when none are passed", () => {
    const cache = new MemoryCache<string>();
    cache.set("foo", "bar");
    expect(cache.get("foo")).toBe("bar");
    expect(cache.size).toBe(1);
  });
});
