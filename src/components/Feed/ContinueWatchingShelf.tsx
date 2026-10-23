import { useState, useEffect, useRef } from 'preact/hooks';
import { getLibraryData, subscribeLibrary } from '../../services/libraryStore';
import type { HistoryEntry } from '../../services/libraryStore';
import './ContinueWatchingShelf.css';

interface ContinueWatchingShelfProps {
  onResumeVideo: (video: HistoryEntry) => void;
  onDismiss?: (videoId: string) => void;
}

function formatRemainingTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `Còn ${h}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `Còn ${m}:${s.toString().padStart(2, '0')}`;
}

export function ContinueWatchingShelf({ onResumeVideo, onDismiss }: ContinueWatchingShelfProps) {
  const [history, setHistory] = useState<HistoryEntry[]>(getLibraryData().history);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeLibrary((data) => {
      setHistory(data.history || []);
    });
    return () => unsubscribe();
  }, []);

  const inProgressVideos = history.filter(
    (item) => item.progressPercent >= 5 && item.progressPercent < 95 && !dismissedIds.has(item.id)
  );

  const checkScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScrollButtons();
  }, [inProgressVideos.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
    setTimeout(checkScrollButtons, 300);
  };

  const handleDismiss = (e: MouseEvent, videoId: string) => {
    e.stopPropagation();
    setDismissedIds((prev) => new Set(prev).add(videoId));
    if (onDismiss) onDismiss(videoId);
  };

  if (inProgressVideos.length === 0) {
    return null;
  }

  return (
    <div className="continue-watching-shelf">
      <div className="shelf-header">
        <div className="shelf-title-group">
          <svg className="shelf-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
          </svg>
          <h2 className="shelf-title">Tiếp tục xem</h2>
        </div>

        <div className="shelf-controls">
          {canScrollLeft && (
            <button className="shelf-nav-btn left" onClick={() => handleScroll('left')} title="Cuộn sang trái">
              ‹
            </button>
          )}
          {canScrollRight && (
            <button className="shelf-nav-btn right" onClick={() => handleScroll('right')} title="Cuộn sang phải">
              ›
            </button>
          )}
        </div>
      </div>

      <div className="shelf-scroll-container" ref={scrollRef} onScroll={checkScrollButtons}>
        {inProgressVideos.map((video) => {
          const remainingSecs = Math.max(0, (video.durationSeconds || 0) - (video.currentTime || 0));
          return (
            <div
              key={video.id}
              className="shelf-card"
              onClick={() => onResumeVideo(video)}
              title={`Phát tiếp: ${video.title}`}
            >
              <div className="shelf-thumbnail-wrapper">
                <img
                  className="shelf-thumb-img"
                  src={video.thumbnail || 'https://via.placeholder.com/320x180?text=Video'}
                  alt={video.title}
                  loading="lazy"
                />
                <button
                  className="shelf-dismiss-btn"
                  onClick={(e) => handleDismiss(e, video.id)}
                  title="Xóa khỏi tiếp tục xem"
                >
                  ×
                </button>
                <div className="shelf-play-badge">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {video.duration && <span className="shelf-duration">{video.duration}</span>}
                <div className="shelf-progress-track">
                  <div className="shelf-progress-fill" style={{ width: `${video.progressPercent}%` }} />
                </div>
              </div>

              <div className="shelf-card-info">
                <h3 className="shelf-card-title">{video.title}</h3>
                <span className="shelf-card-author">{video.author}</span>
                {remainingSecs > 0 && (
                  <span className="shelf-card-remaining">{formatRemainingTime(remainingSecs)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
