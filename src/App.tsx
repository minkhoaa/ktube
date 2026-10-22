import { useState, useEffect, useRef } from 'preact/hooks';
import { Navbar } from './components/Navbar/Navbar';
import { Sidebar } from './components/Sidebar/Sidebar';
import { FeedPage } from './components/Feed/FeedPage';
import { SearchResults } from './components/Search/SearchResults';
import { WatchPage } from './components/Watch/WatchPage';
import { PersistentPlayer } from './components/Player/PersistentPlayer';
import { getAppState, subscribeAppState, setView, playVideo, setAppState } from './services/store';
import './styles/base.css';

export function App() {
  const [appState, setAppStateLocal] = useState(getAppState());
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const feedScrollRef = useRef<number>(0);
  const searchScrollRef = useRef<number>(0);

  // Sync theme with DOM attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Subscribe to reactive store
  useEffect(() => {
    return subscribeAppState((newState) => {
      setAppStateLocal({ ...newState });
    });
  }, []);

  // Handle URL route synchronization (deep links & back/forward popstate)
  useEffect(() => {
    function parseUrl() {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('v');
      const q = params.get('q');

      if (v) {
        if (!appState.activeVideo || appState.activeVideo.id !== v) {
          playVideo({ id: v, title: 'Video', author: '', thumbnail: '' });
        } else {
          setView('watch');
        }
      } else if (q) {
        setAppState({ searchQuery: q });
        setView('search');
      } else {
        setView('feed');
      }
    }

    parseUrl();
    window.addEventListener('popstate', parseUrl);
    return () => window.removeEventListener('popstate', parseUrl);
  }, []);

  const navigateWatch = (id: string, title?: string, author?: string, thumbnail?: string) => {
    // Record current scroll position before leaving
    if (appState.view === 'feed') feedScrollRef.current = window.scrollY;
    if (appState.view === 'search') searchScrollRef.current = window.scrollY;

    window.history.pushState({}, '', `/?v=${encodeURIComponent(id)}`);
    playVideo({
      id,
      title: title || 'YouTube Video',
      author: author || '',
      thumbnail: thumbnail || ''
    });

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  };

  const navigateSearch = (q: string) => {
    if (appState.view === 'feed') feedScrollRef.current = window.scrollY;

    window.history.pushState({}, '', `/?q=${encodeURIComponent(q)}`);
    setAppState({ searchQuery: q });
    setView('search');

    requestAnimationFrame(() => {
      window.scrollTo({ top: searchScrollRef.current, behavior: 'instant' });
    });
  };

  const navigateHome = () => {
    if (appState.view === 'search') searchScrollRef.current = window.scrollY;

    window.history.pushState({}, '', '/');
    setView('feed');

    requestAnimationFrame(() => {
      window.scrollTo({ top: feedScrollRef.current, behavior: 'instant' });
    });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const isWatch = appState.view === 'watch';

  return (
    <div className="app-container">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleSidebar={toggleSidebar}
        onNavigateHome={navigateHome}
        onSearch={navigateSearch}
        initialQuery={appState.searchQuery}
      />

      <div className="main-layout">
        {!isWatch && (
          <Sidebar
            isOpen={isSidebarOpen}
            activeItem={appState.view === 'feed' ? 'home' : ''}
            onNavigateHome={navigateHome}
            onSelectTopic={(topic) => navigateSearch(topic)}
          />
        )}

        <main className={`content-area ${isWatch ? 'watch-mode' : (isSidebarOpen ? 'with-full-sidebar' : 'with-mini-sidebar')}`}>
          {/* Keep-Alive Viewport: DOM Recycling of All 3 Pages */}
          <div
            className="keep-alive-page feed-page-slot"
            style={{ display: appState.view === 'feed' ? 'block' : 'none' }}
          >
            <FeedPage onSelectVideo={navigateWatch} />
          </div>

          <div
            className="keep-alive-page search-page-slot"
            style={{ display: appState.view === 'search' ? 'block' : 'none' }}
          >
            <SearchResults
              query={appState.searchQuery}
              onSelectVideo={navigateWatch}
            />
          </div>

          <div
            className="keep-alive-page watch-page-slot"
            style={{ display: appState.view === 'watch' ? 'block' : 'none' }}
          >
            {appState.activeVideo && (
              <WatchPage
                videoId={appState.activeVideo.id}
                onSelectVideo={navigateWatch}
              />
            )}
          </div>
        </main>
      </div>

      {/* Persistent Root Player: Singleton Video Node across entire app */}
      <PersistentPlayer />
    </div>
  );
}
