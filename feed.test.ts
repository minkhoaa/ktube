import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { app } from './server';

describe('Feed Continuation, Sorting & Explore API', () => {
  let serverInstance: any = null;
  let testPort: number = 3002;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        testPort = (serverInstance.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (serverInstance) {
      if (typeof serverInstance.closeAllConnections === 'function') {
        serverInstance.closeAllConnections();
      }
      await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
    }
  });

  it('GET /api/feed?sort_by=upload_date returns latest videos and continuationToken', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/feed?sort_by=upload_date`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
    expect(data).toHaveProperty('continuationToken');
    expect(typeof data.continuationToken === 'string' || data.continuationToken === null).toBe(true);
  }, 15000);

  it('GET /api/feed?sort_by=view_count returns popular videos', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/feed?sort_by=view_count`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  }, 15000);

  it('GET /api/explore?topic=music returns curated music videos', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/explore?topic=music`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  }, 15000);

  it('GET /api/feed with continuation token fetches next page of results', async () => {
    const firstRes = await fetch(`http://localhost:${testPort}/api/feed`);
    const firstData = await firstRes.json();
    expect(firstData).toHaveProperty('continuationToken');

    if (firstData.continuationToken) {
      const nextRes = await fetch(`http://localhost:${testPort}/api/feed?continuation=${encodeURIComponent(firstData.continuationToken)}`);
      expect(nextRes.status).toBe(200);
      const nextData = await nextRes.json();
      expect(Array.isArray(nextData.results)).toBe(true);
      expect(nextData.results.length).toBeGreaterThan(0);
    }
  }, 20000);
});
