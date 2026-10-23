import type { VideoItem } from '../types';
import type { HistoryEntry, BlacklistData } from './libraryStore';

const STOP_WORDS = new Set([
  'va', 'và', 'cua', 'của', 'la', 'là', 'cho', 'voi', 'với', 'trong',
  'tren', 'trên', 'cac', 'các', 'nhung', 'những', 'mot', 'một', 'hai',
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'tap', 'tập', 'phan', 'phần', 'video', 'full', 'hd', 'official'
]);

export interface InterestScores {
  topChannels: string[];
  topTopics: string[];
}

export function calculateInterestScores(
  history: HistoryEntry[],
  liked: HistoryEntry[] = []
): InterestScores {
  const channelScores: Record<string, number> = {};
  const topicScores: Record<string, number> = {};
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const likedIds = new Set(liked.map((item) => item.id));

  for (const entry of history) {
    if (!entry) continue;

    const isLiked = likedIds.has(entry.id);
    const deltaDays = Math.max(0, (now - (entry.watchedAt || now)) / dayMs);
    // Time-decay half life 7 days: e^(-deltaDays / 7)
    const decay = Math.exp(-deltaDays / 7);
    const progress = Math.max(0.1, (entry.progressPercent || 0) / 100);
    const weight = (1.0 + (isLiked ? 2.0 : 0.0)) * progress * decay;

    // Channel scoring
    if (entry.author) {
      const channel = entry.author.trim();
      channelScores[channel] = (channelScores[channel] || 0) + weight;
    }

    // Topic / Keyword extraction from title
    if (entry.title) {
      const words = entry.title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

      for (const word of words) {
        topicScores[word] = (topicScores[word] || 0) + weight;
      }
    }
  }

  const topChannels = Object.entries(channelScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([channel]) => channel);

  const topTopics = Object.entries(topicScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic.charAt(0).toUpperCase() + topic.slice(1));

  return { topChannels, topTopics };
}

export function interleaveFeed(params: {
  personalVideos?: VideoItem[];
  trendingVideos?: VideoItem[];
  exploreVideos?: VideoItem[];
}): VideoItem[] {
  const personal = [...(params.personalVideos || [])];
  const trending = [...(params.trendingVideos || [])];
  const explore = [...(params.exploreVideos || [])];

  const result: VideoItem[] = [];
  const seenIds = new Set<string>();

  const appendUnique = (v?: VideoItem) => {
    if (v && v.id && !seenIds.has(v.id)) {
      seenIds.add(v.id);
      result.push(v);
    }
  };

  while (personal.length > 0 || trending.length > 0 || explore.length > 0) {
    // Interleave pattern: 2 personal, 2 trending, 1 explore (serendipity)
    if (personal.length > 0) appendUnique(personal.shift());
    if (personal.length > 0) appendUnique(personal.shift());

    if (trending.length > 0) appendUnique(trending.shift());
    if (trending.length > 0) appendUnique(trending.shift());

    if (explore.length > 0) appendUnique(explore.shift());
  }

  return result;
}

export function filterBlacklist(
  videos: VideoItem[],
  blacklist: BlacklistData
): VideoItem[] {
  if (!videos || !Array.isArray(videos)) return [];
  const blockedVideos = new Set(blacklist.videos || []);
  const blockedChannels = new Set(
    (blacklist.channels || []).map((ch) => ch.trim().toLowerCase())
  );

  return videos.filter((v) => {
    if (!v || !v.id) return false;
    if (blockedVideos.has(v.id)) return false;
    if (v.author && blockedChannels.has(v.author.trim().toLowerCase())) return false;
    return true;
  });
}
