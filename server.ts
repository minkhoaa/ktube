import express from 'express';
import cors from 'cors';
import { Innertube, Log, ClientType } from 'youtubei.js';
import path from 'path';
import fs from 'fs';
import { Readable } from 'node:stream';
import { MemoryCache } from './cache';

Log.setLevel(Log.Level.NONE);

export const app = express();
const PORT = process.env.PORT || 3000;

export const infoCache = new MemoryCache<any>({ maxItems: 500, defaultTtlMs: 60 * 60 * 1000 });
export const manifestCache = new MemoryCache<string>({ maxItems: 500, defaultTtlMs: 30 * 60 * 1000 });
export const suggestionsCache = new MemoryCache<string[]>({ maxItems: 500, defaultTtlMs: 15 * 60 * 1000 });
export const commentsCache = new MemoryCache<any>({ maxItems: 500, defaultTtlMs: 15 * 60 * 1000 });
export const feedCache = new MemoryCache<any>({ maxItems: 50, defaultTtlMs: 10 * 60 * 1000 });
export const captionsCache = new MemoryCache<any>({ maxItems: 300, defaultTtlMs: 2 * 60 * 60 * 1000 });
export const channelCache = new MemoryCache<any>({ maxItems: 100, defaultTtlMs: 60 * 60 * 1000 });
export const shortsCache = new MemoryCache<any>({ maxItems: 50, defaultTtlMs: 30 * 60 * 1000 });

app.use(cors());
app.use(express.json());

const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(publicPath));
}

function isValidStreamHost(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return host === 'googlevideo.com' || host.endsWith('.googlevideo.com') ||
           host === 'youtube.com' || host.endsWith('.youtube.com');
  } catch {
    return false;
  }
}

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

// 1. Search endpoint (uses Web client, supports filters)
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter q' });
    }
    const yt = await getYtWeb();
    const filters: any = {};
    if (req.query.upload_date) filters.upload_date = req.query.upload_date;
    if (req.query.duration) filters.duration = req.query.duration;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.sort_by) filters.sort_by = req.query.sort_by;

    const results = await yt.search(q, Object.keys(filters).length ? filters : undefined);
    const videos = (results.videos || [])
      .filter((v: any) => v.id && v.title?.text)
      .map((v: any) => ({
        id: v.id,
        title: v.title?.text || '',
        author: v.author?.name || '',
        authorAvatar: v.author?.thumbnails?.[0]?.url || '',
        duration: v.duration?.text || '',
        views: v.short_view_count?.text || '',
        published: v.published?.text || '',
        thumbnail: v.thumbnails?.[0]?.url || '',
        description: v.description_snippet?.text || ''
      }));

    const channels = (results.channels || []).map((ch: any) => ({
      id: ch.id,
      name: ch.author?.name || '',
      avatar: ch.author?.thumbnails?.[0]?.url || '',
      subscriberCount: ch.video_count || ch.subscriber_count?.text || '',
      description: ch.description_snippet?.text || ''
    }));

    res.json({
      results: videos,
      channels,
      hasContinuation: results.has_continuation
    });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1b. Autocomplete suggestions endpoint
app.get('/api/suggestions', async (req, res) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q) {
      return res.json({ suggestions: [] });
    }
    const cached = suggestionsCache.get(q.toLowerCase());
    if (cached) {
      return res.json({ suggestions: cached });
    }
    const yt = await getYtWeb();
    const suggestions = await yt.getSearchSuggestions(q);
    suggestionsCache.set(q.toLowerCase(), suggestions);
    res.json({ suggestions });
  } catch (err: any) {
    console.error('Suggestions error:', err);
    res.status(500).json({ error: err.message, suggestions: [] });
  }
});

