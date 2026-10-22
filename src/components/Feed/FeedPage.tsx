import { useState, useEffect } from 'preact/hooks';
import type { VideoItem } from '../../types';
import { fetchFeed } from '../../services/api';
import { FilterChips } from './FilterChips';
import { VideoGrid } from './VideoGrid';
import { ContinuationItem } from '../Common/ContinuationItem';

interface FeedPageProps {
  onSelectVideo: (videoId: string, title?: string, author?: string, thumbnail?: string) => void;
}

const CATEGORIES = [
  'Tất cả',
  'Thịnh hành',
  'MrBeast',
  'Âm nhạc',
  'Trò chơi',
  'Tin tức',
  'Hoạt hình',
  'Lập trình',
  'Bóng đá',
  'Nấu ăn',
  'Lofi Beats',
  'Khoa học'
];

export function FeedPage({ onSelectVideo }: FeedPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setHasMore(true);

    const queryCategory = selectedCategory === 'Tất cả' ? undefined : selectedCategory;
    fetchFeed(queryCategory)
      .then((items) => {
        if (!cancelled) {
          setVideos(items);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load feed:', err);
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const handleLoadMore = async () => {
    try {
      const queryCategory = selectedCategory === 'Tất cả' ? undefined : selectedCategory;
      const additional = await fetchFeed(queryCategory);
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
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Load more error:', err);
      setHasMore(false);
    }
  };

  return (
    <div className="feed-page">
      <FilterChips
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <VideoGrid videos={videos} loading={loading} onSelectVideo={onSelectVideo} />
      {!loading && (
        <ContinuationItem
          token={hasMore ? 'feed-next' : null}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loadingText="Đang tải thêm video..."
        />
      )}
    </div>
  );
}
