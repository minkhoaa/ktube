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
  isTheater: boolean;
  onToggleTheater: () => void;
  onNext?: () => void;
}

export function CustomPlayer({ videoId, isTheater, onToggleTheater, onNext }: CustomPlayerProps) {
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
  const [isAmbientEnabled, setIsAmbientEnabled] = useState(true);
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

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
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
      onMouseMove={resetIdleTimer}
      onMouseLeave={() => isPlaying && !isSettingsOpen && setIsIdle(true)}
    >
      {/* Ambient Lighting Canvas Backdrop */}
      <div className="player-ambient-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className={`player-ambient-canvas ${!isAmbientEnabled ? 'ambient-hidden' : ''}`}
          width={64}
          height={36}
        />
      </div>

      <video
        ref={videoRef}
        className="player-video-element"
        playsInline
      />

      {/* Top Dub Badge */}
      <div className="player-top-badge-row">
        {hasVietnameseDub && (
          <div className="vietnamese-audio-pill">
            <span>🇻🇳 Đang phát Thuyết minh Tiếng Việt</span>
          </div>
        )}
      </div>

      {/* Center Clickable Area */}
      <div className="player-center-click-area" onClick={togglePlay}>
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
          onToggleAmbient={() => setIsAmbientEnabled(prev => !prev)}
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
