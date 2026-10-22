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

export interface LibraryData {
  history: HistoryEntry[];
  liked: HistoryEntry[];
  watchLater: HistoryEntry[];
  subscriptions: SubscriptionEntry[];
}

const STORAGE_KEY = 'puretube_library_v1';

function loadInitialData(): LibraryData {
  const fallback: LibraryData = {
    history: [],
    liked: [],
    watchLater: [],
    subscriptions: []
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
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : []
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
    subscriptions: [...libraryData.subscriptions]
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

export function subscribeLibrary(listener: (data: LibraryData) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
