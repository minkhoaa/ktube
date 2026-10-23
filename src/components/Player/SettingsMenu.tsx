import { useState } from 'preact/hooks';
import type { QualityLevel, AudioTrackInfo } from '../../hooks/useHls';
import './SettingsMenu.css';

interface SettingsMenuProps {
  levels: QualityLevel[];
  currentLevel: number;
  onSelectLevel: (levelId: number) => void;
  audioTracks: AudioTrackInfo[];
  currentAudioTrack: number;
  onSelectAudioTrack: (trackId: number) => void;
  playbackRate: number;
  onSelectPlaybackRate: (rate: number) => void;
  onClose: () => void;
  availableLanguages?: Array<{ code: string; name: string }>;
  selectedLanguage?: string | null;
  onSelectLanguage?: (code: string | null) => void;
  isAmbientEnabled?: boolean;
  onToggleAmbient?: () => void;
  isLoop?: boolean;
  onToggleLoop?: () => void;
}

type MenuPage = 'main' | 'quality' | 'speed' | 'audio' | 'captions';

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function SettingsMenu({
  levels,
  currentLevel,
  onSelectLevel,
  audioTracks,
  currentAudioTrack,
  onSelectAudioTrack,
  playbackRate,
  onSelectPlaybackRate,
  onClose,
  availableLanguages = [],
  selectedLanguage = null,
  onSelectLanguage,
  isAmbientEnabled = true,
  onToggleAmbient,
  isLoop = false,
  onToggleLoop
}: SettingsMenuProps) {
  const [page, setPage] = useState<MenuPage>('main');

  const getCurrentQualityLabel = () => {
    if (currentLevel === -1) return 'Tự động';
    const found = levels.find((l) => l.id === currentLevel);
    return found ? found.label : 'Tự động';
  };

  const getCurrentSpeedLabel = () => {
    if (playbackRate === 1) return 'Chuẩn';
    return `${playbackRate}x`;
  };

  const getCurrentAudioLabel = () => {
    if (audioTracks.length === 0) return 'Gốc';
    const current = audioTracks[currentAudioTrack];
    if (!current) return 'Gốc';
    return current.isVietnamese ? 'Tiếng Việt (Thuyết minh)' : current.name;
  };

  const getCurrentCaptionsLabel = () => {
    if (!selectedLanguage) return 'Tắt';
    const found = availableLanguages.find((l) => l.code === selectedLanguage);
    return found ? found.name : 'Bật';
  };

  if (page === 'captions') {
    return (
      <div className="settings-popup">
        <div className="settings-header" onClick={() => setPage('main')}>
          <span>‹</span>
          <span>Phụ đề</span>
        </div>
        <div
          className="settings-item"
          onClick={() => {
            onSelectLanguage?.(null);
            onClose();
          }}
        >
          <span>Tắt</span>
          {!selectedLanguage && <span className="settings-check-icon">✓</span>}
        </div>
        {availableLanguages.map((lang) => (
          <div
            key={lang.code}
            className="settings-item"
            onClick={() => {
              onSelectLanguage?.(lang.code);
              onClose();
            }}
          >
            <span>{lang.name}</span>
            {selectedLanguage === lang.code && <span className="settings-check-icon">✓</span>}
          </div>
        ))}
      </div>
    );
  }

  if (page === 'quality') {
    return (
      <div className="settings-popup">
        <div className="settings-header" onClick={() => setPage('main')}>
          <span>‹</span>
          <span>Chất lượng</span>
        </div>
        <div
          className="settings-item"
          onClick={() => {
            onSelectLevel(-1);
            onClose();
          }}
        >
          <span>Tự động</span>
          {currentLevel === -1 && <span className="settings-check-icon">✓</span>}
        </div>
        {levels.map((lvl) => (
          <div
            key={lvl.id}
            className="settings-item"
            onClick={() => {
              onSelectLevel(lvl.id);
              onClose();
            }}
          >
            <span>{lvl.label}</span>
            {currentLevel === lvl.id && <span className="settings-check-icon">✓</span>}
          </div>
        ))}
      </div>
    );
  }

  if (page === 'speed') {
    return (
      <div className="settings-popup">
        <div className="settings-header" onClick={() => setPage('main')}>
          <span>‹</span>
          <span>Tốc độ phát</span>
        </div>
        {SPEEDS.map((s) => (
          <div
            key={s}
            className="settings-item"
            onClick={() => {
              onSelectPlaybackRate(s);
              onClose();
            }}
          >
            <span>{s === 1 ? 'Chuẩn' : `${s}x`}</span>
            {playbackRate === s && <span className="settings-check-icon">✓</span>}
          </div>
        ))}
      </div>
    );
  }

  if (page === 'audio') {
    return (
      <div className="settings-popup">
        <div className="settings-header" onClick={() => setPage('main')}>
          <span>‹</span>
          <span>Âm thanh / Thuyết minh</span>
        </div>
        {audioTracks.length === 0 ? (
          <div className="settings-item">
            <span>Âm thanh mặc định</span>
            <span className="settings-check-icon">✓</span>
          </div>
        ) : (
          audioTracks.map((trk) => (
            <div
              key={trk.id}
              className="settings-item"
              onClick={() => {
                onSelectAudioTrack(trk.id);
                onClose();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>{trk.name}</span>
                {trk.isVietnamese && <span className="vi-badge">🇻🇳 Tiếng Việt</span>}
              </div>
              {currentAudioTrack === trk.id && <span className="settings-check-icon">✓</span>}
            </div>
          ))
        )}
      </div>
    );
  }

  // Main Page
  return (
    <div className="settings-popup">
      <div className="settings-item" onClick={() => setPage('audio')}>
        <div className="settings-item-left">
          <span>Âm thanh</span>
        </div>
        <div className="settings-item-right">
          <span>{getCurrentAudioLabel()}</span>
          <span>›</span>
        </div>
      </div>

      <div className="settings-item" onClick={() => setPage('quality')}>
        <div className="settings-item-left">
          <span>Chất lượng</span>
        </div>
        <div className="settings-item-right">
          <span>{getCurrentQualityLabel()}</span>
          <span>›</span>
        </div>
      </div>

      <div className="settings-item" onClick={() => setPage('speed')}>
        <div className="settings-item-left">
          <span>Tốc độ phát</span>
        </div>
        <div className="settings-item-right">
          <span>{getCurrentSpeedLabel()}</span>
          <span>›</span>
        </div>
      </div>
      <div className="settings-item" onClick={() => setPage('captions')}>
        <div className="settings-item-left">
          <span>Phụ đề</span>
        </div>
        <div className="settings-item-right">
          <span>{getCurrentCaptionsLabel()}</span>
          <span>›</span>
        </div>
      </div>

      <div
        className="settings-item"
        onClick={() => onToggleAmbient?.()}
      >
        <div className="settings-item-left">
          <span>Ánh sáng nền (Ambient)</span>
        </div>
        <div className="settings-item-right">
          <span>{isAmbientEnabled ? 'Bật' : 'Tắt'}</span>
        </div>
      </div>

      <div
        className="settings-item"
        onClick={() => onToggleLoop?.()}
      >
        <div className="settings-item-left">
          <span>Vòng lặp (Loop)</span>
        </div>
        <div className="settings-item-right">
          <span>{isLoop ? 'Bật' : 'Tắt'}</span>
        </div>
      </div>
    </div>
  );
}
