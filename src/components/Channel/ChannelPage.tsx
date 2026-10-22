import { useState, useEffect } from 'preact/hooks';
import type { VideoItem } from '../../types';
import { VideoGrid } from '../Feed/VideoGrid';
import { isSubscribed, toggleSubscription, subscribeLibrary } from '../../services/libraryStore';
import '../../styles/channel.css';

interface ChannelData {
  id: string;
  title: string;
  avatar: string;
  banner: string;
  subscribers: string;
  description: string;
  videos: VideoItem[];
}

interface ChannelPageProps {
  channelId: string;
  onSelectVideo: (videoId: string, title?: string, author?: string, thumbnail?: string) => void;
}

export function ChannelPage({ channelId, onSelectVideo }: ChannelPageProps) {
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'about'>('videos');
  const [subscribed, setSubscribed] = useState(isSubscribed(channelId));

  useEffect(() => {
    setSubscribed(isSubscribed(channelId));
    return subscribeLibrary(() => {
      setSubscribed(isSubscribed(channelId));
    });
  }, [channelId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (!channelId) return;

    fetch(`/api/channel?id=${encodeURIComponent(channelId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setChannelData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Channel load error:', err);
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [channelId]);

  const handleToggleSub = () => {
    if (!channelData) return;
    toggleSubscription({
      channelId: channelData.id,
      channelName: channelData.title,
      avatar: channelData.avatar,
      subscribedAt: Date.now()
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--yt-text-secondary, #aaa)' }}>
        <p>Đang tải thông tin kênh YouTube...</p>
      </div>
    );
  }

  if (!channelData) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--yt-text-secondary, #aaa)' }}>
        <p>Không tìm thấy thông tin kênh này.</p>
      </div>
    );
  }

  return (
    <div className="channel-page-container">
      {/* Banner */}
      {channelData.banner && (
        <div className="channel-banner-wrapper">
          <img src={channelData.banner} alt={channelData.title} className="channel-banner-img" />
        </div>
      )}

      {/* Header Info */}
      <div className="channel-header-info">
        <img src={channelData.avatar} alt={channelData.title} className="channel-large-avatar" />
        <div className="channel-title-group">
          <h1 className="channel-main-title">{channelData.title}</h1>
          <p className="channel-sub-stats">{channelData.subscribers || 'Kênh chính thức'}</p>
          <button
            className={`channel-subscribe-btn ${subscribed ? 'subscribed' : 'not-subscribed'}`}
            onClick={handleToggleSub}
          >
            {subscribed ? 'Đã đăng ký ✓' : 'Đăng ký'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="channel-tabs-bar">
        <div
          className={`channel-tab-item ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Video
        </div>
        <div
          className={`channel-tab-item ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          Giới thiệu
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'videos' ? (
        <VideoGrid videos={channelData.videos} onSelectVideo={onSelectVideo} />
      ) : (
        <div className="channel-about-section">
          <h3>Mô tả</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{channelData.description || 'Chưa có mô tả chi tiết cho kênh này.'}</p>
        </div>
      )}
    </div>
  );
}
