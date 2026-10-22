import { test, expect } from 'bun:test';
import { getAppState, setAppState, subscribeAppState, playVideo, closePlayer, setView, updatePlayerState } from './store';

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
