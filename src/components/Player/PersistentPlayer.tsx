import { useState, useEffect, useRef } from 'preact/hooks';
import { getAppState, subscribeAppState, setView, closePlayer, toggleTheater, playVideo } from '../../services/store';
import { CustomPlayer } from './CustomPlayer';
import '../../styles/player.css';

export function PersistentPlayer() {
  const [state, setState] = useState(getAppState());
  const playerWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeAppState((newState) => {
      setState({ ...newState });
    });
  }, []);

  const { activeVideo, playerState, view } = state;

  // DOM Reparenting: Seamless docking into WatchPage vs Floating Miniplayer
  useEffect(() => {
    const wrapper = playerWrapperRef.current;
    if (!wrapper) return;

    if (!activeVideo || playerState.mode === 'hidden') {
      wrapper.className = 'persistent-player-wrapper mode-hidden';
      return;
    }

    let retryTimer: any = null;

    const performDocking = () => {
      if (view === 'watch' && playerState.mode === 'docked') {
        const dockSlot = document.getElementById('player-dock-slot');
        if (dockSlot) {
          if (wrapper.parentElement !== dockSlot) {
            dockSlot.appendChild(wrapper);
          }
          wrapper.className = 'persistent-player-wrapper mode-docked';
        } else {
          // Retry until player-dock-slot is attached to the DOM
          retryTimer = setTimeout(performDocking, 30);
        }
      } else if (playerState.mode === 'miniplayer') {
        const host = document.getElementById('persistent-player-host') || document.body;
        if (wrapper.parentElement !== host) {
          host.appendChild(wrapper);
        }
        wrapper.className = 'persistent-player-wrapper mode-miniplayer';
      }
    };

    performDocking();

    const handleRedock = () => performDocking();
    window.addEventListener('redock-player', handleRedock);

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener('redock-player', handleRedock);
    };
  }, [view, playerState.mode, playerState.isTheater, activeVideo?.id]);

  if (!activeVideo) {
    return (
      <div id="persistent-player-host">
        <div ref={playerWrapperRef} className="persistent-player-wrapper mode-hidden" />
      </div>
    );
  }

  const isMiniplayer = playerState.mode === 'miniplayer';

  const handleNext = () => {
    const next = playerState.nextVideo;
    if (next) {
      playVideo(next);
      window.history.pushState({}, '', `/?v=${encodeURIComponent(next.id)}`);
      window.dispatchEvent(new CustomEvent('redock-player'));
    }
  };

  return (
    <div id="persistent-player-host">
      <div ref={playerWrapperRef} className={`persistent-player-wrapper ${isMiniplayer ? 'mode-miniplayer' : 'mode-docked'}`}>
        {isMiniplayer && (
          <div className="miniplayer-header-bar">
            <span className="miniplayer-title" title={activeVideo.title}>
              {activeVideo.title}
            </span>
            <div className="miniplayer-actions">
              <button
                className="miniplayer-btn"
                title="Mở rộng xem toàn màn hình"
                onClick={() => setView('watch')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M5 19h14v-2H5v2zm0-4h14v-2H5v2zm0-4h14V9H5v2zm0-6v2h14V5H5z"/>
                </svg>
              </button>
              <button
                className="miniplayer-btn"
                title="Đóng trình phát"
                onClick={() => closePlayer()}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        <CustomPlayer
          videoId={activeVideo.id}
          thumbnail={activeVideo.thumbnail}
          isTheater={playerState.isTheater || false}
          onToggleTheater={toggleTheater}
          onNext={playerState.nextVideo ? handleNext : undefined}
        />
      </div>
    </div>
  );
}
