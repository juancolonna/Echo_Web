"use client";

import { useRef, useState, useEffect } from "react";

interface ProgressBarProps {
  progress: number;
  audioDuration: number;
  onSeek: (time: number) => void;
  formatTime: (s: number) => string;
}

export function ProgressBar({
  progress,
  audioDuration,
  onSeek,
  formatTime,
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  const audioDurationRef = useRef(audioDuration);
  audioDurationRef.current = audioDuration;
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = barRef.current;
    if (!bar) return;
    setDragging(true);
    const rect = bar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const p = (x / rect.width) * 100;
    setDragProgress(p);
    onSeek((p / 100) * audioDuration);
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const p = (x / rect.width) * 100;
      setDragProgress(p);
      onSeekRef.current((p / 100) * audioDurationRef.current);
    };

    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  const displayProgress = dragging ? dragProgress : progress;
  const displayTime = (displayProgress / 100) * audioDuration;

  return (
    <div
      ref={barRef}
      className="relative h-1.5 bg-gray-200 rounded-full cursor-pointer select-none group"
      onMouseDown={handleMouseDown}
    >
      {/* Filled bar */}
      <div
        className="absolute inset-y-0 left-0 bg-[color:var(--color-primary)] rounded-full"
        style={{
          width: `${displayProgress}%`,
          transition: dragging ? "none" : "width 0.1s ease",
        }}
      />

      {/* Handle */}
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 -translate-x-1/2 
          w-3 h-3 bg-white rounded-full shadow-md
          opacity-0 group-hover:opacity-100 
          ${dragging ? "scale-125 opacity-100" : "scale-100"}
        `}
        style={{
          left: `${displayProgress}%`,
          transition: dragging
            ? "none"
            : "left 0.1s ease, transform 0.2s, opacity 0.2s",
        }}
      />

      {/* Time preview on drag */}
      {dragging && (
        <div
          className="absolute -top-9 -translate-x-1/2 bg-gray-800 text-white px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap pointer-events-none shadow-lg"
          style={{ left: `${dragProgress}%`, transition: "none" }}
        >
          {formatTime(displayTime)}
        </div>
      )}
    </div>
  );
}