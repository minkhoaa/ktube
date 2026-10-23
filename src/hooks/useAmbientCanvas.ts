import { useEffect, useRef } from 'preact/hooks';

export function useAmbientCanvas(
  videoRef: { current: HTMLVideoElement | null },
  canvasRef: { current: HTMLCanvasElement | null },
  isEnabled: boolean
) {
  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || typeof window === 'undefined') return;

    if (!isEnabled) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let timerId: any = null;

    const sampleFrame = () => {
      if (!isEnabledRef.current || video.paused || video.ended || video.readyState < 2 || document.hidden) {
        return;
      }
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch {
        // Ignore potential cross-origin frame sampling errors safely
      }
    };

    const startSampling = () => {
      stopSampling();
      if (!isEnabledRef.current) return;
      sampleFrame();
      timerId = setInterval(sampleFrame, 800); // 800ms throttle for smooth lighting without video frame drops
    };

    const stopSampling = () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    video.addEventListener('play', startSampling);
    video.addEventListener('playing', startSampling);
    video.addEventListener('pause', stopSampling);
    video.addEventListener('ended', stopSampling);

    if (!video.paused) {
      startSampling();
    }

    return () => {
      stopSampling();
      video.removeEventListener('play', startSampling);
      video.removeEventListener('playing', startSampling);
      video.removeEventListener('pause', stopSampling);
      video.removeEventListener('ended', stopSampling);
    };
  }, [isEnabled]);
}
