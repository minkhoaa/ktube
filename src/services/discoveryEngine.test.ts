import { test, expect } from 'bun:test';
import {
  calculateInterestScores,
  interleaveFeed,
  filterBlacklist
} from './discoveryEngine';
import type { HistoryEntry, BlacklistData } from './libraryStore';
import type { VideoItem } from '../types';

test('calculateInterestScores prioritizes recent, completed, and liked videos (time-decay)', () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const history: HistoryEntry[] = [
    {
      id: 'v_old',
      title: 'Lập trình C++ cơ bản',
      author: 'Old Channel',
      thumbnail: 't1.jpg',
      duration: '10:00',
      progressPercent: 20,
      currentTime: 120,
      durationSeconds: 600,
      watchedAt: now - 30 * dayMs // 30 days ago
    },
    {
      id: 'v_recent',
      title: 'Học Lập trình Rust nâng cao',
      author: 'Tech Daily',
      thumbnail: 't2.jpg',
      duration: '15:00',
      progressPercent: 90,
      currentTime: 810,
      durationSeconds: 900,
      watchedAt: now - 1 * dayMs // 1 day ago
    }
  ];

  const liked: HistoryEntry[] = [history[1]]; // Liked Rust video

  const result = calculateInterestScores(history, liked);

  expect(result.topChannels.length).toBeGreaterThan(0);
  expect(result.topChannels[0]).toBe('Tech Daily'); // Recent + liked channel scores highest
  expect(result.topTopics.length).toBeGreaterThan(0);
});

test('interleaveFeed combines personal, trending, and explore feeds without duplicates', () => {
  const personalVideos: VideoItem[] = [
    { id: 'p1', title: 'Personal 1', author: 'A1', duration: '5:00', views: '1K', published: '1d', thumbnail: 'p1.jpg' },
    { id: 'p2', title: 'Personal 2', author: 'A2', duration: '6:00', views: '2K', published: '2d', thumbnail: 'p2.jpg' },
    { id: 'dup', title: 'Duplicate Video', author: 'A3', duration: '7:00', views: '3K', published: '3d', thumbnail: 'd.jpg' }
  ];

  const trendingVideos: VideoItem[] = [
    { id: 'dup', title: 'Duplicate Video in Trending', author: 'A3', duration: '7:00', views: '3K', published: '3d', thumbnail: 'd.jpg' },
    { id: 't1', title: 'Trending 1', author: 'A4', duration: '8:00', views: '1M', published: '4d', thumbnail: 't1.jpg' }
  ];

  const exploreVideos: VideoItem[] = [
    { id: 'e1', title: 'Explore 1', author: 'A5', duration: '9:00', views: '500K', published: '5d', thumbnail: 'e1.jpg' }
  ];

  const combined = interleaveFeed({ personalVideos, trendingVideos, exploreVideos });

  // No duplicate IDs
  const ids = combined.map((v) => v.id);
  const uniqueIds = new Set(ids);
  expect(ids.length).toBe(uniqueIds.size);
  expect(uniqueIds.has('p1')).toBe(true);
  expect(uniqueIds.has('t1')).toBe(true);
  expect(uniqueIds.has('e1')).toBe(true);
});

test('filterBlacklist removes not-interested videos and blocked channels', () => {
  const videos: VideoItem[] = [
    { id: 'ok_1', title: 'Great Video', author: 'Good Creator', duration: '10:00', views: '10K', published: '1d', thumbnail: '1.jpg' },
    { id: 'bad_vid', title: 'Clickbait', author: 'Good Creator', duration: '1:00', views: '100K', published: '1d', thumbnail: '2.jpg' },
    { id: 'ok_2', title: 'Another Good Video', author: 'Blocked Creator', duration: '12:00', views: '5K', published: '2d', thumbnail: '3.jpg' }
  ];

  const blacklist: BlacklistData = {
    videos: ['bad_vid'],
    channels: ['blocked creator']
  };

  const filtered = filterBlacklist(videos, blacklist);
  expect(filtered.length).toBe(1);
  expect(filtered[0].id).toBe('ok_1');
});
