import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { app } from './server';

describe('Search & Explore BFF API Extensions', () => {
  let serverInstance: any = null;
  let testPort: number = 3001;

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

  test('GET /api/search returns 400 when query is missing', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/search`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test('GET /api/search supports type=playlist and returns playlists array', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/search?q=nhac+lofi&type=playlist`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.playlists)).toBe(true);
    expect(data.playlists.length).toBeGreaterThan(0);
  }, 15000);

  test('GET /api/search supports features filter (hd, live)', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/search?q=news&features=live`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
  }, 15000);

  test('GET /api/search supports type=shorts', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/search?q=hai+huoc&type=shorts`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
  }, 15000);

  test('GET /api/channel/search returns 400 if channelId or q is missing', async () => {
    const res1 = await fetch(`http://localhost:${testPort}/api/channel/search`);
    expect(res1.status).toBe(400);

    const res2 = await fetch(`http://localhost:${testPort}/api/channel/search?channelId=123`);
    expect(res2.status).toBe(400);
  });

  test('GET /api/channel/search returns video list for specific channel', async () => {
    // Official channel ID: UCuAXFkgsw1L7xaCfnd5JJOw (Rick Astley)
    const res = await fetch(`http://localhost:${testPort}/api/channel/search?channelId=UCuAXFkgsw1L7xaCfnd5JJOw&q=Never`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.channelId).toBe('UCuAXFkgsw1L7xaCfnd5JJOw');
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  }, 15000);
});
