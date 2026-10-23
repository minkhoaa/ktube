import { useState, useEffect } from 'preact/hooks';
import type { VideoItem } from '../../types';
import { fetchFeed } from '../../services/api';
import { setNextVideo } from '../../services/store';
import './RelatedVideos.css';

interface RelatedVideosProps {
  currentVideoId: string;
  onSelectVideo: (videoId: string) => void;
  onNextReady?: (videoId: string) => void;
}

const prefetchedIds = new Set<string>();

function prefetchVideo(id: string) {
  if (!id || prefetchedIds.has(id)) return;
  prefetchedIds.add(id);
  fetch(`/api/info?v=${encodeURIComponent(id)}`, { priority: 'low' } as any).catch(() => {});
  fetch(`/api/stream/master.m3u8?v=${encodeURIComponent(id)}`, { priority: 'low' } as any).catch(() => {});
}

export function RelatedVideos({ currentVideoId, onSelectVideo, onNextReady }: RelatedVideosProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isAutoplay, setIsAutoplay] = useState(true);

  useEffect(() => {
    fetchFeed()
      .then((items) => {
        const filtered = items.filter((v) => v.id !== currentVideoId);
        setVideos(filtered);
        if (filtered.length > 0) {
          const first = filtered[0];
          if (isAutoplay) {
            setNextVideo({
              id: first.id,
              title: first.title,
              author: first.author,
              thumbnail: first.thumbnail
            });
          }
          if (onNextReady) {
            onNextReady(first.id);
          }
        } else {
          setNextVideo(null);
        }
      })
      .catch((err) => console.error('Related videos error:', err));
  }, [currentVideoId]);

  return (
    <div className="related-videos-container">
      <div className="related-header-bar">
        <span style={{ fontSize: '15px', fontWeight: 600 }}>Video đề xuất</span>
        <label className="autoplay-toggle-wrapper">
          <span>Tự động phát</span>
          <div className="autoplay-switch">
            <input
              type="checkbox"
              checked={isAutoplay}
              onChange={(e: any) => {
                const checked = e.target.checked;
                setIsAutoplay(checked);
                if (!checked) {
                  setNextVideo(null);
                } else if (videos.length > 0) {
                  setNextVideo({
                    id: videos[0].id,
                    title: videos[0].title,
                    author: videos[0].author,
                    thumbnail: videos[0].thumbnail
                  });
                }
              }}
            />
            <span className="slider-round" />
          </div>
        </label>
      </div>

      {videos.map((v) => (
        <div
          key={v.id}
          className="compact-video-card"
          onClick={() => onSelectVideo(v.id)}
          onMouseEnter={() => prefetchVideo(v.id)}
          onTouchStart={() => prefetchVideo(v.id)}
        >
          <div className="compact-thumb-box">
            <img className="compact-thumb-img" src={v.thumbnail} alt={v.title} loading="lazy" />
            {v.duration && <span className="duration-badge">{v.duration}</span>}
          </div>

          <div className="compact-info-col">
            <h4 className="compact-title" title={v.title}>
              {v.title}
            </h4>
            <span className="compact-channel">{v.author}</span>
            <div className="compact-stats">
              {v.views && <span>{v.views}</span>}
              {v.views && v.published && <span>•</span>}
              {v.published && <span>{v.published}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
