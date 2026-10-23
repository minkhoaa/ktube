import { useState, useEffect, useRef } from 'preact/hooks';

export interface CaptionLanguage {
  code: string;
  name: string;
}

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
}

export function useCaptions(videoRef: { current: HTMLVideoElement | null }, videoId: string) {
  const [availableLanguages, setAvailableLanguages] = useState<CaptionLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [cues, setCues] = useState<CaptionCue[]>([]);
  const [currentCueText, setCurrentCueText] = useState<string>('');

  // Fetch available caption tracks when videoId changes
  useEffect(() => {
    let cancelled = false;
    setAvailableLanguages([]);
    setSelectedLanguage(null);
    setCues([]);
    setCurrentCueText('');

    if (!videoId) return;

    fetch(`/api/captions?v=${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.availableLanguages) {
          setAvailableLanguages(data.availableLanguages);
        }
      })
      .catch((err) => {
        console.error('Failed to load captions:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // Load cues whenever selectedLanguage changes
  useEffect(() => {
    let cancelled = false;
    if (!videoId || !selectedLanguage) {
      setCues([]);
      setCurrentCueText('');
      return;
    }

    fetch(`/api/captions?v=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(selectedLanguage)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.cues) {
          setCues(data.cues);
        }
      })
      .catch((err) => {
        console.error('Failed to load language cues:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [videoId, selectedLanguage]);

  // Sync cue text with video current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedLanguage || cues.length === 0) {
      setCurrentCueText('');
      return;
    }

    const onTimeUpdate = () => {
      const time = video.currentTime;
      const matchingCue = cues.find((c) => time >= c.start && time <= c.end);
      setCurrentCueText(matchingCue ? matchingCue.text : '');
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [cues, selectedLanguage]);

  const toggleCaptions = () => {
    if (selectedLanguage) {
      setSelectedLanguage(null);
      setCurrentCueText('');
    } else if (availableLanguages.length > 0) {
      const vi = availableLanguages.find(l => l.code.toLowerCase().startsWith('vi'));
      setSelectedLanguage(vi ? vi.code : availableLanguages[0].code);
    }
  };

  const setLanguage = (langCode: string | null) => {
    setSelectedLanguage(langCode);
    if (!langCode) {
      setCues([]);
      setCurrentCueText('');
    }
  };

  return {
    availableLanguages,
    selectedLanguage,
    currentCueText,
    hasCaptions: availableLanguages.length > 0,
    toggleCaptions,
    setLanguage
  };
}
