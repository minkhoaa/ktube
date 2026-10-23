import { useState, useEffect, useRef } from 'preact/hooks';
import Hls from 'hls.js';
import { getResumeTime } from '../services/libraryStore';

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
        capLevelToPlayerSize: false, // Do not downscale based on player DOM size
        testBandwidth: false, // Do not load lowest level (240p) to test bandwidth
        abrEwmaDefaultEstimate: 5000000, // 5 Mbps initial bandwidth estimate to start at HD
        startFragPrefetch: true, // Prefetch fragment 0 in parallel while playlists are being parsed
        maxBufferLength: 15, // Buffer 15s (fast start without network flooding)
        maxMaxBufferLength: 30,
        enableWorker: true,
        lowLatencyMode: true
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

        // Quality selection: respect user preference or start directly at crisp HD (1080p / 720p)
        try {
          const pref = localStorage.getItem('puretube_preferred_quality');
          if (pref && pref !== 'auto') {
            const targetHeight = parseInt(pref, 10);
            const foundIdx = data.levels.findIndex(l => l.height === targetHeight);
            if (foundIdx !== -1) {
              hls.currentLevel = foundIdx;
              setCurrentLevel(foundIdx);
            }
          } else {
            // Auto mode: start initial chunk at 720p (or 1080p) for instantaneous <200ms first-frame decode
            const idx720 = data.levels.findIndex(l => l.height === 720);
            const idx1080 = data.levels.findIndex(l => l.height === 1080);
            const initialFastHd = idx720 !== -1 ? idx720 : (idx1080 !== -1 ? idx1080 : -1);
            if (initialFastHd !== -1) {
              hls.nextLoadLevel = initialFastHd;
            }
            setCurrentLevel(-1);
          }
        } catch {
          setCurrentLevel(-1);
        }

        // Ensure audio is ALWAYS UNMUTED by default
        video.muted = false;

        // Resume playback if user watched this video previously (Review Focus 2)
        try {
          const resumeTime = getResumeTime(videoId);
          if (resumeTime > 5) {
            const applyResume = () => {
              if (video.currentTime < resumeTime) {
                video.currentTime = resumeTime;
              }
            };
            if (video.readyState >= 1) {
              applyResume();
            } else {
              video.addEventListener('loadedmetadata', applyResume, { once: true });
            }
          }
        } catch (e) {
          console.warn('[Hls] Failed to resume playback:', e);
        }

        // Attempt autoplay with full sound
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[Hls] Browser policy requires user gesture for unmuted playback:', err);
            // Never force muted playback - audio is ON by default.
            // If browser blocks unmuted autoplay on a fresh reload, pause and display center play button
            video.pause();
          });
        }
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

        // Auto select Vietnamese audio track if available, or force track 0
        const viIdx = tracks.findIndex(t => t.isVietnamese);
        if (viIdx !== -1) {
          setHasVietnameseDub(true);
          hls.audioTrack = viIdx;
          setCurrentAudioTrack(viIdx);
        } else {
          setHasVietnameseDub(false);
          const defaultTrack = hls.audioTrack >= 0 ? hls.audioTrack : 0;
          hls.audioTrack = defaultTrack;
          setCurrentAudioTrack(defaultTrack);
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
      try {
        localStorage.setItem('puretube_preferred_quality', 'auto');
      } catch {}
    } else {
      hlsRef.current.currentLevel = levelId;
      setCurrentLevel(levelId);
      try {
        const selected = levels.find(l => l.id === levelId);
        if (selected && selected.height) {
          localStorage.setItem('puretube_preferred_quality', `${selected.height}p`);
        }
      } catch {}
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
