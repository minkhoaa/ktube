import type { PlaylistItem } from '../../types';
import './PlaylistCard.css';

interface PlaylistCardProps {
  playlist: PlaylistItem;
  onSelect: (playlist: PlaylistItem) => void;
}

export function PlaylistCard({ playlist, onSelect }: PlaylistCardProps) {
  return (
    <div className="playlist-card" onClick={() => onSelect(playlist)}>
      <div className="playlist-thumb-wrapper">
        <img
          src={playlist.thumbnail || '/placeholder.jpg'}
          alt={playlist.title}
          className="playlist-thumb-img"
          loading="lazy"
        />
        <div className="playlist-badge-overlay">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M22 7H2v2h20V7zm-8 4H2v2h12v-2zm0 4H2v2h12v-2zm4-2v6l5-3-5-3z" />
          </svg>
          <span className="playlist-count-text">{playlist.videoCount}</span>
        </div>
      </div>
      <div className="playlist-info">
        <h3 className="playlist-title" title={playlist.title}>
          {playlist.title}
        </h3>
        <div className="playlist-author">{playlist.author}</div>
        <div className="playlist-action-link">Xem danh sách phát đầy đủ</div>
      </div>
    </div>
  );
}
