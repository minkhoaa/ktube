import { useState, useEffect, useRef } from 'preact/hooks';
import { fetchSuggestions } from '../../services/api';
import { addSearchQuery, removeSearchQuery, clearSearchHistory } from '../../services/libraryStore';
import { getPersonalizedSuggestions, type SearchSuggestionItem } from '../../services/searchIntelligence';
import './SearchBox.css';

interface SearchBoxProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export function SearchBox({ initialQuery = '', onSearch }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<SearchSuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  const lastQueryRef = useRef(query);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const refreshEmptySuggestions = () => {
    const local = getPersonalizedSuggestions('');
    setItems(local);
    setIsOpen(local.length > 0);
    setSelectedIndex(-1);
  };

  // Fetch suggestions with debounce and race condition prevention
  useEffect(() => {
    lastQueryRef.current = query;
    clearTimeout(debounceTimerRef.current);

    if (!query.trim()) {
      return;
    }

    const currentReq = query.trim();
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const local = getPersonalizedSuggestions(currentReq);
        const apiSuggestions = await fetchSuggestions(currentReq);

        if (lastQueryRef.current === query) {
          const combined: SearchSuggestionItem[] = [...local];
          const seen = new Set(local.map((l) => l.text.toLowerCase()));

          for (const s of apiSuggestions) {
            if (!seen.has(s.toLowerCase())) {
              seen.add(s.toLowerCase());
              combined.push({ text: s, type: 'suggestion' });
            }
          }

          setItems(combined.slice(0, 10));
          setIsOpen(combined.length > 0);
          setSelectedIndex(-1);
        }
      } catch {
        if (lastQueryRef.current === query) {
          const localOnly = getPersonalizedSuggestions(currentReq);
          setItems(localOnly);
          setIsOpen(localOnly.length > 0);
        }
      }
    }, 150);

    return () => clearTimeout(debounceTimerRef.current);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: Event) => {
    if (e) e.preventDefault();
    const finalQuery = selectedIndex >= 0 && items[selectedIndex]
      ? items[selectedIndex].text
      : query;

    const trimmed = finalQuery.trim();
    if (trimmed) {
      addSearchQuery(trimmed);
      setIsOpen(false);
      onSearch(trimmed);
    }
  };

  const handleSelect = (text: string) => {
    const trimmed = text.trim();
    if (trimmed) {
      setQuery(trimmed);
      addSearchQuery(trimmed);
      setIsOpen(false);
      onSearch(trimmed);
    }
  };

  const handleRemoveHistory = (e: MouseEvent, text: string) => {
    e.stopPropagation();
    e.preventDefault();
    removeSearchQuery(text);
    if (!query.trim()) {
      refreshEmptySuggestions();
    } else {
      setItems((prev) => prev.filter((item) => item.text !== text));
    }
  };

  const handleClearAllHistory = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    clearSearchHistory();
    setItems([]);
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn chưa hỗ trợ tìm kiếm bằng giọng nói.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const speechResult = event.results?.[0]?.[0]?.transcript;
      if (speechResult) {
        setQuery(speechResult);
        addSearchQuery(speechResult);
        onSearch(speechResult);
      }
    };

    recognition.start();
  };

  const hasHistoryInList = items.some((i) => i.type === 'history');

  return (
    <div className="search-box-container" ref={containerRef}>
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm..."
            value={selectedIndex >= 0 && items[selectedIndex] ? items[selectedIndex].text : query}
            onInput={(e: any) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              if (!query.trim()) {
                refreshEmptySuggestions();
              } else if (items.length > 0) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setQuery('');
                refreshEmptySuggestions();
              }}
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="search-submit-btn" title="Tìm kiếm">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </button>
      </form>

      <button
        type="button"
        className={`voice-search-btn ${isListening ? 'listening' : ''}`}
        onClick={startVoiceSearch}
        title="Tìm kiếm bằng giọng nói"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </button>

      {isOpen && items.length > 0 && (
        <ul className="suggestions-dropdown">
          {items.map((item, idx) => (
            <li
              key={idx}
              className={`suggestion-item ${item.type} ${idx === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(item.text)}
            >
              {item.type === 'history' ? (
                <svg className="suggestion-icon history-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                </svg>
              ) : item.type === 'personalized' ? (
                <svg className="suggestion-icon personalized-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="m12 8.5 1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5 1.5-3.5m0-6.5L9.5 7.5 4 10l5.5 2.5L12 18l2.5-5.5L20 10l-5.5-2.5L12 2z" />
                </svg>
              ) : (
                <svg className="suggestion-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              )}
              <span className="suggestion-text">{item.text}</span>
              {item.type === 'personalized' && (
                <span className="suggestion-badge">Dành cho bạn</span>
              )}
              {item.type === 'history' && (
                <button
                  type="button"
                  className="remove-history-btn"
                  title="Xóa khỏi lịch sử"
                  onClick={(e) => handleRemoveHistory(e, item.text)}
                >
                  ✕
                </button>
              )}
            </li>
          ))}
          {!query.trim() && hasHistoryInList && (
            <li className="clear-history-footer" onClick={handleClearAllHistory}>
              <span>Xóa toàn bộ lịch sử tìm kiếm</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

