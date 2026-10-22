import { useState, useEffect } from 'preact/hooks';
import type { CommentItem } from '../../types';
import { fetchComments } from '../../services/api';
import './CommentsSection.css';

interface CommentsSectionProps {
  videoId: string;
}

export function CommentsSection({ videoId }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState<string>('');
  const [isDisabled, setIsDisabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchComments(videoId)
      .then((data) => {
        if (!cancelled) {
          setComments(data.comments || []);
          setTotal(data.total || '0');
          setIsDisabled(!!data.disabled);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Comments error:', err);
        if (!cancelled) {
          setIsDisabled(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  if (loading) {
    return (
      <div className="comments-section-container">
        <p style={{ color: 'var(--yt-text-secondary)' }}>Đang tải bình luận...</p>
      </div>
    );
  }

  if (isDisabled) {
    return (
      <div className="comments-section-container">
        <div className="comments-disabled-banner">
          🔒 Tính năng bình luận đã bị tắt cho video này.
        </div>
      </div>
    );
  }

  return (
    <div className="comments-section-container">
      <div className="comments-header-row">
        <h2 className="comments-count-title">{total ? `${total} bình luận` : 'Bình luận'}</h2>
      </div>

      <div className="comments-list-wrapper">
        {comments.map((c) => (
          <div key={c.id} className="comment-item-card" style={{ marginBottom: '20px' }}>
            <img
              className="comment-user-avatar"
              src={c.author.avatar || 'https://via.placeholder.com/40?text=U'}
              alt={c.author.name}
              loading="lazy"
            />
            <div className="comment-content-col">
              {c.isPinned && (
                <div className="pinned-badge">
                  <span>📌 Đã ghim bởi tác giả</span>
                </div>
              )}

              <div className="comment-author-row">
                <span className="comment-author-name">{c.author.name}</span>
                <span className="comment-time-label">{c.published}</span>
              </div>

              <p className="comment-text-body">{c.content}</p>

              <div className="comment-actions-row">
                <button className="comment-action-btn" title="Thích">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                  <span>{c.likes || ''}</span>
                </button>

                <button className="comment-action-btn" title="Không thích">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
                  </svg>
                </button>

                <button className="comment-action-btn">
                  Phản hồi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