// 1c. Home/Trending feed endpoint
app.get('/api/feed', async (req, res) => {
  try {
    const category = ((req.query.category as string) || '').trim();
    const cacheKey = category || 'default_trending';
    const cached = feedCache.get(cacheKey);
    if (cached) {
      return res.json({ results: cached });
    }

    const yt = await getYtWeb();
    const searchQuery = category ? `${category} thịnh hành` : 'thịnh hành việt nam';
    const results = await yt.search(searchQuery, { type: 'video' });
    const videos = (results.videos || [])
      .filter((v: any) => v.id && v.title?.text)
      .map((v: any) => ({
        id: v.id,
        title: v.title?.text || '',
        author: v.author?.name || '',
        authorAvatar: v.author?.thumbnails?.[0]?.url || '',
        duration: v.duration?.text || '',
        views: v.short_view_count?.text || '',
        published: v.published?.text || '',
        thumbnail: v.thumbnails?.[0]?.url || ''
      }));

    feedCache.set(cacheKey, videos);
    res.json({ results: videos });
  } catch (err: any) {
    console.error('Feed error:', err);
    res.status(500).json({ error: err.message, results: [] });
  }
});

// 1d. Comments endpoint
app.get('/api/comments', async (req, res) => {
  try {
    const videoId = cleanVideoId(req.query.v as string);
    if (!videoId) {
      return res.status(400).json({ error: 'Missing video parameter v' });
    }

    const cached = commentsCache.get(videoId);
    if (cached) {
      return res.json(cached);
    }

    const yt = await getYtWeb();
    try {
      const c = await yt.getComments(videoId);
      const totalText = c.header?.comments_count?.text || '0';
      const comments = (c.contents || [])
        .filter((thread: any) => thread?.comment)
        .map((thread: any) => {
          const comment = thread.comment;
          return {
            id: comment.comment_id,
            author: {
              name: comment.author?.name || 'Ẩn danh',
              avatar: comment.author?.thumbnails?.[0]?.url || ''
            },
            content: comment.content?.text || '',
            published: typeof comment.published_time === 'string' ? comment.published_time : comment.published_time?.text || '',
            likes: comment.like_count || '0',
            replyCount: comment.reply_count || 0,
            isPinned: comment.is_pinned || false
          };
        });

      const responseData = {
        total: totalText,
        comments,
        disabled: false
      };
      commentsCache.set(videoId, responseData);
      res.json(responseData);
    } catch (commentErr: any) {
      res.json({
        total: '0',
        comments: [],
        disabled: true,
        message: 'Bình luận đã bị tắt cho video này.'
      });
    }
  } catch (err: any) {
    console.error('Comments endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1e. Closed Captions (CC) endpoint
app.get('/api/captions', async (req, res) => {
  try {
    const videoId = cleanVideoId(req.query.v as string);
    if (!videoId) {
      return res.status(400).json({ error: 'Missing video parameter v' });
    }

    const cached = captionsCache.get(videoId);
    if (cached) {
      return res.json(cached);
    }

    const yt = await getYtWeb();
    const info = await yt.getInfo(videoId);

    const availableLanguages = (info.captions?.caption_tracks || []).map((t: any) => ({
      code: t.language_code,
      name: t.name?.text || t.language_code,
      url: t.base_url
    }));

    const responseData = {
      availableLanguages,
      cues: []
    };

    captionsCache.set(videoId, responseData);
    res.json(responseData);
  } catch (err: any) {
    console.error('Captions endpoint error:', err);
    res.status(500).json({ error: err.message, availableLanguages: [], cues: [] });
  }
});

// 1f. Dedicated Channel profile & video list endpoint
app.get('/api/channel', async (req, res) => {
  try {
    const channelId = ((req.query.id as string) || '').trim();
    if (!channelId) {
      return res.status(400).json({ error: 'Missing channel id' });
    }

    const cached = channelCache.get(channelId);
    if (cached) {
      return res.json(cached);
    }

    const yt = await getYtWeb();
    const ch = await yt.getChannel(channelId);

    const title = (ch.header as any)?.author?.name || (ch.metadata as any)?.title || 'Kênh YouTube';
    const avatar = (ch.header as any)?.author?.thumbnails?.[0]?.url || (ch.metadata as any)?.avatar?.[0]?.url || '';
    const banner = (ch.header as any)?.banner?.thumbnails?.[0]?.url || '';
    const subscribers = (ch.header as any)?.subscribers?.text || '';
    const description = (ch.metadata as any)?.description || '';

    const videos = (ch.videos || [])
      .filter((v: any) => v.id && v.title?.text)
      .map((v: any) => ({
        id: v.id,
        title: v.title?.text || '',
        author: title,
        duration: v.duration?.text || '',
        views: v.short_view_count?.text || '',
        published: v.published?.text || '',
        thumbnail: v.thumbnails?.[0]?.url || ''
      }));

    const responseData = {
      id: channelId,
      title,
      avatar,
      banner,
      subscribers,
      description,
      videos
    };

    channelCache.set(channelId, responseData);
    res.json(responseData);
  } catch (err: any) {
    console.error('Channel endpoint error:', err);
    res.status(500).json({ error: err.message, videos: [] });
  }
});

// 1g. Dedicated Shorts list endpoint
app.get('/api/shorts', async (req, res) => {
  try {
    const cached = shortsCache.get('default_shorts');
    if (cached) {
      return res.json({ results: cached });
    }

    const yt = await getYtWeb();
    const searchRes = await yt.search('#shorts', { type: 'video' });
    const results = (searchRes.videos || [])
      .filter((v: any) => v.id && v.title?.text)
      .map((v: any) => ({
        id: v.id,
        title: v.title?.text || '',
        author: v.author?.name || '',
        authorAvatar: v.author?.thumbnails?.[0]?.url || '',
        duration: v.duration?.text || '',
        views: v.short_view_count?.text || '',
        published: v.published?.text || '',
        thumbnail: v.thumbnails?.[0]?.url || ''
      }));

    shortsCache.set('default_shorts', results);
    res.json({ results });
  } catch (err: any) {
    console.error('Shorts endpoint error:', err);
    res.status(500).json({ error: err.message, results: [] });
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
    const info = await yt.getBasicInfo(cleanId, ClientType.VISIONOS as any);

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
    const info = await yt.getBasicInfo(videoId, ClientType.VISIONOS as any);
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

    let manifestTtlMs = 30 * 60 * 1000;
    const expireMatch = hlsUrl.match(/\/expire\/(\d+)/) || hlsUrl.match(/[?&]expire=(\d+)/);
    if (expireMatch) {
      const remainingMs = parseInt(expireMatch[1], 10) * 1000 - Date.now();
      if (remainingMs > 0) manifestTtlMs = Math.min(manifestTtlMs, remainingMs);
    }
    manifestCache.set(videoId, rewritten, manifestTtlMs);

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

    if (!isValidStreamHost(targetUrl)) {
      return res.status(403).send('Forbidden');
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

    if (!isValidStreamHost(targetUrl)) {
      return res.status(403).send('Forbidden');
    }

    const headers: Record<string, string> = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const upstreamRes = await fetch(targetUrl, { headers, signal: req.signal });

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
        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.destroy(err);
        }
      });
      req.on('close', () => {
        nodeStream.destroy();
      });
      if (req.destroyed) return;
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    if (req.destroyed) return;
    console.error('Segment proxy error:', err);
    if (!res.headersSent) {
      res.status(500).send(err.message);
    }
  }
});

// SPA Fallback for client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  const targetHtml = fs.existsSync(path.join(distPath, 'index.html'))
    ? path.join(distPath, 'index.html')
    : path.join(publicPath, 'index.html');
  res.sendFile(targetHtml);
});

if (import.meta.main) {
  app.listen(PORT, () => {
    console.log(`🚀 Pure Tuber Web Server running at http://localhost:${PORT}`);
  });
}
