import { useState, useEffect, useRef } from 'preact/hooks';
import type { VideoItem } from '../../types';
import { fetchFeed, fetchExplore } from '../../services/api';
import { FilterChips } from './FilterChips';
import { VideoGrid } from './VideoGrid';
import { ContinueWatchingShelf } from './ContinueWatchingShelf';
import { ContinuationItem } from '../Common/ContinuationItem';
import { Toast } from '../Common/Toast';
import {
  getLibraryData,
  subscribeLibrary,
  addNotInterestedVideo,
  removeNotInterestedVideo,
  blockChannel,
  unblockChannel
} from '../../services/libraryStore';
import type { HistoryEntry } from '../../services/libraryStore';
import {
  calculateInterestScores,
  interleaveFeed,
  filterBlacklist
} from '../../services/discoveryEngine';

interface FeedPageProps {
  onSelectVideo: (videoId: string, title?: string, author?: string, thumbnail?: string) => void;
  onSelectChannel?: (channelName: string) => void;
}

const CORE_CATEGORIES = [
  'Tất cả',
  'Thịnh hành',
  'Mới tải lên',
  'Phổ biến',
  'Âm nhạc',
  'Trò chơi',
  'Tin tức',
  'Trực tiếp',
  'Hoạt hình',
  'Khoa học',
  'Lập trình'
];

export function FeedPage({ onSelectVideo, onSelectChannel }: FeedPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [dynamicTopics, setDynamicTopics] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<(() => void) | null>(null);

  // Compute dynamic topic chips from watch history
  useEffect(() => {
    const updateTopics = () => {
      const lib = getLibraryData();
      const { topTopics } = calculateInterestScores(lib.history, lib.liked);
      setDynamicTopics(topTopics.filter((t) => !CORE_CATEGORIES.includes(t)));
    };

    updateTopics();
    const unsubscribe = subscribeLibrary(updateTopics);
    return () => unsubscribe();
  }, []);

  // Main feed fetch based on category and sorting
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setHasMore(true);
    setContinuationToken(null);

    const loadFeedData = async () => {
      try {
        const lib = getLibraryData();
        let fetchedVideos: VideoItem[] = [];
        let nextToken: string | null = null;

        if (selectedCategory === 'Tất cả') {
          // Interleaved Discovery Engine: General trending + Personal topic/subscription + Explore serendipity
          const { topTopics, topChannels } = calculateInterestScores(lib.history, lib.liked);
          const trendingRes = await fetchFeed();
          nextToken = trendingRes.continuationToken;

          let personalVideos: VideoItem[] = [];
          if (topTopics.length > 0 || topChannels.length > 0) {
            const query = topTopics[0] || topChannels[0];
            const personalRes = await fetchFeed(query);
            personalVideos = personalRes.results;
          }

          let exploreVideos: VideoItem[] = [];
          try {
            exploreVideos = await fetchExplore('music');
          } catch {
            exploreVideos = [];
          }

          fetchedVideos = interleaveFeed({
            personalVideos,
            trendingVideos: trendingRes.results,
            exploreVideos
          });
        } else if (selectedCategory === 'Mới tải lên') {
          const res = await fetchFeed(undefined, 'upload_date');
          fetchedVideos = res.results;
          nextToken = res.continuationToken;
        } else if (selectedCategory === 'Phổ biến') {
          const res = await fetchFeed(undefined, 'view_count');
          fetchedVideos = res.results;
          nextToken = res.continuationToken;
        } else if (selectedCategory === 'Thịnh hành') {
          const res = await fetchFeed();
          fetchedVideos = res.results;
          nextToken = res.continuationToken;
        } else if (selectedCategory === 'Âm nhạc') {
          fetchedVideos = await fetchExplore('music');
        } else if (selectedCategory === 'Trò chơi') {
          fetchedVideos = await fetchExplore('gaming');
        } else if (selectedCategory === 'Tin tức') {
          fetchedVideos = await fetchExplore('news');
        } else if (selectedCategory === 'Trực tiếp') {
          fetchedVideos = await fetchExplore('live');
        } else {
          // Custom category / dynamic topic chip
          const res = await fetchFeed(selectedCategory);
          fetchedVideos = res.results;
          nextToken = res.continuationToken;
        }

        if (!cancelled) {
          const cleaned = filterBlacklist(fetchedVideos, lib.blacklist);
          setVideos(cleaned);
          setContinuationToken(nextToken);
          setHasMore(nextToken !== null || cleaned.length >= 10);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load feed:', err);
        if (!cancelled) {
          setLoading(false);
          setHasMore(false);
        }
      }
    };

    loadFeedData();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const handleLoadMore = async () => {
    if (!hasMore) return;

    try {
      const lib = getLibraryData();
      let queryCategory: string | undefined = undefined;
      let sortBy: string | undefined = undefined;

      if (selectedCategory === 'Mới tải lên') sortBy = 'upload_date';
      else if (selectedCategory === 'Phổ biến') sortBy = 'view_count';
      else if (selectedCategory !== 'Tất cả' && selectedCategory !== 'Thịnh hành') {
        queryCategory = selectedCategory;
      }

      const res = await fetchFeed(queryCategory, sortBy, continuationToken || undefined);
      const additional = filterBlacklist(res.results || [], lib.blacklist);

      if (additional && additional.length > 0) {
        setVideos((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const uniqueNew = additional.filter((v) => !existingIds.has(v.id));
          if (uniqueNew.length === 0) {
            setHasMore(false);
            return prev;
          }
          return [...prev, ...uniqueNew];
        });
        setContinuationToken(res.continuationToken);
        setHasMore(res.continuationToken !== null);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Load more error:', err);
      setHasMore(false);
    }
  };

  const handleHideVideo = (videoId: string) => {
    addNotInterestedVideo(videoId);
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    setToastMessage('Đã ẩn video khỏi danh sách đề xuất');
    setUndoAction(() => () => {
      removeNotInterestedVideo(videoId);
      setToastMessage('Đã hoàn tác');
    });
  };

  const handleHideChannel = (channelName: string) => {
    blockChannel(channelName);
    const cleanName = channelName.trim().toLowerCase();
    setVideos((prev) => prev.filter((v) => (v.author || '').trim().toLowerCase() !== cleanName));
    setToastMessage(`Đã chặn đề xuất từ kênh "${channelName}"`);
    setUndoAction(() => () => {
      unblockChannel(channelName);
      setToastMessage('Đã hoàn tác chặn kênh');
    });
  };

  const handleResumeVideo = (entry: HistoryEntry) => {
    onSelectVideo(entry.id, entry.title, entry.author, entry.thumbnail);
  };

  const handleUndo = () => {
    if (undoAction) {
      undoAction();
      setUndoAction(null);
    }
  };

  return (
    <div className="feed-page">
      <FilterChips
        categories={CORE_CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        dynamicTopics={dynamicTopics}
      />

      {selectedCategory === 'Tất cả' && !loading && (
        <ContinueWatchingShelf onResumeVideo={handleResumeVideo} />
      )}

      <VideoGrid
        videos={videos}
        loading={loading}
        onSelectVideo={onSelectVideo}
        onSelectChannel={onSelectChannel}
        onHideVideo={handleHideVideo}
        onHideChannel={handleHideChannel}
      />

      {!loading && (
        <ContinuationItem
          token={continuationToken || (hasMore ? 'feed-next' : null)}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loadingText="Đang tải thêm video..."
        />
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          actionLabel={undoAction ? 'Hoàn tác' : undefined}
          onAction={handleUndo}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
