import { Play, Pause, RotateCcw } from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  displayTime: number;
  audioDuration: number;
  formatTime: (s: number) => string;
  onTogglePlay: () => void;
  onRestart: () => void;
}

export function PlaybackControls({
  isPlaying,
  isLoading,
  displayTime,
  audioDuration,
  formatTime,
  onTogglePlay,
  onRestart,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onTogglePlay}
          disabled={isLoading}
          className="w-14 h-14 rounded-full bg-[color:var(--color-primary)] flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPlaying ? (
            <Pause className="text-white w-6 h-6" />
          ) : (
            <Play className="text-white w-6 h-6 ml-0.5" />
          )}
        </button>

        <button
          onClick={onRestart}
          className="w-10 h-10 rounded-full border border-[color:var(--color-border)] hover:border-[color:var(--color-primary)] flex items-center justify-center transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="font-mono text-sm text-[color:var(--color-text-muted)]">
        {formatTime(displayTime)} / {formatTime(audioDuration)}
      </div>
    </div>
  );
}