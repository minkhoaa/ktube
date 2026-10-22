import { useState, useEffect } from 'preact/hooks';
import type { VideoInfo } from '../../types';
import { isVideoLiked, toggleLikedVideo, isSubscribed, toggleSubscription, subscribeLibrary } from '../../services/libraryStore';
import './VideoMetadata.css';

interface VideoMetadataProps {
  info: VideoInfo;
  onSelectChannel?: (channelId: string) => void;
}

export function VideoMetadata({ info, onSelectChannel }: VideoMetadataProps) {
  const [likes, setLikes] = useState<number>(128000);
  const [isLiked, setIsLiked] = useState<boolean>(isVideoLiked(info.id));
  const [isDisliked, setIsDisliked] = useState<boolean>(false);
  const [isSub, setIsSub] = useState<boolean>(isSubscribed((info as any).channelId || info.author));
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setIsLiked(isVideoLiked(info.id));
    setIsSub(isSubscribed((info as any).channelId || info.author));
    return subscribeLibrary(() => {
      setIsLiked(isVideoLiked(info.id));
      setIsSub(isSubscribed((info as any).channelId || info.author));
    });
  }, [info.id]);

  const handleLike = () => {
    const entry = {
      id: info.id,
      title: info.title,
      author: info.author,
      thumbnail: info.thumbnails?.[0]?.url || '',
      duration: '',
      progressPercent: 0,
      currentTime: 0,
      durationSeconds: 0,
      watchedAt: Date.now()
    };
    const nowLiked = toggleLikedVideo(entry);
    setIsLiked(nowLiked);
    if (nowLiked) {
      setLikes(prev => prev + 1);
      setIsDisliked(false);
    } else {
      setLikes(prev => prev - 1);
    }
  };

  const handleDislike = () => {
    if (isDisliked) {
      setIsDisliked(false);
    } else {
      setIsDisliked(true);
      if (isLiked) {
        handleLike();
      }
    }
  };

  const handleToggleSub = () => {
    const chId = (info as any).channelId || info.author;
    toggleSubscription({
      channelId: chId,
      channelName: info.author,
      avatar: info.thumbnails?.[0]?.url || '',
      subscribedAt: Date.now()
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const formatLikes = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}Tr`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}N`;
    return num.toString();
  };

  const avatarUrl = info.thumbnails?.[0]?.url || '';

  return (
    <div className="video-metadata-container">
      <h1 className="video-detail-title">{info.title}</h1>

      <div className="video-actions-bar">
        {/* Channel info */}
        <div className="channel-profile-left">
          <div
            onClick={() => onSelectChannel?.((info as any).channelId || info.author)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            {avatarUrl ? (
              <img className="channel-detail-avatar" src={avatarUrl} alt={info.author} />
            ) : (
              <div className="channel-detail-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#c00', color: '#fff', fontWeight: 600 }}>
                {(info.author || 'Y').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="channel-name-and-subs">
              <span className="channel-detail-name">{info.author}</span>
              <span className="channel-detail-subs">Trực tiếp từ YouTube</span>
            </div>
          </div>

          <button
            className="subscribe-pill-btn"
            onClick={handleToggleSub}
            style={{
              background: isSub ? 'var(--yt-bg-secondary)' : 'var(--yt-text-primary)',
              color: isSub ? 'var(--yt-text-primary)' : 'var(--yt-text-inverse)'
            }}
          >
            {isSub ? 'Đã đăng ký ✓' : 'Đăng ký'}
          </button>
        </div>

        {/* Action pills */}
        <div className="action-buttons-right">
          <div className="like-dislike-pill">
            <button className="like-btn" onClick={handleLike} style={{ color: isLiked ? 'var(--yt-red)' : 'inherit' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
              <span>{formatLikes(likes)}</span>
            </button>
            <div className="like-divider" />
            <button className="dislike-btn" onClick={handleDislike} style={{ color: isDisliked ? 'var(--yt-red)' : 'inherit' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
              </svg>
            </button>
          </div>

          <button className="action-pill-btn" onClick={handleShare} title="Chia sẻ liên kết">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" />
            </svg>
            <span>Chia sẻ</span>
          </button>

          <button className="action-pill-btn" title="Tải xuống">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
            </svg>
            <span>Tải xuống</span>
          </button>
        </div>
      </div>

      {showToast && (
        <div className="toast-copied">
          ✓ Đã sao chép liên kết vào bộ nhớ tạm
        </div>
      )}
    </div>
  );
}
