import { useState, useEffect } from 'preact/hooks';
import type { VideoItem } from '../../types';
import { VideoGrid } from '../Feed/VideoGrid';
import { isSubscribed, toggleSubscription, subscribeLibrary } from '../../services/libraryStore';
import { fetchChannelSearch } from '../../services/api';
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

  // In-channel search state
  const [inChannelQuery, setInChannelQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [channelSearchResults, setChannelSearchResults] = useState<VideoItem[] | null>(null);

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

  const handleChannelSearch = async (e: Event) => {
    e.preventDefault();
    const q = inChannelQuery.trim();
    if (!q || !channelId) return;

    setIsSearching(true);
    setActiveTab('videos');
    try {
      const results = await fetchChannelSearch(channelId, q);
      setChannelSearchResults(results);
    } catch (err) {
      console.error('Channel search failed:', err);
      setChannelSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearChannelSearch = () => {
    setInChannelQuery('');
    setChannelSearchResults(null);
    setIsSearchOpen(false);
  };

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

      {/* Tabs Bar with Search */}
      <div className="channel-tabs-bar">
        <div className="channel-tabs-left">
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

        {/* In-channel Search Controls */}
        <div className="channel-search-wrapper">
          {isSearchOpen ? (
            <form className="channel-search-form" onSubmit={handleChannelSearch}>
              <input
                type="text"
                className="channel-search-input"
                placeholder="Tìm trong kênh này..."
                value={inChannelQuery}
                onInput={(e: any) => setInChannelQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="channel-search-submit" title="Tìm kiếm">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              </button>
              <button
                type="button"
                className="channel-search-close"
                onClick={handleClearChannelSearch}
                title="Đóng"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="channel-search-trigger"
              onClick={() => setIsSearchOpen(true)}
              title="Tìm kiếm trong kênh này"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <span>Tìm kiếm</span>
            </button>
          )}
        </div>
      </div>

      {/* In-channel search banner */}
      {channelSearchResults !== null && activeTab === 'videos' && (
        <div className="channel-search-banner">
          <span>
            Kết quả tìm kiếm cho: "<strong>{inChannelQuery}</strong>" ({channelSearchResults.length} video)
          </span>
          <button
            type="button"
            className="channel-search-banner-clear"
            onClick={handleClearChannelSearch}
          >
            ✕ Quay lại tất cả video
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'videos' ? (
        isSearching ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--yt-text-secondary, #aaa)' }}>
            <p>Đang tìm kiếm video trong kênh...</p>
          </div>
        ) : channelSearchResults !== null ? (
          channelSearchResults.length > 0 ? (
            <VideoGrid videos={channelSearchResults} onSelectVideo={onSelectVideo} />
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--yt-text-secondary, #aaa)' }}>
              <p>Không tìm thấy video nào khớp với từ khóa "{inChannelQuery}" trong kênh này.</p>
              <button
                type="button"
                className="channel-search-banner-clear"
                onClick={handleClearChannelSearch}
                style={{ marginTop: '12px' }}
              >
                Quay lại tất cả video
              </button>
            </div>
          )
        ) : (
          <VideoGrid videos={channelData.videos} onSelectVideo={onSelectVideo} />
        )
      ) : (
        <div className="channel-about-section">
          <h3>Mô tả</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{channelData.description || 'Chưa có mô tả chi tiết cho kênh này.'}</p>
        </div>
      )}
    </div>
  );
}
