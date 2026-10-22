import { useState, useRef, useEffect } from 'preact/hooks';
import './Seekbar.css';

interface SeekbarProps {
  videoRef: { current: HTMLVideoElement | null };
  duration: number;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Seekbar({ videoRef, duration }: SeekbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);

  // 60 FPS Direct DOM sync with video currentTime & buffered range
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (isScrubbing || !progressRef.current) return;
      const pct = (video.currentTime / (video.duration || 1)) * 100;
      progressRef.current.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    };

    const onProgress = () => {
      if (!bufferRef.current || !video.duration) return;
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const pct = (bufferedEnd / video.duration) * 100;
        bufferRef.current.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('progress', onProgress);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('progress', onProgress);
    };
  }, [isScrubbing]);

  const calculatePct = (clientX: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return x / rect.width;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = x / rect.width;
    setHoverX(x);
    setHoverTime(pct * (duration || videoRef.current?.duration || 0));

    if (hoverRef.current) {
      hoverRef.current.style.width = `${pct * 100}%`;
    }
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    if (hoverRef.current) hoverRef.current.style.width = '0%';
  };

  const startScrubbing = (clientX: number) => {
    setIsScrubbing(true);
    const pct = calculatePct(clientX);
    const video = videoRef.current;
    const totalDuration = duration || video?.duration || 0;

    if (progressRef.current) {
      progressRef.current.style.width = `${pct * 100}%`;
    }

    if (video && totalDuration > 0) {
      video.currentTime = pct * totalDuration;
    }

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const movePct = calculatePct(currentX);
      if (progressRef.current) {
        progressRef.current.style.width = `${movePct * 100}%`;
      }
      if (video && totalDuration > 0) {
        video.currentTime = movePct * totalDuration;
      }
    };

    const onEnd = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  return (
    <div
      ref={containerRef}
      className={`seekbar-container ${isScrubbing ? 'scrubbing' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={(e) => startScrubbing(e.clientX)}
      onTouchStart={(e) => startScrubbing(e.touches[0].clientX)}
    >
      <div className="seekbar-track-bg">
        <div ref={bufferRef} className="seekbar-buffer" />
        <div ref={hoverRef} className="seekbar-hover-preview" />
        <div ref={progressRef} className="seekbar-progress">
          <div className="seekbar-thumb" />
        </div>
      </div>

      {hoverTime !== null && (
        <div className="seekbar-tooltip" style={{ left: `${hoverX}px` }}>
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
}
