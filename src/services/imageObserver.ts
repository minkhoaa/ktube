// Centralized Singleton Image Observer for YouTube-Grade Thumbnail Lazy Loading
export const thumbnailObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const realSrc = img.dataset.src;
            if (realSrc) {
              img.src = realSrc;
              img.classList.add('loaded');
              img.removeAttribute('data-src');
              thumbnailObserver?.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '300px' }
    )
  : null;
