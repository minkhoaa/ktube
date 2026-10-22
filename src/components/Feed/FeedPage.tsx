import { useState, useEffect } from 'preact/hooks';
import type { VideoItem } from '../../types';
import { fetchFeed } from '../../services/api';
import { FilterChips } from './FilterChips';
import { VideoGrid } from './VideoGrid';

interface FeedPageProps {
  onSelectVideo: (videoId: string) => void;
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
  'Nấu ăn'
];

export function FeedPage({ onSelectVideo }: FeedPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

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

  return (
    <div className="feed-page">
      <FilterChips
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <VideoGrid videos={videos} loading={loading} onSelectVideo={onSelectVideo} />
    </div>
  );
}
