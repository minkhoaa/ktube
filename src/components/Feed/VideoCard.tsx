import { useRef } from 'preact/hooks';
import type { VideoItem } from '../../types';
import './VideoCard.css';

interface VideoCardProps {
  video: VideoItem;
  onSelect: (videoId: string) => void;
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

  const handleMouseEnter = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      prefetchVideo(video.id);
    }, 150);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
  };

  const handleTouchStart = () => {
    clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => {
      prefetchVideo(video.id);
    }, 100);
  };

  const handleTouchMove = () => {
    clearTimeout(touchTimer.current);
  };

  return (
    <div
      className="video-card"
      onClick={() => onSelect(video.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <div className="thumbnail-container">
        <img
          className="thumbnail-img"
          src={video.thumbnail || 'https://via.placeholder.com/640x360?text=YouTube'}
          alt={video.title}
          loading="lazy"
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
