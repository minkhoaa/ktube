import type { VideoItem } from '../../types';
import { VideoCard } from './VideoCard';
import './VideoGrid.css';

interface VideoGridProps {
  videos: VideoItem[];
  loading?: boolean;
  onSelectVideo: (videoId: string) => void;
}

export function VideoGrid({ videos, loading = false, onSelectVideo }: VideoGridProps) {
  if (loading) {
    return (
      <div className="video-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-thumb" />
            <div className="skeleton-meta">
              <div className="skeleton-avatar" />
              <div className="skeleton-text-group">
                <div className="skeleton-line title" />
                <div className="skeleton-line channel" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--yt-text-secondary)' }}>
        <p>Không có video nào để hiển thị.</p>
      </div>
    );
  }

  return (
    <div className="video-grid">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} onSelect={onSelectVideo} />
      ))}
    </div>
  );
}
