import { useRef, useEffect } from 'preact/hooks';
import type { VideoItem } from '../../types';
import { thumbnailObserver } from '../../services/imageObserver';
import './VideoCard.css';

interface VideoCardProps {
  video: VideoItem;
  onSelect: (videoId: string, title?: string, author?: string, thumbnail?: string) => void;
}

const prefetchedIds = new Set<string>();

function prefetchVideo(id: string) {
  if (!id || prefetchedIds.has(id)) return;
  prefetchedIds.add(id);
  fetch(`/api/info?v=${encodeURIComponent(id)}`, { priority: 'low' } as any).catch(() => {});
  fetch(`/api/stream/master.m3u8?v=${encodeURIComponent(id)}`, { priority: 'low' } as any).catch(() => {});
}

export function VideoCard({ video, onSelect }: VideoCardProps) {
  const hoverTimer = useRef<any>(null);
  const touchTimer = useRef<any>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Centralized batch thumbnail observer
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !thumbnailObserver) return;

    thumbnailObserver.observe(img);
    return () => {
      thumbnailObserver?.unobserve(img);
    };
  }, [video.thumbnail]);

  const handleMouseEnter = () => {
    prefetchVideo(video.id);
  };

  const handleTouchStart = () => {
    prefetchVideo(video.id);
  };

  return (
    <div
      className="video-card"
      onClick={() => onSelect(video.id, video.title, video.author, video.thumbnail)}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      onPointerDown={handleMouseEnter}
    >
      <div className="thumbnail-container">
        <img
          ref={imgRef}
          className="thumbnail-img yt-lazy-thumb"
          data-src={video.thumbnail || 'https://via.placeholder.com/640x360?text=YouTube'}
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3C/svg%3E"
          alt={video.title}
        />
        {video.duration && <span className="duration-badge">{video.duration}</span>}
      </div>

      <div className="card-details">
        <div className="channel-avatar-wrapper">
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
          <span className="video-card-channel" title={video.author}>
            {video.author}
          </span>
          <div className="video-card-stats">
            {video.views && <span>{video.views}</span>}
            {video.views && video.published && <span>•</span>}
            {video.published && <span>{video.published}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
