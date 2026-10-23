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
  isBlacklisted
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
