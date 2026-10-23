import { useState, useRef, useEffect } from 'preact/hooks';
import { useHls } from '../../hooks/useHls';
import { useCaptions } from '../../hooks/useCaptions';
import { useAmbientCanvas } from '../../hooks/useAmbientCanvas';
import { CaptionsOverlay } from './CaptionsOverlay';
import { Seekbar } from './Seekbar';
import { Controls } from './Controls';
import { SettingsMenu } from './SettingsMenu';
import './CustomPlayer.css';
import '../../styles/ambient.css';

interface CustomPlayerProps {
  videoId: string;
  thumbnail?: string;
  isTheater: boolean;
  onToggleTheater: () => void;
  onNext?: () => void;
}

export function CustomPlayer({ videoId, thumbnail, isTheater, onToggleTheater, onNext }: CustomPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isIdle, setIsIdle] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [isAmbientEnabled, setIsAmbientEnabled] = useState(() => {
    try {
      return localStorage.getItem('puretube_ambient_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const toggleAmbient = () => {
    setIsAmbientEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('puretube_ambient_enabled', String(next));
      } catch {}
      return next;
    });
  };

  const toggleLoop = () => {
    setIsLoop((prev) => {
      const next = !prev;
      if (videoRef.current) {
        videoRef.current.loop = next;
      }
      return next;
    });
  };

  const seekRelative = (offset: number) => {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration || 0;
    video.currentTime = Math.max(0, Math.min(dur, video.currentTime + offset));
  };
  const [splashState, setSplashState] = useState<'play' | 'pause' | null>(null);

  const idleTimerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    levels,
    currentLevel,
    setLevel,
    audioTracks,
    currentAudioTrack,
    setAudioTrack,
    hasVietnameseDub,
    error,
    isLoading,
    retry
  } = useHls(videoRef, videoId);

  const {
    availableLanguages,
    selectedLanguage,
    currentCueText,
    hasCaptions,
    toggleCaptions,
    setLanguage
  } = useCaptions(videoRef, videoId);

  // Sample ambient glow on canvas
  useAmbientCanvas(videoRef, canvasRef, isAmbientEnabled);

  // Sync video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Audio is ALWAYS unmuted by default
    video.muted = false;
    if (video.volume === 0) video.volume = 1;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  // Idle timer to auto-hide controls
  const resetIdleTimer = () => {
    setIsIdle(false);
    clearTimeout(idleTimerRef.current);
    if (isPlaying && !isSettingsOpen) {
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 2500);
    }
  };

  // Automatically unmute on first document interaction if video was auto-muted by browser policy
  useEffect(() => {
    const handleFirstInteraction = () => {
      const video = videoRef.current;
      if (video && video.muted) {
        video.muted = false;
        setIsMuted(false);
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    // Unmute immediately on any direct player interaction
    if (video.muted) {
      video.muted = false;
      setIsMuted(false);
    }

    if (video.paused) {
      video.play().catch(() => {});
      setSplashState('play');
    } else {
      video.pause();
      setSplashState('pause');
    }
    setTimeout(() => setSplashState(null), 500);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const changeVolume = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVol;
    if (newVol > 0 && video.muted) {
      video.muted = false;
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      await video.requestPictureInPicture();
    }
  };

  const toggleFullscreen = () => {
    const wrapper = playerWrapperRef.current;
    if (!wrapper) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapper.requestFullscreen().catch(() => {});
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNext?.();
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 't':
          e.preventDefault();
          onToggleTheater();
          break;
        case 'c':
          e.preventDefault();
          toggleCaptions();
          break;
        case 'j':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'l':
          e.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
          break;
        case 'arrowup':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.05);
          break;
        case 'arrowdown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.05);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isTheater]);

  return (
    <div
      ref={playerWrapperRef}
      className={`custom-player-wrapper ${isTheater ? 'theater-mode' : ''}`}
      onMouseEnter={resetIdleTimer}
      onMouseMove={resetIdleTimer}
      onMouseLeave={() => isPlaying && !isSettingsOpen && setIsIdle(true)}
    >
      {/* Ambient Lighting Canvas Backdrop (only mounted when user enables) */}
      {isAmbientEnabled && (
        <div className="player-ambient-canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="player-ambient-canvas"
            width={64}
            height={36}
          />
        </div>
      )}

      <video
        ref={videoRef}
        className="player-video-element"
        poster={thumbnail}
        playsInline
      />

      {/* Top Dub & Unmute Badge */}
      <div className="player-top-badge-row">
        {hasVietnameseDub && (
          <div className="vietnamese-audio-pill">
            <span>🇻🇳 Đang phát Thuyết minh Tiếng Việt</span>
          </div>
        )}
        {isMuted && (
          <button
            className="unmute-audio-pill"
            onClick={(e) => {
              e.stopPropagation();
              const video = videoRef.current;
              if (video) {
                video.muted = false;
                setIsMuted(false);
              }
            }}
            title="Nhấp để bật tiếng"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
            <span>Nhấp để bật tiếng</span>
          </button>
        )}
      </div>

      {/* Center Clickable Area */}
      <div className="player-center-click-area" onClick={togglePlay}>
        {!isPlaying && !isLoading && (
          <div className="center-play-button" title="Phát video">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        {splashState === 'play' && (
          <div className="play-pause-splash-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        {splashState === 'pause' && (
          <div className="play-pause-splash-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Settings Popup */}
      {isSettingsOpen && (
        <SettingsMenu
          levels={levels}
          currentLevel={currentLevel}
          onSelectLevel={setLevel}
          audioTracks={audioTracks}
          currentAudioTrack={currentAudioTrack}
          onSelectAudioTrack={setAudioTrack}
          playbackRate={playbackRate}
          onSelectPlaybackRate={changePlaybackRate}
          availableLanguages={availableLanguages}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setLanguage}
          isAmbientEnabled={isAmbientEnabled}
          onToggleAmbient={toggleAmbient}
          isLoop={isLoop}
          onToggleLoop={toggleLoop}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Captions Text Overlay */}
      <CaptionsOverlay text={currentCueText} />

      {/* Error Overlay */}
      {error && (
        <div className="player-error-overlay">
          <p>{error}</p>
          <button className="player-retry-btn" onClick={retry}>
            Thử lại
          </button>
        </div>
      )}

      {/* Bottom UI Overlay */}
      <div className={`player-ui-overlay ${isIdle ? 'idle-hidden' : ''}`}>
        <Seekbar videoRef={videoRef} duration={duration} />
        <Controls
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onNext={onNext}
          onSeekRelative={seekRelative}
          volume={volume}
          isMuted={isMuted}
          onToggleMute={toggleMute}
          onChangeVolume={changeVolume}
          currentTime={currentTime}
          duration={duration}
          isTheater={isTheater}
          onToggleTheater={onToggleTheater}
          onTogglePiP={togglePiP}
          onToggleFullscreen={toggleFullscreen}
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          isSettingsOpen={isSettingsOpen}
          isCaptionsActive={!!selectedLanguage}
          hasCaptions={hasCaptions}
          onToggleCaptions={toggleCaptions}
        />
      </div>
    </div>
  );
}
