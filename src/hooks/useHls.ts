import { useState, useEffect, useRef } from 'preact/hooks';
import Hls from 'hls.js';

export interface QualityLevel {
  id: number;
  label: string;
  height: number;
  bitrate: number;
}

export interface AudioTrackInfo {
  id: number;
  name: string;
  lang: string;
  isVietnamese: boolean;
}

export function useHls(videoRef: { current: HTMLVideoElement | null }, videoId: string | null) {
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 is Auto
  const [audioTracks, setAudioTracks] = useState<AudioTrackInfo[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(0);
  const [hasVietnameseDub, setHasVietnameseDub] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoId) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setError(null);
    setIsLoading(true);

    const streamUrl = `/api/stream/master.m3u8?v=${encodeURIComponent(videoId)}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: 0, // Fast start at lightweight chunk
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const parsedLevels: QualityLevel[] = data.levels.map((lvl, index) => ({
          id: index,
          label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
          height: lvl.height,
          bitrate: lvl.bitrate
        }));
        // Sort levels from highest to lowest
        parsedLevels.sort((a, b) => b.height - a.height);
        setLevels(parsedLevels);

        // Attempt autoplay
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        const tracks: AudioTrackInfo[] = data.audioTracks.map((t, idx) => {
          const isVi =
            (t.lang && t.lang.toLowerCase().startsWith('vi')) ||
            (t.name && (t.name.toLowerCase().includes('vietnamese') || t.name.toLowerCase().includes('tiếng việt')));
          return {
            id: idx,
            name: t.name || `Track ${idx + 1}`,
            lang: t.lang || '',
            isVietnamese: !!isVi
          };
        });

        setAudioTracks(tracks);

        // Auto select Vietnamese audio track if available
        const viIdx = tracks.findIndex(t => t.isVietnamese);
        if (viIdx !== -1) {
          setHasVietnameseDub(true);
          hls.audioTrack = viIdx;
          setCurrentAudioTrack(viIdx);
        } else {
          setHasVietnameseDub(false);
          setCurrentAudioTrack(hls.audioTrack);
        }
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => {
        setCurrentAudioTrack(data.id);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (hls.autoLevelEnabled) {
          setCurrentLevel(-1);
        } else {
          setCurrentLevel(data.level);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.warn('[Hls.js Error]', data.type, data.details);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error encountered, recovering...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error encountered, recovering...');
              hls.recoverMediaError();
              break;
            default:
              setError('Không thể phát video này. Nhấp vào đây để thử lại.');
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setError('Không thể phát video này trên trình duyệt của bạn.');
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoId]);

  const setLevel = (levelId: number) => {
    if (!hlsRef.current) return;
    if (levelId === -1) {
      hlsRef.current.currentLevel = -1; // Auto
      setCurrentLevel(-1);
    } else {
      hlsRef.current.currentLevel = levelId;
      setCurrentLevel(levelId);
    }
  };

  const setAudioTrack = (trackId: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.audioTrack = trackId;
    setCurrentAudioTrack(trackId);
  };

  const retry = () => {
    setError(null);
    if (videoRef.current && videoId) {
      const streamUrl = `/api/stream/master.m3u8?v=${encodeURIComponent(videoId)}`;
      if (hlsRef.current) {
        hlsRef.current.loadSource(streamUrl);
        hlsRef.current.startLoad();
      }
    }
  };

  return {
    hls: hlsRef.current,
    levels,
    currentLevel,
    setLevel,
    audioTracks,
    currentAudioTrack,
    setAudioTrack,
    hasVietnameseDub,
    error,
    isLoading,
    retry
  };
}
