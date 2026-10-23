import type { VideoItem, ChannelItem, VideoInfo, CommentItem, SearchFilters } from '../types';

export interface FeedResponse {
  results: VideoItem[];
  continuationToken: string | null;
}

export async function fetchFeed(
  category?: string,
  sortBy?: string,
  continuation?: string
): Promise<FeedResponse> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (sortBy) params.append('sort_by', sortBy);
  if (continuation) params.append('continuation', continuation);

  const query = params.toString();
  const url = query ? `/api/feed?${query}` : '/api/feed';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch feed');
  const data = await res.json();
  return {
    results: data.results || [],
    continuationToken: data.continuationToken || null
  };
}

export async function fetchExplore(topic: string): Promise<VideoItem[]> {
  const res = await fetch(`/api/explore?topic=${encodeURIComponent(topic)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function fetchSuggestions(query: string): Promise<string[]> {
  if (!query || !query.trim()) return [];
  const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions || [];
}

export async function fetchSearch(
  query: string,
  filters?: SearchFilters
): Promise<{ videos: VideoItem[]; channels: ChannelItem[]; hasContinuation?: boolean }> {
  const params = new URLSearchParams({ q: query.trim() });
  if (filters?.upload_date) params.append('upload_date', filters.upload_date);
  if (filters?.duration) params.append('duration', filters.duration);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);

  const res = await fetch(`/api/search?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to search');
  const data = await res.json();
  return {
    videos: data.results || [],
    channels: data.channels || [],
    hasContinuation: data.hasContinuation || false
  };
}

export async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
  const res = await fetch(`/api/info?v=${encodeURIComponent(videoId)}`);
  if (!res.ok) throw new Error('Failed to fetch video info');
  return res.json();
}

export async function fetchComments(videoId: string): Promise<{
  total: string;
  comments: CommentItem[];
  disabled: boolean;
}> {
  const res = await fetch(`/api/comments?v=${encodeURIComponent(videoId)}`);
  if (!res.ok) {
    return { total: '0', comments: [], disabled: true };
  }
  return res.json();
}
