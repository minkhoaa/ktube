import { useState, useEffect } from 'preact/hooks';
import './styles/base.css';

export type AppView = 'feed' | 'search' | 'watch';

export function App() {
  const [view, setView] = useState<AppView>('feed');
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Sync theme with DOM attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle URL route synchronization (deep links & back/forward)
  useEffect(() => {
    function parseUrl() {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('v');
      const q = params.get('q');

      if (v) {
        setCurrentVideoId(v);
        setView('watch');
      } else if (q) {
        setSearchQuery(q);
        setView('search');
      } else {
        setView('feed');
        setCurrentVideoId(null);
      }
    }

    parseUrl();
    window.addEventListener('popstate', parseUrl);
    return () => window.removeEventListener('popstate', parseUrl);
  }, []);

  const navigateWatch = (id: string) => {
    window.history.pushState({}, '', `/?v=${encodeURIComponent(id)}`);
    setCurrentVideoId(id);
    setView('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateSearch = (q: string) => {
    window.history.pushState({}, '', `/?q=${encodeURIComponent(q)}`);
    setSearchQuery(q);
    setView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateHome = () => {
    window.history.pushState({}, '', '/');
    setView('feed');
    setCurrentVideoId(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="app-container">
      <header style={{
        height: 'var(--yt-navbar-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--yt-border-color)',
        backgroundColor: 'var(--yt-bg-primary)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100
      }}>
        <button onClick={navigateHome} style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--yt-red)' }}>
          ▶ Pure Tuber
        </button>
      </header>
      <main className="main-layout">
        <div className="content-area">
          <p>YouTube Clone Initialized (View: {view})</p>
        </div>
      </main>
    </div>
  );
}
