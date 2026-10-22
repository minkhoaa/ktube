import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  activeItem?: string;
  onNavigateHome: () => void;
  onSelectTopic?: (topic: string) => void;
}

export function Sidebar({ isOpen, activeItem = 'home', onNavigateHome, onSelectTopic }: SidebarProps) {
  if (!isOpen) {
    return (
      <aside className="sidebar-mini">
        <div
          className={`mini-item ${activeItem === 'home' ? 'active' : ''}`}
          onClick={onNavigateHome}
          title="Trang chủ"
        >
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span>Trang chủ</span>
        </div>

        <div className="mini-item" onClick={() => onSelectTopic?.('Shorts')} title="Shorts">
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25zM10 14.5v-5l4.5 2.5-4.5 2.5z" />
          </svg>
          <span>Shorts</span>
        </div>

        <div className="mini-item" title="Kênh đăng ký">
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.7 8.7H5.3V7h13.4v1.7zm-1.7-5H7v1.7h10V3.7zm3.3 8.3v10c0 .9-.8 1.7-1.7 1.7H5.3c-.9 0-1.7-.8-1.7-1.7V12c0-.9.8-1.7 1.7-1.7h13.4c.9 0 1.6.8 1.6 1.7zm-6.7 5.5l-4.5-2.5v5l4.5-2.5z" />
          </svg>
          <span>Đăng ký</span>
        </div>

        <div className="mini-item" title="Bạn">
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
          <span>Bạn</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar-full">
      <div className="sidebar-section">
        <div
          className={`sidebar-item ${activeItem === 'home' ? 'active' : ''}`}
          onClick={onNavigateHome}
        >
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <span>Trang chủ</span>
        </div>

        <div className="sidebar-item" onClick={() => onSelectTopic?.('Shorts')}>
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25zM10 14.5v-5l4.5 2.5-4.5 2.5z" />
          </svg>
          <span>Shorts</span>
        </div>

        <div className="sidebar-item">
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.7 8.7H5.3V7h13.4v1.7zm-1.7-5H7v1.7h10V3.7zm3.3 8.3v10c0 .9-.8 1.7-1.7 1.7H5.3c-.9 0-1.7-.8-1.7-1.7V12c0-.9.8-1.7 1.7-1.7h13.4c.9 0 1.6.8 1.6 1.7zm-6.7 5.5l-4.5-2.5v5l4.5-2.5z" />
          </svg>
          <span>Kênh đăng ký</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <span className="sidebar-section-title">Bạn &gt;</span>
        <div className="sidebar-item">
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
          <span>Video đã xem</span>
        </div>
        <div className="sidebar-item">
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
          <span>Video của bạn</span>
        </div>
        <div className="sidebar-item">
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
          </svg>
          <span>Video đã thích</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <span className="sidebar-section-title">Khám phá</span>
        <div className="sidebar-item" onClick={() => onSelectTopic?.('Thịnh hành')}>
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.53 11.2c-.23-.3-.49-.57-.75-.82-.72-.68-1.55-1.15-2.43-1.46.25 1.1-.11 2.22-.84 3.01-.73.79-1.84 1.18-2.91 1.04.42-1.27.06-2.73-.89-3.69-.95-.96-2.41-1.33-3.68-.9.13-1.07.72-2.04 1.58-2.67-1.44.23-2.71 1.05-3.48 2.26-.78 1.21-.92 2.7-.39 4.02.53 1.32 1.68 2.29 3.09 2.61.27.06.55.09.83.09 1.95 0 3.73-1.13 4.54-2.88.22-.48.33-.99.33-1.51zm2.39-1.74c-.04-.15-.12-.29-.23-.39-1.37-1.31-2.98-2.27-4.73-2.83.47-1.01.62-2.14.41-3.24-.05-.28-.27-.49-.55-.52-.28-.03-.55.12-.67.37-1.03 2.15-2.88 3.79-5.11 4.51-.25.08-.43.29-.46.55-.03.26.09.51.31.66 1.48 1.03 2.37 2.71 2.37 4.5 0 2.28-1.46 4.31-3.6 5.01-.27.09-.46.33-.46.61 0 .28.18.52.45.62 1.09.39 2.24.59 3.4.59 4.96 0 9-4.04 9-9 0-2.31-.89-4.49-2.28-6.18z" />
          </svg>
          <span>Thịnh hành</span>
        </div>
        <div className="sidebar-item" onClick={() => onSelectTopic?.('Âm nhạc')}>
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          <span>Âm nhạc</span>
        </div>
        <div className="sidebar-item" onClick={() => onSelectTopic?.('Trò chơi')}>
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
          </svg>
          <span>Trò chơi</span>
        </div>
        <div className="sidebar-item" onClick={() => onSelectTopic?.('Tin tức')}>
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" />
          </svg>
          <span>Tin tức</span>
        </div>
        <div className="sidebar-item" onClick={() => onSelectTopic?.('Thể thao')}>
          <svg className="sidebar-item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          <span>Thể thao</span>
        </div>
      </div>
    </aside>
  );
}
