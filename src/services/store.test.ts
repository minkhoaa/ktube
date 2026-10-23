import { test, expect } from 'bun:test';
import {
  getAppState,
  setAppState,
  subscribeAppState,
  playVideo,
  closePlayer,
  setView,
  updatePlayerState,
  toggleTheater,
  toggleLoop,
  setNextVideo,
  startPageLoading,
  completePageLoading,
  subscribePageLoading
} from './store';

test('store manages view, activeVideo, and notifies subscribers', () => {
  let notifiedState: any = null;
  const unsub = subscribeAppState((s) => { notifiedState = s; });

  setView('search');
  expect(getAppState().view).toBe('search');
  expect(notifiedState?.view).toBe('search');

  playVideo({ id: 'test1234', title: 'Test Video', author: 'Test Author', thumbnail: 'test.jpg' });
  expect(getAppState().activeVideo?.id).toBe('test1234');
  expect(getAppState().playerState.mode).toBe('docked');
  expect(getAppState().view).toBe('watch');

  setView('feed');
  expect(getAppState().view).toBe('feed');
  expect(getAppState().playerState.mode).toBe('miniplayer');

  updatePlayerState({ isPlaying: true, currentTime: 42 });
  expect(getAppState().playerState.isPlaying).toBe(true);
  expect(getAppState().playerState.currentTime).toBe(42);

  closePlayer();
  expect(getAppState().activeVideo).toBeNull();
  expect(getAppState().playerState.mode).toBe('hidden');

  unsub();
});

test('store manages theater mode, loop mode, and nextVideo', () => {
  expect(getAppState().playerState.isTheater).toBe(false);
  toggleTheater();
  expect(getAppState().playerState.isTheater).toBe(true);
  toggleTheater();
  expect(getAppState().playerState.isTheater).toBe(false);

  expect(getAppState().playerState.isLoop).toBe(false);
  toggleLoop();
  expect(getAppState().playerState.isLoop).toBe(true);
  toggleLoop();
  expect(getAppState().playerState.isLoop).toBe(false);

  expect(getAppState().playerState.nextVideo).toBeNull();
  setNextVideo({ id: 'next123', title: 'Next Video', author: 'Author', thumbnail: 'thumb.jpg' });
  expect(getAppState().playerState.nextVideo?.id).toBe('next123');
  setNextVideo(null);
  expect(getAppState().playerState.nextVideo).toBeNull();
});

test('store manages page loading state notifications', () => {
  let loadingHistory: boolean[] = [];
  const unsub = subscribePageLoading((isLoading) => {
    loadingHistory.push(isLoading);
  });

  startPageLoading();
  expect(loadingHistory[loadingHistory.length - 1]).toBe(true);

  completePageLoading();
  expect(loadingHistory[loadingHistory.length - 1]).toBe(false);

  unsub();
});
