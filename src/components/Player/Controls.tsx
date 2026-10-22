import './Controls.css';

interface ControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext?: () => void;
  volume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onChangeVolume: (vol: number) => void;
  currentTime: number;
  duration: number;
  isTheater: boolean;
  onToggleTheater: () => void;
  onTogglePiP: () => void;
  onToggleFullscreen: () => void;
  onToggleSettings: () => void;
  isSettingsOpen: boolean;
  isCaptionsActive?: boolean;
  hasCaptions?: boolean;
  onToggleCaptions?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Controls({
  isPlaying,
  onTogglePlay,
  onNext,
  volume,
  isMuted,
  onToggleMute,
  onChangeVolume,
  currentTime,
  duration,
  isTheater,
  onToggleTheater,
  onTogglePiP,
  onToggleFullscreen,
  onToggleSettings,
  isSettingsOpen,
  isCaptionsActive = false,
  hasCaptions = false,
  onToggleCaptions
}: ControlsProps) {
  const currentVol = isMuted ? 0 : volume;

  return (
    <div className="player-controls-bar">
      {/* Left controls */}
      <div className="controls-left">
        <button className="control-btn" onClick={onTogglePlay} title={isPlaying ? 'Tạm dừng (k)' : 'Phát (k)'}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {onNext && (
          <button className="control-btn" onClick={onNext} title="Video tiếp theo (Shift+N)">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        )}

        <div className="volume-control-wrapper">
          <button className="control-btn" onClick={onToggleMute} title={isMuted ? 'Bật âm thanh (m)' : 'Tắt tiếng (m)'}>
            {currentVol === 0 ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : currentVol < 0.5 ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={currentVol}
            className="volume-slider"
            onChange={(e: any) => onChangeVolume(parseFloat(e.target.value))}
            title="Âm lượng"
          />
        </div>

        <div className="time-display">
          <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="controls-right">
        <button
          className={`control-btn ${isCaptionsActive ? 'active' : ''}`}
          onClick={onToggleCaptions}
          disabled={!hasCaptions}
          title={isCaptionsActive ? 'Tắt phụ đề (c)' : 'Bật phụ đề (c)'}
          style={{ opacity: hasCaptions ? 1 : 0.4 }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z" />
          </svg>
        </button>
        <button
          className={`control-btn ${isSettingsOpen ? 'active' : ''}`}
          onClick={onToggleSettings}
          title="Cài đặt"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>

        <button className="control-btn" onClick={onTogglePiP} title="Hình trong hình (PiP)">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z" />
          </svg>
        </button>

        <button className="control-btn" onClick={onToggleTheater} title="Chế độ rạp chiếu phim (t)">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z" />
          </svg>
        </button>

        <button className="control-btn" onClick={onToggleFullscreen} title="Toàn màn hình (f)">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
