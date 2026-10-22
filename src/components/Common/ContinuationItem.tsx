import { useEffect, useRef, useState } from 'preact/hooks';

interface ContinuationItemProps {
  token: string | null;
  onLoadMore: (token: string) => Promise<void>;
  hasMore?: boolean;
  loadingText?: string;
}

export function ContinuationItem({
  token,
  onLoadMore,
  hasMore = true,
  loadingText = 'Đang tải thêm nội dung...'
}: ContinuationItemProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadingLock = useRef(false);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el || !token || !hasMore || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting && !loadingLock.current && token) {
          loadingLock.current = true;
          setIsLoading(true);

          onLoadMore(token)
            .catch((err) => console.error('Continuation error:', err))
            .finally(() => {
              loadingLock.current = false;
              setIsLoading(false);
            });
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [token, hasMore, onLoadMore]);

  if (!token || !hasMore) {
    return null;
  }

  return (
    <div
      ref={triggerRef}
      className="continuation-trigger-slot"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        width: '100%',
        color: 'var(--yt-text-secondary, #aaa)',
        fontSize: '14px',
        gap: '12px'
      }}
    >
      <div
        className="continuation-spinner"
        style={{
          width: '24px',
          height: '24px',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'var(--yt-brand, #ff0000)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      <span>{loadingText}</span>
    </div>
  );
}
