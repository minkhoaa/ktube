import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { app, decodeHtmlEntities, parseXmlCues } from './server';

describe('Backend API Extensions', () => {
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

  it('GET /api/suggestions returns empty suggestions array when query is empty or whitespace', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/suggestions?q=   `);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toEqual([]);
  });

  it('GET /api/suggestions returns suggestions list for a valid query', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/suggestions?q=mrbeast`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);
  }, 15000);

  it('GET /api/feed returns popular/trending feed videos', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/feed`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results[0]).toHaveProperty('id');
    expect(data.results[0]).toHaveProperty('title');
  }, 15000);

  it('GET /api/comments returns 400 when video ID is missing', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/comments`);
    expect(res.status).toBe(400);
  });

  it('GET /api/comments handles comments gracefully and returns comments array or disabled state', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/comments?v=0e3GPea1Tyg`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.comments)).toBe(true);
    expect(typeof data.disabled).toBe('boolean');
  }, 10000);

  it('GET /api/captions returns available languages and cues for video with captions', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/captions?v=dQw4w9WgXcQ`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.availableLanguages)).toBe(true);
    expect(Array.isArray(data.cues)).toBe(true);
    if (data.cues.length > 0) {
      expect(typeof data.cues[0].start).toBe('number');
      expect(typeof data.cues[0].end).toBe('number');
      expect(typeof data.cues[0].text).toBe('string');
    }
  }, 15000);

  it('parseXmlCues and decodeHtmlEntities properly parses caption XML', () => {
    const sampleXml = `
      <transcript>
        <text start="1.5" dur="2.3">Hello &amp; welcome to &quot;PureTube&quot;!</text>
        <text start="4.2" dur="3.1">Let&#39;s stream high quality</text>
      </transcript>
    `;
    const cues = parseXmlCues(sampleXml);
    expect(cues.length).toBe(2);
    expect(cues[0].start).toBe(1.5);
    expect(cues[0].end).toBe(3.8);
    expect(cues[0].text).toBe('Hello & welcome to "PureTube"!');
    expect(cues[1].start).toBe(4.2);
    expect(cues[1].end).toBe(7.3);
    expect(cues[1].text).toBe("Let's stream high quality");
  });

  it('GET /api/channel returns channel profile and videos', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/channel?id=UCuAXFkgsw1L7xaCfnd5JJOw`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('avatar');
    expect(Array.isArray(data.videos)).toBe(true);
  }, 15000);

  it('GET /api/shorts returns trending shorts list', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/shorts`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  }, 15000);
});
