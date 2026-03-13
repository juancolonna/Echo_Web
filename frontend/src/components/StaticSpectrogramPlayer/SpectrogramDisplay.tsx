import { Loader2 } from "lucide-react";
import { RefObject } from "react";
import { SpectrogramTag, DrawingRect } from "./tags.types";
import { TagBoxOverlay } from "./TagBoxOverlay";

interface SpectrogramDisplayProps {
  imageRef: RefObject<HTMLImageElement | null>;
  spectrogramUrl: string;
  imageLoaded: boolean;
  progress: number;
  isDragging: boolean;
  displayTime: number;
  duration: number;
  maxFreqKhz: number;
  dbRange: { min: number; max: number } | null;
  formatTime: (s: number) => string;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  onImageLoad: () => void;
  /* Tag overlay props */
  isTagMode: boolean;
  tags: SpectrogramTag[];
  selectedTagId: string | null;
  onTagClick: (id: string) => void;
  drawingRect: DrawingRect | null;
  drawingColor: string;
}

export function SpectrogramDisplay({
  imageRef,
  spectrogramUrl,
  imageLoaded,
  progress,
  isDragging,
  displayTime,
  duration,
  maxFreqKhz,
  dbRange,
  formatTime,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onImageLoad,
  isTagMode,
  tags,
  selectedTagId,
  onTagClick,
  drawingRect,
  drawingColor,
}: SpectrogramDisplayProps) {
  // Frequency ticks (top → bottom, i.e. highest first)
  const freqStep = maxFreqKhz <= 12 ? 1 : 2;
  const freqTicks: number[] = [];
  for (let f = Math.floor(maxFreqKhz); f >= 0; f -= freqStep) {
    freqTicks.push(f);
  }
  if (freqTicks[freqTicks.length - 1] !== 0) freqTicks.push(0);

  // Time ticks
  const timeStep = duration <= 10 ? 2 : duration <= 30 ? 5 : 10;
  const timeTicks: number[] = [];
  for (let t = 0; t <= duration; t += timeStep) {
    timeTicks.push(Math.round(t));
  }
  const roundDur = Math.round(duration);
  const lastTick = timeTicks[timeTicks.length - 1];
  // Only add the duration endpoint if it's far enough from the last regular tick
  if (lastTick !== roundDur && (roundDur - lastTick) >= timeStep * 0.4) {
    timeTicks.push(roundDur);
  }

  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-xl p-4">
      <div className="grid grid-cols-[auto_1fr_auto] items-stretch">
        {/* ─── Y-axis (row 1, col 1) ─── */}
        <div className="flex pr-1.5">
          <div className="flex items-center mr-1">
            <span
              className="text-[10px] text-[var(--text-muted)] whitespace-nowrap"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Frequência (kHz)
            </span>
          </div>
          <div className="flex flex-col justify-between items-end py-0.5">
            {freqTicks.map((f) => (
              <span
                key={f}
                className="text-[10px] text-[var(--text-secondary)] font-mono leading-none"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* ─── Spectrogram image + cursor + tags (row 1, col 2) ─── */}
        <div
          className={`relative select-none ${
            isTagMode ? "cursor-crosshair" : "cursor-pointer"
          }`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          <img
            ref={imageRef}
            src={spectrogramUrl}
            alt="Spectrogram"
            className={`w-full h-full block rounded-sm transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={onImageLoad}
            draggable={false}
          />

          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          )}

          {/* Red cursor — now 0-100% maps exactly to the image */}
          {imageLoaded && (
            <>
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 transition-none pointer-events-none"
                style={{ left: `${progress}%` }}
              />
              {isDragging && !isTagMode && (
                <div
                  className="absolute -bottom-8 -translate-x-1/2 bg-gray-800 text-emerald-300 px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap pointer-events-none z-10 shadow-md"
                  style={{ left: `${progress}%` }}
                >
                  {formatTime(displayTime)}
                </div>
              )}

              {/* Tag overlay boxes */}
              <TagBoxOverlay
                tags={tags}
                duration={duration}
                maxFreqHz={maxFreqKhz * 1000}
                selectedTagId={selectedTagId}
                onTagClick={onTagClick}
                drawingRect={drawingRect}
                drawingColor={drawingColor}
              />
            </>
          )}
        </div>

        {/* ─── Colorbar (row 1, col 3) ─── */}
        <div className="flex pl-2">
          <div
            className="w-3 rounded-sm self-stretch"
            style={{
              background:
                "linear-gradient(to top, #440154, #482777, #3e4989, #31688e, #26828e, #1f9e89, #35b779, #6ece58, #b5de2b, #fde725)",
            }}
          />
          <div className="flex flex-col justify-between pl-1 py-0.5">
            {dbRange ? (
              <>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono leading-none">
                  {dbRange.max.toFixed(1)}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono leading-none">
                  {((dbRange.max + dbRange.min) / 2).toFixed(1)}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] font-mono leading-none">
                  {dbRange.min.toFixed(1)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] text-[var(--text-muted)] leading-none">Alto</span>
                <span className="text-[10px] text-[var(--text-muted)] leading-none">Baixo</span>
              </>
            )}
          </div>
          <div className="flex items-center ml-0.5">
            <span
              className="text-[10px] text-[var(--text-muted)] whitespace-nowrap"
              style={{ writingMode: "vertical-rl" }}
            >
              Intensidade (dB)
            </span>
          </div>
        </div>

        {/* ─── X-axis spacer (row 2, col 1) ─── */}
        <div />

        {/* ─── X-axis ticks (row 2, col 2) ─── */}
        <div className="relative pt-1.5 h-4">
          {timeTicks.map((t, i) => {
            const pct = duration > 0 ? (t / duration) * 100 : 0;
            const isFirst = i === 0;
            const isLast = i === timeTicks.length - 1;
            return (
              <span
                key={t}
                className="absolute text-[10px] text-[var(--text-secondary)] font-mono leading-none"
                style={{
                  left: `${pct}%`,
                  transform: isFirst
                    ? "none"
                    : isLast
                      ? "translateX(-100%)"
                      : "translateX(-50%)",
                }}
              >
                {t}
              </span>
            );
          })}
        </div>

        {/* ─── X-axis spacer (row 2, col 3) ─── */}
        <div />

        {/* ─── Label spacer (row 3, col 1) ─── */}
        <div />

        {/* ─── X-axis label (row 3, col 2) ─── */}
        <div className="text-center pt-0.5">
          <span className="text-[10px] text-[var(--text-muted)]">Tempo (s)</span>
        </div>

        {/* ─── Label spacer (row 3, col 3) ─── */}
        <div />
      </div>
    </div>
  );
}