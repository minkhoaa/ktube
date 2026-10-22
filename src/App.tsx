import { useState, useEffect } from 'preact/hooks';
import { Navbar } from './components/Navbar/Navbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { FeedPage } from './components/Feed/FeedPage';
import { SearchResults } from './components/Search/SearchResults';
import { WatchPage } from './components/Watch/WatchPage';
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

  const isWatch = view === 'watch';

  return (
    <div className="app-container">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleSidebar={toggleSidebar}
        onNavigateHome={navigateHome}
        onSearch={navigateSearch}
        initialQuery={searchQuery}
      />

      <div className="main-layout">
        {!isWatch && (
          <Sidebar
            isOpen={isSidebarOpen}
            activeItem={view === 'feed' ? 'home' : ''}
            onNavigateHome={navigateHome}
            onSelectTopic={(topic) => navigateSearch(topic)}
          />
        )}

        <main className={`content-area ${isWatch ? 'watch-mode' : (isSidebarOpen ? 'with-full-sidebar' : 'with-mini-sidebar')}`}>
          {view === 'feed' && <FeedPage onSelectVideo={navigateWatch} />}
          {view === 'search' && <SearchResults query={searchQuery} onSelectVideo={navigateWatch} />}
          {view === 'watch' && currentVideoId && (
            <WatchPage videoId={currentVideoId} onSelectVideo={navigateWatch} />
          )}
        </main>
      </div>
    </div>
  );
}
