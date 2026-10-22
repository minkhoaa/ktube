import express from 'express';
import cors from 'cors';
import { Innertube, Log, ClientType } from 'youtubei.js';
import path from 'path';
import { Readable } from 'node:stream';
import { MemoryCache } from './cache';

Log.setLevel(Log.Level.NONE);

export const app = express();
const PORT = process.env.PORT || 3000;

export const infoCache = new MemoryCache<any>({ maxItems: 500, defaultTtlMs: 60 * 60 * 1000 });
export const manifestCache = new MemoryCache<string>({ maxItems: 500, defaultTtlMs: 30 * 60 * 1000 });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function cleanVideoId(raw: string): string {
  if (!raw) return '';
  raw = raw.trim();
  if (raw.includes('v=')) {
    return raw.split('v=')[1].split('&')[0];
  }
  if (raw.includes('youtu.be/')) {
    return raw.split('youtu.be/')[1].split('?')[0];
  }
  if (raw.includes('/shorts/')) {
    return raw.split('/shorts/')[1].split('?')[0];
  }
  return raw;
}

let ytWebPromise: Promise<Innertube> | null = null;
let ytVisionPromise: Promise<Innertube> | null = null;

function getYtWeb() {
  if (!ytWebPromise) {
    ytWebPromise = Innertube.create({ client_type: ClientType.WEB });
  }
  return ytWebPromise;
}

function getYtVision() {
  if (!ytVisionPromise) {
    ytVisionPromise = Innertube.create({ client_type: ClientType.VISIONOS });
  }
  return ytVisionPromise;
}

// 1. Search endpoint (uses Web client)
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter q' });
    }
    const yt = await getYtWeb();
    const results = await yt.search(q);
    const videos = (results.videos || [])
      .filter((v: any) => v.id && v.title?.text)
      .map((v: any) => ({
        id: v.id,
        title: v.title?.text || '',
        author: v.author?.name || '',
        duration: v.duration?.text || '',
        views: v.short_view_count?.text || '',
        published: v.published?.text || '',
        thumbnail: v.thumbnails?.[0]?.url || ''
      }));
    res.json({ results: videos });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Video info endpoint (uses VisionOS client for HLS and multi-audio)
