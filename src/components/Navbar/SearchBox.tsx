import { useState, useEffect, useRef } from 'preact/hooks';
import { fetchSuggestions } from '../../services/api';
import './SearchBox.css';

interface SearchBoxProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export function SearchBox({ initialQuery = '', onSearch }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  const lastQueryRef = useRef(query);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Fetch suggestions with debounce and race condition prevention
  useEffect(() => {
    lastQueryRef.current = query;
    clearTimeout(debounceTimerRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const currentReq = query;
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const items = await fetchSuggestions(currentReq);
        // Only update if user hasn't typed something else in the meantime
        if (lastQueryRef.current === currentReq) {
          setSuggestions(items);
          setIsOpen(items.length > 0);
          setSelectedIndex(-1);
        }
      } catch {
        if (lastQueryRef.current === currentReq) {
          setSuggestions([]);
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
    const finalQuery = selectedIndex >= 0 && suggestions[selectedIndex]
      ? suggestions[selectedIndex]
      : query;
    if (finalQuery.trim()) {
      setIsOpen(false);
      onSearch(finalQuery.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
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
        onSearch(speechResult);
      }
    };

    recognition.start();
  };

  return (
    <div className="search-box-container" ref={containerRef}>
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm..."
            value={selectedIndex >= 0 && suggestions[selectedIndex] ? suggestions[selectedIndex] : query}
            onInput={(e: any) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setIsOpen(false);
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

      {isOpen && suggestions.length > 0 && (
        <ul className="suggestions-dropdown">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              className={`suggestion-item ${idx === selectedIndex ? 'selected' : ''}`}
              onClick={() => {
                setQuery(item);
                setIsOpen(false);
                onSearch(item);
              }}
            >
              <svg className="suggestion-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
