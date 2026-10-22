import { useState, useEffect } from 'preact/hooks';
import { getLibraryData, subscribeLibrary, clearHistory, type HistoryEntry } from '../../services/libraryStore';

interface HistoryPageProps {
  onSelectVideo: (videoId: string, title?: string, author?: string, thumbnail?: string) => void;
}

export function HistoryPage({ onSelectVideo }: HistoryPageProps) {
  const [data, setData] = useState(getLibraryData());

  useEffect(() => {
    return subscribeLibrary((newData) => {
      setData({ ...newData });
    });
  }, []);

  const historyList = data.history;

  return (
    <div className="history-page-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Video đã xem
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--yt-text-secondary, #aaa)' }}>
            Lịch sử xem được lưu an toàn trực tiếp trên trình duyệt của bạn
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              borderRadius: '18px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'background 0.2s ease'
            }}
          >
            Xóa tất cả nhật ký xem
          </button>
        )}
      </div>

      {historyList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--yt-text-secondary, #aaa)' }}>
          <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" style={{ opacity: 0.3, marginBottom: '16px' }}>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" />
          </svg>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>Chưa có video nào trong nhật ký xem</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Các video bạn xem sẽ hiển thị tại đây kèm mốc thời gian xem dở</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {historyList.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectVideo(item.id, item.title, item.author, item.thumbnail)}
              style={{
                display: 'flex',
                gap: '16px',
                cursor: 'pointer',
                borderRadius: '12px',
                padding: '8px',
                transition: 'background 0.15s ease'
              }}
            >
              {/* Thumbnail with red progress bar */}
              <div style={{ position: 'relative', width: '220px', minWidth: '220px', aspectRatio: '16 / 9', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                <img
                  src={item.thumbnail || 'https://via.placeholder.com/320x180?text=Video'}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {item.duration && (
                  <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '12px', padding: '1px 4px', borderRadius: '4px' }}>
                    {item.duration}
                  </span>
                )}
                {/* Red progress bar */}
                {item.progressPercent > 0 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255, 255, 255, 0.2)' }}>
                    <div style={{ width: `${item.progressPercent}%`, height: '100%', background: 'var(--yt-brand, #f00)' }} />
                  </div>
                )}
              </div>

              {/* Meta details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 500, margin: 0, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.title}
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--yt-text-secondary, #aaa)' }}>
                  {item.author}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--yt-text-secondary, #888)' }}>
                  {item.progressPercent > 0 && item.progressPercent < 100
                    ? `Đã xem ${item.progressPercent}%`
                    : item.progressPercent >= 100
                    ? 'Đã xem hết'
                    : 'Mới bắt đầu xem'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
