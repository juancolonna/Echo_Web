interface VolumeControlProps {
  volume: number;
  onVolumeChange: (v: number) => void;
}

export function VolumeControl({ volume, onVolumeChange }: VolumeControlProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[color:var(--color-text-muted)]">Vol</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[color:var(--color-primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[color:var(--color-primary)] [&::-moz-range-thumb]:border-0"
      />
      <span className="text-xs text-[color:var(--color-text-muted)] w-10 text-right">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
}