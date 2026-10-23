import { useState, useEffect, useRef } from 'preact/hooks';
import './CardActionMenu.css';

interface CardActionMenuProps {
  videoId: string;
  channelName: string;
  onHideVideo: () => void;
  onHideChannel: () => void;
}

export function CardActionMenu({
  videoId,
  channelName,
  onHideVideo,
  onHideChannel
}: CardActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleNotInterested = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onHideVideo();
  };

  const handleDontRecommend = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onHideChannel();
  };

  return (
    <div className="card-action-menu-wrapper" ref={menuRef}>
      <button
        className="card-menu-trigger-btn"
        onClick={toggleMenu}
        title="Tùy chọn khác"
        aria-label="Tùy chọn video"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="card-action-dropdown">
          <button className="card-dropdown-item" onClick={handleNotInterested}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" />
            </svg>
            <span>Không quan tâm</span>
          </button>

          <button className="card-dropdown-item" onClick={handleDontRecommend}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z" />
            </svg>
            <span>Không đề xuất kênh này</span>
          </button>
        </div>
      )}
    </div>
  );
}
