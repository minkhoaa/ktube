import { test, expect, beforeEach } from 'bun:test';
import {
  getLibraryData,
  recordHistoryProgress,
  toggleLikedVideo,
  isVideoLiked,
  toggleSubscription,
  isSubscribed,
  clearHistory,
  addNotInterestedVideo,
  removeNotInterestedVideo,
  blockChannel,
  unblockChannel,
  isBlacklisted,
  addSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
  getSearchHistory
} from './libraryStore';

beforeEach(() => {
  clearHistory();
});

test('records history progress and clamps threshold > 95%', () => {
  recordHistoryProgress({ id: 'v1', title: 'Video 1', author: 'A1', thumbnail: 't1.jpg', duration: '16:40' }, 100, 1000);
  expect(getLibraryData().history[0].progressPercent).toBe(10);
  expect(getLibraryData().history[0].currentTime).toBe(100);

  // When > 95% threshold (Review Focus 4)
  recordHistoryProgress({ id: 'v1', title: 'Video 1', author: 'A1', thumbnail: 't1.jpg', duration: '16:40' }, 980, 1000);
  expect(getLibraryData().history[0].currentTime).toBe(0); // Resets to 0 for next watch
  expect(getLibraryData().history[0].progressPercent).toBe(100);
});

test('toggles liked video and subscription', () => {
  expect(isVideoLiked('v1')).toBe(false);
  toggleLikedVideo({ id: 'v1', title: 'Video 1', author: 'A1', thumbnail: 't1.jpg', duration: '10:00', progressPercent: 0, currentTime: 0, durationSeconds: 600, watchedAt: Date.now() });
  expect(isVideoLiked('v1')).toBe(true);
  toggleLikedVideo({ id: 'v1', title: 'Video 1', author: 'A1', thumbnail: 't1.jpg', duration: '10:00', progressPercent: 0, currentTime: 0, durationSeconds: 600, watchedAt: Date.now() });
  expect(isVideoLiked('v1')).toBe(false);

  expect(isSubscribed('ch1')).toBe(false);
  toggleSubscription({ channelId: 'ch1', channelName: 'Channel 1', avatar: 'c.jpg', subscribedAt: Date.now() });
  expect(isSubscribed('ch1')).toBe(true);
  toggleSubscription({ channelId: 'ch1', channelName: 'Channel 1', avatar: 'c.jpg', subscribedAt: Date.now() });
  expect(isSubscribed('ch1')).toBe(false);
});

test('manages blacklist with not-interested videos and blocked channels', () => {
  expect(isBlacklisted('video_123', 'Sample Channel')).toBe(false);

  // Add video to not interested
  addNotInterestedVideo('video_123');
  expect(isBlacklisted('video_123', 'Sample Channel')).toBe(true);
  expect(isBlacklisted('video_456', 'Sample Channel')).toBe(false);

  // Remove video (Undo)
  removeNotInterestedVideo('video_123');
  expect(isBlacklisted('video_123', 'Sample Channel')).toBe(false);

  // Block channel
  blockChannel('Toxic Channel');
  expect(isBlacklisted('any_video_id', 'Toxic Channel')).toBe(true);
  expect(isBlacklisted('any_video_id', 'Good Channel')).toBe(false);

  // Unblock channel (Undo)
  unblockChannel('Toxic Channel');
  expect(isBlacklisted('any_video_id', 'Toxic Channel')).toBe(false);
});

test('manages search history with deduplication and cap at 50 items', () => {
  clearSearchHistory();
  expect(getSearchHistory()).toEqual([]);

  addSearchQuery('lofi chill');
  addSearchQuery('son tung mtp');
  addSearchQuery('lofi chill'); // duplicate should move to top

  const history = getSearchHistory();
  expect(history.length).toBe(2);
  expect(history[0].query).toBe('lofi chill');
  expect(history[1].query).toBe('son tung mtp');

  removeSearchQuery('lofi chill');
  expect(getSearchHistory().length).toBe(1);
  expect(getSearchHistory()[0].query).toBe('son tung mtp');

  clearSearchHistory();
  expect(getSearchHistory()).toEqual([]);

  // Test cap at 50 items (Review Focus 3)
  for (let i = 1; i <= 55; i++) {
    addSearchQuery(`query ${i}`);
  }
  const capped = getSearchHistory();
  expect(capped.length).toBe(50);
  expect(capped[0].query).toBe('query 55'); // most recent
  expect(capped[49].query).toBe('query 6'); // oldest preserved, 1-5 dropped
});


