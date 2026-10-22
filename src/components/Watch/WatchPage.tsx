import { useState, useEffect } from 'preact/hooks';
import type { VideoInfo } from '../../types';
import { fetchVideoInfo } from '../../services/api';
import { CustomPlayer } from '../Player/CustomPlayer';
import { VideoMetadata } from './VideoMetadata';
import { DescriptionBox } from './DescriptionBox';
import { CommentsSection } from './CommentsSection';
import { RelatedVideos } from './RelatedVideos';
import './WatchPage.css';

interface WatchPageProps {
  videoId: string;
  onSelectVideo: (videoId: string) => void;
}

export function WatchPage({ videoId, onSelectVideo }: WatchPageProps) {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isTheater, setIsTheater] = useState(false);
  const [nextVideoId, setNextVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchVideoInfo(videoId)
      .then((info) => {
        if (!cancelled) {
          setVideoInfo(info);
          setLoading(false);
          document.title = `${info.title} - Pure Tuber`;
        }
      })
      .catch((err) => {
        console.error('Info error:', err);
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const handleNext = () => {
    if (nextVideoId) {
      onSelectVideo(nextVideoId);
    }
  };

  if (loading && !videoInfo) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--yt-text-secondary)' }}>
        <p>Đang chuẩn bị luồng phát YouTube VIP...</p>
      </div>
    );
  }

  const playerComponent = (
    <CustomPlayer
      videoId={videoId}
      isTheater={isTheater}
      onToggleTheater={() => setIsTheater(!isTheater)}
      onNext={nextVideoId ? handleNext : undefined}
    />
  );

  return (
    <div className="watch-page-container">
      {/* If Theater Mode, player sits at the top full width */}
      {isTheater && (
        <div className="theater-top-player">
          {playerComponent}
        </div>
      )}

      <div className="watch-layout-grid">
        {/* Left Column */}
        <div className="watch-primary-col">
          {!isTheater && playerComponent}

          {videoInfo && <VideoMetadata info={videoInfo} />}
          {videoInfo && <DescriptionBox description={videoInfo.description} />}
          <CommentsSection videoId={videoId} />
        </div>

        {/* Right Column */}
        <div className="watch-secondary-col">
          <RelatedVideos
            currentVideoId={videoId}
            onSelectVideo={onSelectVideo}
            onNextReady={setNextVideoId}
          />
        </div>
      </div>
    </div>
  );
}
