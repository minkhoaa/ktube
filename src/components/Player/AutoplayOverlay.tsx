import { useState, useEffect } from 'preact/hooks';
import type { ActiveVideo } from '../../services/store';
import './AutoplayOverlay.css';

interface AutoplayOverlayProps {
  nextVideo: ActiveVideo;
  onPlayNow: () => void;
  onCancel: () => void;
}

export function AutoplayOverlay({ nextVideo, onPlayNow, onCancel }: AutoplayOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onPlayNow();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft, onPlayNow]);

  const circleRadius = 24;
  const circumference = 2 * Math.PI * circleRadius; // ~150.796
  const strokeDashoffset = circumference - (secondsLeft / 5) * circumference;

  return (
    <div className="autoplay-countdown-overlay">
      <div className="autoplay-countdown-card">
        <div className="autoplay-countdown-header">
          <span>Video tiếp theo sau {secondsLeft} giây</span>
        </div>

        <div className="autoplay-next-preview" onClick={onPlayNow}>
          <div className="autoplay-thumb-wrapper">
            <img src={nextVideo.thumbnail} alt={nextVideo.title} className="autoplay-thumb-img" />
            <div className="autoplay-circle-timer">
              <svg className="timer-svg" width="56" height="56" viewBox="0 0 56 56">
                <circle
                  className="timer-bg-circle"
                  cx="28"
                  cy="28"
                  r={circleRadius}
                  stroke-width="3"
                />
                <circle
                  className="timer-progress-circle"
                  cx="28"
                  cy="28"
                  r={circleRadius}
                  stroke-width="3"
                  style={{
                    strokeDasharray: `${circumference}`,
                    strokeDashoffset: `${strokeDashoffset}`
                  }}
                />
              </svg>
              <div className="timer-play-icon">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="autoplay-info-wrapper">
            <h4 className="autoplay-title" title={nextVideo.title}>{nextVideo.title}</h4>
            <p className="autoplay-author">{nextVideo.author}</p>
          </div>
        </div>

        <div className="autoplay-actions-row">
          <button className="autoplay-cancel-btn" onClick={onCancel}>
            HỦY
          </button>
          <button className="autoplay-play-now-btn" onClick={onPlayNow}>
            PHÁT NGAY
          </button>
        </div>
      </div>
    </div>
  );
}
