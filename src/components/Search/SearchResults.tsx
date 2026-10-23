import { useState, useEffect, useRef } from 'preact/hooks';
import type { VideoItem, ChannelItem, PlaylistItem, SearchFilters } from '../../types';
import { fetchSearch } from '../../services/api';
import { setAppState } from '../../services/store';
import { getSynonymExpansions } from '../../services/searchIntelligence';
import { FilterDrawer } from './FilterDrawer';
import { ChannelCard } from './ChannelCard';
import { PlaylistCard } from './PlaylistCard';
import './SearchResults.css';

interface SearchResultsProps {
  query: string;
  onSelectVideo: (videoId: string) => void;
}

const prefetchedIds = new Set<string>();

function prefetchVideo(id: string) {
  if (!id || prefetchedIds.has(id)) return;
  prefetchedIds.add(id);
  fetch(`/api/info?v=${encodeURIComponent(id)}`, { priority: 'low' } as any).catch(() => {});
  fetch(`/api/stream/master.m3u8?v=${encodeURIComponent(id)}`, { priority: 'low' } as any).catch(() => {});
}

export function SearchResults({ query, onSelectVideo }: SearchResultsProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [refinements, setRefinements] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasContinuation, setHasContinuation] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchSearch(query, filters)
      .then((data) => {
        if (!cancelled) {
          setVideos(data.videos);
          setChannels(data.channels);
          setPlaylists(data.playlists || []);
          setCorrectedQuery(data.correctedQuery || null);
          setRefinements(data.refinements || []);
          setHasContinuation(!!data.hasContinuation);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, filters]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!sentinelRef.current || !hasContinuation || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasContinuation) {
          setLoadingMore(true);
          // Fetch more (continuation)
          fetchSearch(`${query} page 2`, filters)
            .then((data) => {
              setVideos((prev) => [...prev, ...data.videos]);
              setHasContinuation(false); // Stop after 2 batches to avoid quota drain
              setLoadingMore(false);
            })
            .catch(() => setLoadingMore(false));
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasContinuation, loadingMore, query, filters]);

  const handleCorrectedSearch = (newQuery: string) => {
    setAppState({ searchQuery: newQuery, view: 'search' });
  };

  const synonymList = getSynonymExpansions(query);
  const allRefinements = Array.from(new Set([...refinements, ...synonymList])).slice(0, 8);

  return (
    <div className="search-results-container">
      <FilterDrawer filters={filters} onFilterChange={setFilters} />

      {/* Typo Correction Banner (P2) */}
      {correctedQuery && (
        <div className="typo-banner">
          <span>Có phải bạn muốn tìm: </span>
          <button
            type="button"
            className="typo-link"
            onClick={() => handleCorrectedSearch(correctedQuery)}
          >
            {correctedQuery}
          </button>
        </div>
      )}

      {/* Related queries and synonym suggestions (P1 & P2) */}
      {allRefinements.length > 0 && !loading && (
        <div className="related-queries-shelf">
          <span className="related-queries-title">Tìm kiếm liên quan:</span>
          <div className="related-chips-scroll">
            {allRefinements.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="related-chip"
                onClick={() => handleCorrectedSearch(chip)}
              >
                🔍 {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--yt-text-secondary)' }}>
          <p>Đang tìm kiếm kết quả...</p>
        </div>
      ) : (
        <>
          {/* Channels Section */}
          {channels.length > 0 && (
            <div className="search-channels-section">
              {channels.map((ch) => (
                <ChannelCard key={ch.id} channel={ch} />
              ))}
            </div>
          )}

          {/* Playlists Section (P0) */}
          {playlists.length > 0 && (
            <div className="search-playlists-section">
              {playlists.map((pl) => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onSelect={(p) => onSelectVideo(p.id)}
                />
              ))}
            </div>
          )}

          {videos.length === 0 && channels.length === 0 && playlists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--yt-text-secondary)' }}>
              <p>Không tìm thấy kết quả nào phù hợp.</p>
            </div>
          ) : (
            <div className="search-video-list">
              {videos.map((v) => {
                const isShort = filters.type === 'shorts' || v.title.toLowerCase().includes('#shorts');
                const isLive = v.duration === 'TRỰC TIẾP' || (v as any).badges?.includes('LIVE');
                return (
                  <div
                    key={v.id}
                    className={`search-video-item ${isShort ? 'short-item' : ''}`}
                    onClick={() => onSelectVideo(v.id)}
                    onMouseEnter={() => prefetchVideo(v.id)}
                    onTouchStart={() => prefetchVideo(v.id)}
                  >
                    <div className="search-thumb-wrapper">
                      <img
                        className="search-thumb-img"
                        src={v.thumbnail || 'https://via.placeholder.com/640x360?text=YouTube'}
                        alt={v.title}
                        loading="lazy"
                      />
                      {v.duration && (
                        <span className={`duration-badge ${isLive ? 'live-badge' : ''}`}>
                          {v.duration}
                        </span>
                      )}
                      {isShort && <span className="shorts-badge">⚡ Shorts</span>}
                    </div>

                    <div className="search-video-info">
                      <h3 className="search-video-title" title={v.title}>
                        {v.title}
                      </h3>

                      <div className="search-video-stats">
                        {v.views && <span>{v.views}</span>}
                        {v.views && v.published && <span>•</span>}
                        {v.published && <span>{v.published}</span>}
                      </div>

                      <div className="search-channel-row">
                        {v.authorAvatar && (
                          <img className="search-channel-avatar" src={v.authorAvatar} alt={v.author} />
                        )}
                        <span className="search-channel-name">{v.author}</span>
                      </div>

                      {v.description && (
                        <p className="search-video-desc">{v.description}</p>
                      )}

                      {/* Video badges (HD, CC, Live) */}
                      {Array.isArray((v as any).badges) && (v as any).badges.length > 0 && (
                        <div className="search-video-badges">
                          {(v as any).badges.map((b: string, bIdx: number) => (
                            <span key={bIdx} className={`search-badge ${b.toLowerCase()}`}>
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasContinuation && (
            <div ref={sentinelRef} className="infinite-scroll-loader">
              <span>Đang tải thêm video...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