app.get('/api/info', async (req, res) => {
  try {
    const cleanId = cleanVideoId(req.query.v as string);
    if (!cleanId) {
      return res.status(400).json({ error: 'Missing video parameter v' });
    }

    const cached = infoCache.get(cleanId);
    if (cached) {
      return res.json(cached);
    }

    const yt = await getYtVision();
    const info = await yt.getBasicInfo(cleanId, ClientType.VISIONOS);

    const adaptive = info.streaming_data?.adaptive_formats || [];
    const videoQualities = Array.from(new Set(
      adaptive.filter(f => f.has_video).map(f => (f as any).quality_label).filter(Boolean)
    ));

    const audioTracks = adaptive.filter(f => f.has_audio).map((a: any) => ({
      itag: a.itag,
      language: a.language || a.audio_track?.id || 'default',
      displayName: a.audio_track?.display_name || 'Original',
      isDefault: a.audio_track?.audio_is_default || false,
      isDubbed: a.is_dubbed || false,
      isAutoDubbed: a.is_auto_dubbed || false
    }));

    const viAudio = audioTracks.find(t => 
      t.language.startsWith('vi') || 
      t.displayName.toLowerCase().includes('vietnamese') || 
      t.displayName.toLowerCase().includes('tiếng việt')
    );

    const responseData = {
      id: cleanId,
      title: info.basic_info.title,
      author: info.basic_info.author,
      description: info.basic_info.short_description,
      duration: info.basic_info.duration,
      thumbnails: info.basic_info.thumbnail,
      videoQualities,
      audioTracks,
      hasVietnameseAudio: !!viAudio,
      vietnameseAudioTrack: viAudio || null,
      hasHls: !!info.streaming_data?.hls_manifest_url
    };

    infoCache.set(cleanId, responseData);
    res.json(responseData);
  } catch (err: any) {
    console.error('Info error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. HLS Master Manifest endpoint
app.get('/api/stream/master.m3u8', async (req, res) => {
  try {
    const videoId = cleanVideoId(req.query.v as string);
    if (!videoId) {
      return res.status(400).send('Missing video parameter v');
    }

    const cached = manifestCache.get(videoId);
    if (cached) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(cached);
    }

    const yt = await getYtVision();
    const info = await yt.getBasicInfo(videoId, ClientType.VISIONOS);
    const hlsUrl = info.streaming_data?.hls_manifest_url;

    if (!hlsUrl) {
      return res.status(404).send('HLS stream not available for this video');
    }

    const upstreamRes = await fetch(hlsUrl);
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Failed to fetch upstream manifest');
    }

    const manifestText = await upstreamRes.text();

    // Check if manifest contains Vietnamese dubbed audio
    const hasVi = manifestText.includes('LANGUAGE="vi"') || 
                  manifestText.includes('Tiếng Việt') || 
                  manifestText.includes('NAME="Vietnamese');

    // Rewrite URLs to point to our sub-playlist proxy & prioritize Vietnamese audio
    const lines = manifestText.split('\n');
    const rewritten = lines.map(line => {
      line = line.trim();
      if (!line) return line;

      // Prioritize Vietnamese audio as DEFAULT in HLS master
      if (line.startsWith('#EXT-X-MEDIA') && line.includes('TYPE=AUDIO') && hasVi) {
        const isVi = line.includes('LANGUAGE="vi"') || 
                     line.includes('Tiếng Việt') || 
                     line.includes('NAME="Vietnamese');
        if (isVi) {
          line = line.replace(/DEFAULT=(YES|NO)/, 'DEFAULT=YES').replace(/AUTOSELECT=(YES|NO)/, 'AUTOSELECT=YES');
        } else {
          line = line.replace(/DEFAULT=(YES|NO)/, 'DEFAULT=NO');
        }
      }

      // Handle URI="..." in #EXT-X-MEDIA or #EXT-X-I-FRAME-STREAM-INF
      if (line.includes('URI="http')) {
        return line.replace(/URI="(https?:\/\/[^"]+)"/g, (_, url) => {
          const encoded = encodeURIComponent(url);
          return `URI="/api/stream/sub?url=${encoded}"`;
        });
      }

      // Handle stream playlist URLs
      if (line.startsWith('http://') || line.startsWith('https://')) {
        const encoded = encodeURIComponent(line);
        return `/api/stream/sub?url=${encoded}`;
      }

      return line;
    }).join('\n');

    manifestCache.set(videoId, rewritten);

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(rewritten);
  } catch (err: any) {
    console.error('Master HLS error:', err);
    res.status(500).send(err.message);
  }
});

// 4. HLS Sub-playlist endpoint
app.get('/api/stream/sub', async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }

    const upstreamRes = await fetch(targetUrl);
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Failed to fetch sub-playlist');
    }

    const playlistText = await upstreamRes.text();

    // Rewrite segment URLs & map URIs
    const lines = playlistText.split('\n');
    const rewritten = lines.map(line => {
      line = line.trim();
      if (!line) return line;

      // Handle map/init segment URIs
      if (line.includes('URI="http')) {
        return line.replace(/URI="(https?:\/\/[^"]+)"/g, (_, url) => {
          const encoded = encodeURIComponent(url);
          return `URI="/api/stream/segment?url=${encoded}"`;
        });
      }

      // Handle segment URLs
      if (line.startsWith('http://') || line.startsWith('https://')) {
        const encoded = encodeURIComponent(line);
        return `/api/stream/segment?url=${encoded}`;
      }

      return line;
    }).join('\n');

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(rewritten);
  } catch (err: any) {
    console.error('Sub-playlist error:', err);
    res.status(500).send(err.message);
  }
});

// 5. Segment Proxy endpoint (Streams the video chunks with CORS)
app.get('/api/stream/segment', async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }

    const headers: Record<string, string> = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const upstreamRes = await fetch(targetUrl, { headers });

    res.status(upstreamRes.status);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'video/MP2T');

    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) res.setHeader('Content-Range', contentRange);

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    if (upstreamRes.body) {
      const nodeStream = Readable.fromWeb(upstreamRes.body as any);
      nodeStream.on('error', (err) => {
        if (!res.headersSent) res.status(500).end();
      });
      req.on('close', () => {
        nodeStream.destroy();
      });
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('Segment proxy error:', err);
    if (!res.headersSent) {
      res.status(500).send(err.message);
    }
  }
});

if (import.meta.main) {
  app.listen(PORT, () => {
    console.log(`🚀 Pure Tuber Web Server running at http://localhost:${PORT}`);
  });
}
