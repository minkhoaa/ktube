export interface ActiveVideo {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
}

export interface PlayerState {
  mode: 'docked' | 'miniplayer' | 'hidden';
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  activeAudioTrack: string;
  availableAudioTracks: Array<{ id: string; label: string; language: string }>;
  isTheater?: boolean;
  isLoop?: boolean;
  nextVideo?: ActiveVideo | null;
}

export type AppView = 'feed' | 'search' | 'watch' | 'history' | 'subscriptions' | 'channel' | 'shorts';

export interface AppState {
  view: AppView;
  activeVideo: ActiveVideo | null;
  playerState: PlayerState;
  searchQuery: string;
  selectedChannelId?: string;
  scrollPositions: { feed: number; search: number };
}

const defaultPlayerState: PlayerState = {
  mode: 'hidden',
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  activeAudioTrack: '',
  availableAudioTracks: [],
  isTheater: false,
  isLoop: false,
  nextVideo: null
};

let state: AppState = {
  view: 'feed',
  activeVideo: null,
  playerState: { ...defaultPlayerState },
  searchQuery: '',
  scrollPositions: { feed: 0, search: 0 }
};

const listeners = new Set<(state: AppState) => void>();

function notify() {
  const cloned = {
    ...state,
    playerState: { ...state.playerState },
    scrollPositions: { ...state.scrollPositions }
  };
  for (const listener of listeners) {
    try {
      listener(cloned);
    } catch (e) {
      console.error('Store listener error:', e);
    }
  }
}

export function getAppState(): AppState {
  return state;
}

export function setAppState(partial: Partial<AppState>): void {
  state = {
    ...state,
    ...partial,
    playerState: partial.playerState ? { ...state.playerState, ...partial.playerState } : state.playerState,
    scrollPositions: partial.scrollPositions ? { ...state.scrollPositions, ...partial.scrollPositions } : state.scrollPositions
  };
  notify();
}

export function subscribeAppState(listener: (state: AppState) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updatePlayerState(partial: Partial<PlayerState>): void {
  state = {
    ...state,
    playerState: {
      ...state.playerState,
      ...partial
    }
  };
  notify();
}

export function setView(view: AppView): void {
  let playerMode = state.playerState.mode;
  if (state.activeVideo) {
    if (view === 'watch') {
      playerMode = 'docked';
    } else {
      playerMode = 'miniplayer';
    }
  } else {
    playerMode = 'hidden';
  }

  state = {
    ...state,
    view,
    playerState: {
      ...state.playerState,
      mode: playerMode
    }
  };
  notify();
}

export function playVideo(video: ActiveVideo): void {
  state = {
    ...state,
    view: 'watch',
    activeVideo: video,
    playerState: {
      ...state.playerState,
      mode: 'docked',
      isPlaying: true,
      currentTime: 0
    }
  };
  notify();
}

export function closePlayer(): void {
  state = {
    ...state,
    activeVideo: null,
    playerState: {
      ...defaultPlayerState,
      mode: 'hidden',
      isPlaying: false
    }
  };
  notify();
}

export function toggleTheater(): void {
  updatePlayerState({ isTheater: !state.playerState.isTheater });
}

export function toggleLoop(): void {
  updatePlayerState({ isLoop: !state.playerState.isLoop });
}

export function setNextVideo(video: ActiveVideo | null): void {
  updatePlayerState({ nextVideo: video });
}

