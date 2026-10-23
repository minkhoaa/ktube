import type { SearchHistoryItem } from '../types';

export interface HistoryEntry {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  progressPercent: number; // 0 - 100
  currentTime: number;
  durationSeconds: number;
  watchedAt: number;
}

export interface SubscriptionEntry {
  channelId: string;
  channelName: string;
  avatar: string;
  subscribedAt: number;
}

export interface BlacklistData {
  videos: string[];
  channels: string[];
}

export interface LibraryData {
  history: HistoryEntry[];
  liked: HistoryEntry[];
  watchLater: HistoryEntry[];
  subscriptions: SubscriptionEntry[];
  blacklist: BlacklistData;
  searchHistory: SearchHistoryItem[];
}

const STORAGE_KEY = 'puretube_library_v1';

function loadInitialData(): LibraryData {
  const fallback: LibraryData = {
    history: [],
    liked: [],
    watchLater: [],
    subscriptions: [],
    blacklist: { videos: [], channels: [] },
    searchHistory: []
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      liked: Array.isArray(parsed.liked) ? parsed.liked : [],
      watchLater: Array.isArray(parsed.watchLater) ? parsed.watchLater : [],
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
      blacklist: parsed.blacklist && typeof parsed.blacklist === 'object'
        ? {
            videos: Array.isArray(parsed.blacklist.videos) ? parsed.blacklist.videos : [],
            channels: Array.isArray(parsed.blacklist.channels) ? parsed.blacklist.channels : []
          }
        : { videos: [], channels: [] },
      searchHistory: Array.isArray(parsed.searchHistory) ? parsed.searchHistory : []
    };
  } catch (err) {
    console.error('Failed to parse local library data, falling back to default:', err);
    return fallback;
  }
}

let libraryData: LibraryData = loadInitialData();
const listeners = new Set<(data: LibraryData) => void>();

function persistAndNotify() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(libraryData));
    } catch (e) {
      console.error('Failed to save library data to localStorage:', e);
    }
  }

  const snapshot = {
    history: [...libraryData.history],
    liked: [...libraryData.liked],
    watchLater: [...libraryData.watchLater],
    subscriptions: [...libraryData.subscriptions],
    blacklist: {
      videos: [...libraryData.blacklist.videos],
      channels: [...libraryData.blacklist.channels]
    },
    searchHistory: [...libraryData.searchHistory]
  };

  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (e) {
      console.error('Library store listener error:', e);
    }
  }
}

export function getLibraryData(): LibraryData {
  return libraryData;
}

export function recordHistoryProgress(
  video: Partial<HistoryEntry> & { id: string },
  currentTime: number,
  duration: number
): void {
  if (!video.id || isNaN(currentTime) || isNaN(duration) || duration <= 0) return;

  const rawPercent = Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));
  // If user watched > 95% of video, mark 100% watched and reset next resume to 0s
  const progressPercent = rawPercent > 95 ? 100 : rawPercent;
  const nextResumeTime = rawPercent > 95 ? 0 : Math.round(currentTime);

  const existingIndex = libraryData.history.findIndex((item) => item.id === video.id);
  const entry: HistoryEntry = {
    id: video.id,
    title: video.title || (existingIndex >= 0 ? libraryData.history[existingIndex].title : 'Video'),
    author: video.author || (existingIndex >= 0 ? libraryData.history[existingIndex].author : ''),
    thumbnail: video.thumbnail || (existingIndex >= 0 ? libraryData.history[existingIndex].thumbnail : ''),
    duration: video.duration || (existingIndex >= 0 ? libraryData.history[existingIndex].duration : ''),
    progressPercent,
    currentTime: nextResumeTime,
    durationSeconds: Math.round(duration),
    watchedAt: Date.now()
  };

  if (existingIndex >= 0) {
    libraryData.history.splice(existingIndex, 1);
  }

  // Prepend to show most recently watched first (limit to 100 videos)
  libraryData.history.unshift(entry);
  if (libraryData.history.length > 100) {
    libraryData.history.pop();
  }

  persistAndNotify();
}

export function clearHistory(): void {
  libraryData.history = [];
  persistAndNotify();
}

