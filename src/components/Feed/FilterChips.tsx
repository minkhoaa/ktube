import { useState, useRef, useEffect } from 'preact/hooks';
import './FilterChips.css';

interface FilterChipsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  dynamicTopics?: string[];
}

export function FilterChips({
  categories,
  selectedCategory,
  onSelectCategory,
  dynamicTopics = []
}: FilterChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Merge static categories with dynamic user interest topics without duplicates
  const allChips = Array.from(new Set([...categories, ...dynamicTopics]));

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [allChips.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.6;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth'
    });
    setTimeout(checkScroll, 250);
  };

  return (
    <div className="chips-container-outer">
      {canScrollLeft && (
        <div className="chips-nav-wrapper left">
          <button
            className="chips-scroll-btn left"
            onClick={() => handleScroll('left')}
            title="Cuộn sang trái"
          >
            ‹
          </button>
        </div>
      )}

      <div className="chips-bar-wrapper" ref={scrollRef} onScroll={checkScroll}>
        {allChips.map((cat) => (
          <button
            key={cat}
            className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {canScrollRight && (
        <div className="chips-nav-wrapper right">
          <button
            className="chips-scroll-btn right"
            onClick={() => handleScroll('right')}
            title="Cuộn sang phải"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
