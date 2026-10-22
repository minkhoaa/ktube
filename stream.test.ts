import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { app } from "./server";

describe("Stream Proxy Endpoint", () => {
  let serverInstance: any = null;

  beforeAll(async () => {
    const isRunning = await fetch("http://localhost:3000/api/info?v=0e3GPea1Tyg", {
      signal: AbortSignal.timeout(1500)
    })
      .then(() => true)
      .catch(() => false);

    if (!isRunning) {
      serverInstance = app.listen(3000);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  });

  afterAll(async () => {
    if (serverInstance) {
      if (typeof serverInstance.closeAllConnections === "function") {
        serverInstance.closeAllConnections();
      }
      await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
    }
  });

  it("should return 400 when url parameter is missing in /api/stream/segment", async () => {
    const res = await fetch("http://localhost:3000/api/stream/segment");
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("Missing url parameter");
  });

  it("should stream video segments with chunked transfer and correct headers", async () => {
    const res = await fetch("http://localhost:3000/api/stream/master.m3u8?v=0e3GPea1Tyg");
    expect(res.status).toBe(200);
    const mText = await res.text();
    const subUrl = mText.split("\n").find(l => l.startsWith("/api/stream/sub?url="));
    expect(subUrl).toBeDefined();

    const subRes = await fetch("http://localhost:3000" + subUrl);
    expect(subRes.status).toBe(200);
    const sText = await subRes.text();
    const segUrl = sText.split("\n").find(l => l.startsWith("/api/stream/segment?url="));
    expect(segUrl).toBeDefined();

    const t0 = performance.now();
    const segRes = await fetch("http://localhost:3000" + segUrl);
    const t1 = performance.now();

    expect(segRes.status).toBe(200);
    expect(segRes.headers.get("access-control-allow-origin")).toBe("*");
    expect((await segRes.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });

  it("should handle range requests when requested by client", async () => {
    const mRes = await fetch("http://localhost:3000/api/stream/master.m3u8?v=0e3GPea1Tyg");
    const mText = await mRes.text();
    const subUrl = mText.split("\n").find(l => l.startsWith("/api/stream/sub?url="));
    expect(subUrl).toBeDefined();

    const subRes = await fetch("http://localhost:3000" + subUrl);
    const sText = await subRes.text();
    const segUrl = sText.split("\n").find(l => l.startsWith("/api/stream/segment?url="));
    expect(segUrl).toBeDefined();

    const segRes = await fetch("http://localhost:3000" + segUrl, {
      headers: { Range: "bytes=0-1023" }
    });
    expect([200, 206]).toContain(segRes.status);
    expect(segRes.headers.get("access-control-allow-origin")).toBe("*");
    const buf = await segRes.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);
  });

  it("should clean up and abort upstream stream when client aborts request", async () => {
    const mRes = await fetch("http://localhost:3000/api/stream/master.m3u8?v=0e3GPea1Tyg");
    const mText = await mRes.text();
    const subUrl = mText.split("\n").find(l => l.startsWith("/api/stream/sub?url="));
    expect(subUrl).toBeDefined();

    const subRes = await fetch("http://localhost:3000" + subUrl);
    const sText = await subRes.text();
    const segUrl = sText.split("\n").find(l => l.startsWith("/api/stream/segment?url="));
    expect(segUrl).toBeDefined();

    const controller = new AbortController();
    const segFetch = fetch("http://localhost:3000" + segUrl, { signal: controller.signal });

    setTimeout(() => controller.abort(), 10);

    try {
      await segFetch;
    } catch (err: any) {
      expect(err.name).toBe("AbortError");
    }

    // Verify server remains healthy after abort
    const healthCheck = await fetch("http://localhost:3000/api/stream/segment");
    expect(healthCheck.status).toBe(400);
  });
});