export function toggleLikedVideo(video: HistoryEntry): boolean {
  const index = libraryData.liked.findIndex((v) => v.id === video.id);
  let isNowLiked = false;

  if (index >= 0) {
    libraryData.liked.splice(index, 1);
    isNowLiked = false;
  } else {
    libraryData.liked.unshift({ ...video, watchedAt: Date.now() });
    isNowLiked = true;
  }

  persistAndNotify();
  return isNowLiked;
}

export function isVideoLiked(id: string): boolean {
  return libraryData.liked.some((v) => v.id === id);
}

export function toggleSubscription(channel: SubscriptionEntry): boolean {
  const index = libraryData.subscriptions.findIndex((c) => c.channelId === channel.channelId);
  let isNowSubscribed = false;

  if (index >= 0) {
    libraryData.subscriptions.splice(index, 1);
    isNowSubscribed = false;
  } else {
    libraryData.subscriptions.unshift({ ...channel, subscribedAt: Date.now() });
    isNowSubscribed = true;
  }

  persistAndNotify();
  return isNowSubscribed;
}

export function isSubscribed(channelId: string): boolean {
  return libraryData.subscriptions.some((c) => c.channelId === channelId);
}

export function addNotInterestedVideo(videoId: string): void {
  if (!videoId || libraryData.blacklist.videos.includes(videoId)) return;
  libraryData.blacklist.videos.push(videoId);
  persistAndNotify();
}

export function removeNotInterestedVideo(videoId: string): void {
  const idx = libraryData.blacklist.videos.indexOf(videoId);
  if (idx >= 0) {
    libraryData.blacklist.videos.splice(idx, 1);
    persistAndNotify();
  }
}

export function blockChannel(channelName: string): void {
  const cleanName = (channelName || '').trim().toLowerCase();
  if (!cleanName || libraryData.blacklist.channels.includes(cleanName)) return;
  libraryData.blacklist.channels.push(cleanName);
  persistAndNotify();
}

export function unblockChannel(channelName: string): void {
  const cleanName = (channelName || '').trim().toLowerCase();
  const idx = libraryData.blacklist.channels.indexOf(cleanName);
  if (idx >= 0) {
    libraryData.blacklist.channels.splice(idx, 1);
    persistAndNotify();
  }
}

export function isBlacklisted(videoId: string, channelName?: string): boolean {
  if (videoId && libraryData.blacklist.videos.includes(videoId)) {
    return true;
  }
  if (channelName) {
    const cleanName = channelName.trim().toLowerCase();
    if (libraryData.blacklist.channels.includes(cleanName)) {
      return true;
    }
  }
  return false;
}

export function addSearchQuery(query: string): void {
  const q = (query || '').trim();
  if (!q) return;

  const existingIdx = libraryData.searchHistory.findIndex(
    (item) => item.query.toLowerCase() === q.toLowerCase()
  );

  if (existingIdx >= 0) {
    libraryData.searchHistory.splice(existingIdx, 1);
  }

  libraryData.searchHistory.unshift({
    query: q,
    timestamp: Date.now()
  });

  if (libraryData.searchHistory.length > 50) {
    libraryData.searchHistory.pop();
  }

  persistAndNotify();
}

export function removeSearchQuery(query: string): void {
  const q = (query || '').trim().toLowerCase();
  const idx = libraryData.searchHistory.findIndex(
    (item) => item.query.toLowerCase() === q
  );
  if (idx >= 0) {
    libraryData.searchHistory.splice(idx, 1);
    persistAndNotify();
  }
}

export function clearSearchHistory(): void {
  libraryData.searchHistory = [];
  persistAndNotify();
}

export function getSearchHistory(): SearchHistoryItem[] {
  return [...libraryData.searchHistory];
}

export function getResumeTime(videoId: string): number {
  if (!videoId) return 0;
  const entry = libraryData.history.find((item) => item.id === videoId);
  if (!entry) return 0;
  if (entry.currentTime <= 5 || entry.progressPercent >= 95) return 0;
  return entry.currentTime;
}

export function subscribeLibrary(listener: (data: LibraryData) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
