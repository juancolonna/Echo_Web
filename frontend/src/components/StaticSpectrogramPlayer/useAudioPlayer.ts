import { useRef, useState, useEffect, useCallback } from "react";

export interface AudioFilterState {
  enabled: boolean;
  frequency: number; // Hz (20–20000)
}

const DEFAULT_LOWPASS: AudioFilterState = {
  enabled: false,
  frequency: 1000,
};

const DEFAULT_HIGHPASS: AudioFilterState = {
  enabled: false,
  frequency: 200,
};

export function useAudioPlayer(initialDuration: number) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const lowpassRef = useRef<BiquadFilterNode | null>(null);
  const highpassRef = useRef<BiquadFilterNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [audioDuration, setAudioDuration] = useState<number>(initialDuration);
  const [volume, setVolume] = useState(1);
  const [filter, setFilterState] = useState<AudioFilterState>(DEFAULT_LOWPASS);
  const [highpassFilter, setHighpassState] = useState<AudioFilterState>(DEFAULT_HIGHPASS);

  // Refs to track enabled state for graph rebuild (avoids stale closures)
  const lpEnabledRef = useRef(DEFAULT_LOWPASS.enabled);
  const hpEnabledRef = useRef(DEFAULT_HIGHPASS.enabled);

  /**
   * Rebuild the Web Audio graph.
   *
   * The full chain (when both filters enabled):
   *   source -> highpass -> lowpass -> gain -> destination
   *
   * Each filter is independently bypassed when disabled.
   */
  const rebuildGraph = useCallback(() => {
    const ctx = audioContextRef.current;
    const source = sourceRef.current;
    const lp = lowpassRef.current;
    const hp = highpassRef.current;
    const gain = gainRef.current;
    if (!ctx || !source || !lp || !hp || !gain) return;

    // Disconnect everything first
    try { source.disconnect(); } catch {}
    try { hp.disconnect(); } catch {}
    try { lp.disconnect(); } catch {}

    // Build chain: source -> [hp?] -> [lp?] -> gain -> dest
    let prev: AudioNode = source;
    if (hpEnabledRef.current) { prev.connect(hp); prev = hp; }
    if (lpEnabledRef.current) { prev.connect(lp); prev = lp; }
    prev.connect(gain);
  }, []);

  /* Web Audio init */
  const initWebAudio = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaElementSource(audioRef.current);
      const gain = ctx.createGain();

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = filter.frequency;
      lowpass.Q.value = 1;

      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = highpassFilter.frequency;
      highpass.Q.value = 1;

      gain.gain.value = volume;

      audioContextRef.current = ctx;
      sourceRef.current = source;
      gainRef.current = gain;
      lowpassRef.current = lowpass;
      highpassRef.current = highpass;

      // Build initial graph: source → gain (both filters off by default)
      let prev: AudioNode = source;
      if (highpassFilter.enabled) { prev.connect(highpass); prev = highpass; }
      if (filter.enabled) { prev.connect(lowpass); prev = lowpass; }
      prev.connect(gain);
      gain.connect(ctx.destination);
    } catch (error) {
      console.error("Error initializing Web Audio API:", error);
    }
  }, [volume, filter.frequency, filter.enabled, highpassFilter.frequency, highpassFilter.enabled]);

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (gainRef.current) {
      gainRef.current.gain.value = v;
    }
  };

  /* ---- Lowpass filter ---- */
  const setFilter = useCallback(
    (update: Partial<AudioFilterState>) => {
      setFilterState((prev) => {
        const next = { ...prev, ...update };
        const ctx = audioContextRef.current;
        const lp = lowpassRef.current;

        if (ctx && lp) {
          if (update.frequency !== undefined) {
            lp.frequency.setValueAtTime(update.frequency, ctx.currentTime);
          }
        }

        if (update.enabled !== undefined) {
          lpEnabledRef.current = update.enabled;
        }
        return next;
      });

      if (update.enabled !== undefined) {
        setTimeout(() => rebuildGraph(), 0);
      }
    },
    [rebuildGraph]
  );

  /* ---- Highpass filter ---- */
  const setHighpassFilter = useCallback(
    (update: Partial<AudioFilterState>) => {
      setHighpassState((prev) => {
        const next = { ...prev, ...update };
        const ctx = audioContextRef.current;
        const hp = highpassRef.current;

        if (ctx && hp) {
          if (update.frequency !== undefined) {
            hp.frequency.setValueAtTime(update.frequency, ctx.currentTime);
          }
        }

        if (update.enabled !== undefined) {
          hpEnabledRef.current = update.enabled;
        }
        return next;
      });

      if (update.enabled !== undefined) {
        setTimeout(() => rebuildGraph(), 0);
      }
    },
    [rebuildGraph]
  );

  /* Audio listeners */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    const onCanPlay = () => setIsLoading(false);
    const onMeta = () => {
      if (isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("error", onError);
    };
  }, []);

  /* Controls */
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    initWebAudio();

    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
      setIsPlaying(false);
    }
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  };

  return {
    audioRef,
    isPlaying,
    currentTime,
    isLoading,
    audioDuration,
    volume,
    handleVolumeChange,
    togglePlay,
    restart,
    seek,
    filter,
    setFilter,
    highpassFilter,
    setHighpassFilter,
  };
}