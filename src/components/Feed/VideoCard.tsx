import { useState, useRef, useEffect } from 'preact/hooks';
import Hls from 'hls.js';
import type { VideoItem } from '../../types';
import { thumbnailObserver } from '../../services/imageObserver';
import { CardActionMenu } from './CardActionMenu';
import './VideoCard.css';

interface VideoCardProps {
  video: VideoItem;
  onSelect: (videoId: string, title?: string, author?: string, thumbnail?: string) => void;
  onSelectChannel?: (channelName: string) => void;
  onHideVideo?: (videoId: string) => void;
  onHideChannel?: (channelName: string) => void;
}

const prefetchedIds = new Set<string>();

let globalActivePreviewId: string | null = null;
const previewListeners = new Set<(id: string | null) => void>();

function setActivePreview(id: string | null) {
  globalActivePreviewId = id;
  for (const fn of previewListeners) {
    try {
      fn(id);
    } catch {}
  }
}

function prefetchVideo(id: string) {
  if (!id || prefetchedIds.has(id)) return;
  prefetchedIds.add(id);
  fetch(`/api/info?v=${encodeURIComponent(id)}`, { priority: 'low' } as any).catch(() => {});
  fetch(`/api/stream/master.m3u8?v=${encodeURIComponent(id)}`, { priority: 'low' } as any).catch(() => {});
}

export function VideoCard({
  video,
  onSelect,
  onSelectChannel,
  onHideVideo,
  onHideChannel
}: VideoCardProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const hoverTimer = useRef<any>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Sync with global active preview singleton so only 1 preview can ever exist
  useEffect(() => {
    const listener = (activeId: string | null) => {
      if (activeId !== video.id) {
        if (hoverTimer.current) {
          clearTimeout(hoverTimer.current);
          hoverTimer.current = null;
        }
        setIsPreviewing(false);
      }
    };
    previewListeners.add(listener);
    return () => {
      previewListeners.delete(listener);
    };
  }, [video.id]);

  // Centralized batch thumbnail observer
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !thumbnailObserver) return;

    thumbnailObserver.observe(img);
    return () => {
      thumbnailObserver?.unobserve(img);
    };
  }, [video.thumbnail]);

  // Hover Preview lifecycle with Hls.js
  useEffect(() => {
    if (!isPreviewing || !previewVideoRef.current) return;
    const vidEl = previewVideoRef.current;
    let hls: Hls | null = null;
    const streamUrl = `/api/stream/master.m3u8?v=${encodeURIComponent(video.id)}`;

    if (Hls.isSupported()) {
      hls = new Hls({
        capLevelToPlayerSize: true,
        maxBufferLength: 6,
        maxMaxBufferLength: 10,
        autoStartLoad: true,
        startLevel: 0 // Lowest bitrate (240p/360p) for ultra-fast, lightweight preview
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(vidEl);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        vidEl.play().catch(() => {});
      });
    } else if (vidEl.canPlayType('application/vnd.apple.mpegurl')) {
      vidEl.src = streamUrl;
      vidEl.play().catch(() => {});
    }

    return () => {
      if (hls) {
        hls.destroy();
        hls = null;
      }
      vidEl.pause();
      vidEl.removeAttribute('src');
      vidEl.load();
    };
  }, [isPreviewing, video.id]);

  const handleMouseEnter = () => {
    prefetchVideo(video.id);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // 400ms debounce before starting video preview
    hoverTimer.current = setTimeout(() => {
      setActivePreview(video.id);
      setIsPreviewing(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setActivePreview(null);
    setIsPreviewing(false);
  };

  const handleTouchStart = () => {
    prefetchVideo(video.id);
  };

  const handleChannelClick = (e: MouseEvent) => {
    e.stopPropagation();
    setActivePreview(null);
    setIsPreviewing(false);
    if (onSelectChannel && video.author) {
      onSelectChannel(video.author);
    }
  };

  const handleCardClick = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setActivePreview(null);
    setIsPreviewing(false);
    onSelect(video.id, video.title, video.author, video.thumbnail);
  };

  if (isDismissed) {
    return <div className="video-card dismissed" />;
  }

  return (
    <div
      className={`video-card ${isPreviewing ? 'previewing' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
    >
      <div className="thumbnail-container">
        <img
          ref={imgRef}
          className="thumbnail-img yt-lazy-thumb"
          data-src={video.thumbnail || 'https://via.placeholder.com/640x360?text=YouTube'}
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3C/svg%3E"
          alt={video.title}
        />
        {isPreviewing && (
          <div className="hover-preview-wrapper">
            <video
              ref={previewVideoRef}
              className="hover-preview-video"
              muted
              autoPlay
              playsInline
              loop
            />
            <div className="hover-preview-progress" />
          </div>
        )}
        {video.duration && <span className="duration-badge">{video.duration}</span>}
      </div>

      <div className="card-details">
        <div
          className="channel-avatar-wrapper"
          onClick={handleChannelClick}
          title={`Xem kênh: ${video.author}`}
        >
          {video.authorAvatar ? (
            <img className="channel-avatar" src={video.authorAvatar} alt={video.author} loading="lazy" />
          ) : (
            <div className="channel-avatar-fallback">
              {(video.author || 'Y').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="meta-content">
          <h3 className="video-card-title" title={video.title}>
            {video.title}
          </h3>
          <span
            className="video-card-channel"
            title={video.author}
            onClick={handleChannelClick}
          >
            {video.author}
          </span>
          <div className="video-card-stats">
            {video.views && <span>{video.views}</span>}
            {video.views && video.published && <span>•</span>}
            {video.published && <span>{video.published}</span>}
          </div>
        </div>

        <CardActionMenu
          videoId={video.id}
          channelName={video.author}
          onHideVideo={() => {
            setIsDismissed(true);
            setTimeout(() => {
              if (onHideVideo) onHideVideo(video.id);
            }, 250);
          }}
          onHideChannel={() => {
            setIsDismissed(true);
            setTimeout(() => {
              if (onHideChannel) onHideChannel(video.author);
            }, 250);
          }}
        />
      </div>
    </div>
  );
}
