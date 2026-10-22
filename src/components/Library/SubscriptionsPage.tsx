import { useState, useEffect } from 'preact/hooks';
import { getLibraryData, subscribeLibrary, toggleSubscription } from '../../services/libraryStore';

interface SubscriptionsPageProps {
  onSelectChannel?: (channelId: string) => void;
  onSelectVideo: (videoId: string, title?: string, author?: string, thumbnail?: string) => void;
}

export function SubscriptionsPage({ onSelectChannel }: SubscriptionsPageProps) {
  const [data, setData] = useState(getLibraryData());

  useEffect(() => {
    return subscribeLibrary((newData) => {
      setData({ ...newData });
    });
  }, []);

  const subs = data.subscriptions;

  return (
    <div className="subscriptions-page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
          Kênh đăng ký
        </h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--yt-text-secondary, #aaa)' }}>
          Danh sách các kênh YouTube bạn đã theo dõi
        </p>
      </div>

      {subs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--yt-text-secondary, #aaa)' }}>
          <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style={{ opacity: 0.3, marginBottom: '16px' }}>
            <path d="M18.7 8.7H5.3V7h13.4v1.7zm-1.7-5H7v1.7h10V3.7zm3.3 8.3v10c0 .9-.8 1.7-1.7 1.7H5.3c-.9 0-1.7-.8-1.7-1.7V12c0-.9.8-1.7 1.7-1.7h13.4c.9 0 1.6.8 1.6 1.7zm-6.7 5.5l-4.5-2.5v5l4.5-2.5z" />
          </svg>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>Chưa có kênh nào trong danh sách đăng ký</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Bấm nút "Đăng ký" trên trang video hoặc trang kênh để theo dõi các tác giả bạn yêu thích</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {subs.map((ch) => (
            <div
              key={ch.channelId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <img
                src={ch.avatar || 'https://via.placeholder.com/60?text=C'}
                alt={ch.channelName}
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => onSelectChannel?.(ch.channelId)}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{ fontSize: '15px', fontWeight: 500, margin: 0, color: 'var(--text-primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onClick={() => onSelectChannel?.(ch.channelId)}
                >
                  {ch.channelName}
                </h4>
                <button
                  onClick={() => toggleSubscription(ch)}
                  style={{
                    marginTop: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: 'var(--text-primary)',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Đã đăng ký ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
