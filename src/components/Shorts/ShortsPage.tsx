import { useState, useEffect, useRef } from 'preact/hooks';
import type { VideoItem } from '../../types';
import Hls from 'hls.js';
import '../../styles/shorts.css';

interface ShortsPageProps {
  onSelectChannel?: (channelId: string) => void;
}

export function ShortsPage({ onSelectChannel }: ShortsPageProps) {
  const [shortsList, setShortsList] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastNavTimeRef = useRef<number>(0);

  // Fetch shorts feed
  useEffect(() => {
    let cancelled = false;
    fetch('/api/shorts')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.results && data.results.length > 0) {
          setShortsList(data.results);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load shorts:', err);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentShort = shortsList[currentIndex];

  // Initialize and update HLS stream when currentIndex changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentShort) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = `/api/stream/master.m3u8?v=${encodeURIComponent(currentShort.id)}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: false,
        testBandwidth: false,
        abrEwmaDefaultEstimate: 5000000,
        maxBufferLength: 10,
        enableWorker: true
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        video.muted = false;
        video.volume = 1;
        const idx1080 = data.levels.findIndex(l => l.height === 1080);
        const idx720 = data.levels.findIndex(l => l.height === 720);
        const initialHd = idx1080 !== -1 ? idx1080 : (idx720 !== -1 ? idx720 : -1);
        if (initialHd !== -1) {
          hls.nextLoadLevel = initialHd;
        }
        video.play().catch(() => {});
        setIsPlaying(true);
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.play().catch(() => {});
      setIsPlaying(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentIndex, currentShort?.id]);

  // Debounced navigation (Review Focus 5)
  const canNavigate = () => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 300) return false;
    lastNavTimeRef.current = now;
    return true;
  };

  const handleNext = () => {
    if (!canNavigate() || currentIndex >= shortsList.length - 1) return;
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (!canNavigate() || currentIndex <= 0) return;
    setCurrentIndex((prev) => prev - 1);
  };

  // Keyboard navigation: ArrowDown / ArrowUp
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, shortsList.length]);

  // Mouse wheel navigation
  const handleWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaY) < 40) return;
    if (e.deltaY > 0) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--yt-text-secondary, #aaa)' }}>
        <p>Đang chuẩn bị luồng YouTube Shorts...</p>
      </div>
    );
  }

  if (!currentShort) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--yt-text-secondary, #aaa)' }}>
        <p>Không có video Shorts nào.</p>
      </div>
    );
  }

  return (
    <div className="shorts-page-container" onWheel={handleWheel}>
      <div className="shorts-viewer-wrapper">
        {/* Vertical 9:16 Frame */}
        <div className="shorts-video-frame">
          <video
            ref={videoRef}
            className="shorts-video-element"
            loop
            playsInline
            onClick={togglePlay}
          />

          {/* Bottom Information Overlay */}
          <div className="shorts-overlay-bottom">
            <div className="shorts-channel-row">
              {currentShort.authorAvatar && (
                <img
                  src={currentShort.authorAvatar}
                  alt={currentShort.author}
                  className="shorts-channel-avatar"
                  onClick={() => onSelectChannel?.(currentShort.author)}
                />
              )}
              <span
                className="shorts-channel-name"
                onClick={() => onSelectChannel?.(currentShort.author)}
              >
                {currentShort.author}
              </span>
            </div>
            <p className="shorts-title-text" title={currentShort.title}>
              {currentShort.title}
            </p>
          </div>
        </div>

        {/* Action Buttons Column */}
        <div className="shorts-actions-column">
          <button className="shorts-action-pill" title="Thích">
            <div className="shorts-action-btn-circle">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
            </div>
            <span className="shorts-action-label">Thích</span>
          </button>

          <button className="shorts-action-pill" title="Không thích">
            <div className="shorts-action-btn-circle">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
              </svg>
            </div>
            <span className="shorts-action-label">Không thích</span>
          </button>

          <button className="shorts-action-pill" title="Chia sẻ">
            <div className="shorts-action-btn-circle">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" />
              </svg>
            </div>
            <span className="shorts-action-label">Chia sẻ</span>
          </button>
        </div>
      </div>

      {/* Up / Down Navigation Buttons on Desktop */}
      <div className="shorts-nav-buttons">
        <button
          className="shorts-nav-btn"
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          title="Short trước (Mũi tên Lên)"
          style={{ opacity: currentIndex <= 0 ? 0.3 : 1 }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
        </button>
        <button
          className="shorts-nav-btn"
          onClick={handleNext}
          disabled={currentIndex >= shortsList.length - 1}
          title="Short tiếp theo (Mũi tên Xuống)"
          style={{ opacity: currentIndex >= shortsList.length - 1 ? 0.3 : 1 }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
