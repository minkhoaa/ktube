import { useState, useEffect } from 'preact/hooks';
import type { VideoInfo } from '../../types';
import { fetchVideoInfo } from '../../services/api';
import { getAppState, subscribeAppState } from '../../services/store';
import { VideoMetadata } from './VideoMetadata';
import { DescriptionBox } from './DescriptionBox';
import { CommentsSection } from './CommentsSection';
import { RelatedVideos } from './RelatedVideos';
import './WatchPage.css';

interface WatchPageProps {
  videoId: string;
  onSelectVideo: (videoId: string, title?: string, author?: string, thumbnail?: string) => void;
  onSelectChannel?: (channelId: string) => void;
}

export function WatchPage({ videoId, onSelectVideo, onSelectChannel }: WatchPageProps) {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isTheater, setIsTheater] = useState(() => getAppState().playerState.isTheater || false);
  const [nextVideoId, setNextVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeAppState((state) => {
      const newTheater = state.playerState.isTheater || false;
      setIsTheater(newTheater);
      // Ensure player docks correctly into new slot position
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('redock-player'));
      }, 20);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Notify PersistentPlayer that WatchPage is mounted and player-dock-slot is ready
    window.dispatchEvent(new CustomEvent('redock-player'));

    fetchVideoInfo(videoId)
      .then((info) => {
        if (!cancelled) {
          setVideoInfo(info);
          setLoading(false);
          document.title = `${info.title} - KTube`;
          window.dispatchEvent(new CustomEvent('redock-player'));
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
  }, [videoId, isTheater]);

  const handleNext = () => {
    if (nextVideoId) {
      onSelectVideo(nextVideoId);
    }
  };

  const dockSlot = <div id="player-dock-slot" className="player-dock-slot" />;

  return (
    <div className="watch-page-container">
      {/* If Theater Mode, player sits at the top full width */}
      {isTheater && (
        <div className="theater-top-player">
          {dockSlot}
        </div>
      )}

      <div className="watch-layout-grid">
        {/* Left Column */}
        <div className="watch-primary-col">
          {!isTheater && dockSlot}

          {videoInfo ? (
            <>
              <VideoMetadata info={videoInfo} onSelectChannel={onSelectChannel} />
              <DescriptionBox description={videoInfo.description} />
            </>
          ) : (
            <div className="watch-metadata-skeleton" style={{ padding: '16px 0' }}>
              <div style={{ height: '26px', width: '75%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', marginBottom: '12px' }} />
              <div style={{ height: '42px', width: '45%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '21px' }} />
            </div>
          )}
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
