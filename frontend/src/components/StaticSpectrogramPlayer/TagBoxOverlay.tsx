"use client";

import { SpectrogramTag, DrawingRect } from "./tags.types";

interface TagBoxOverlayProps {
  tags: SpectrogramTag[];
  duration: number;
  maxFreqHz: number;
  selectedTagId: string | null;
  onTagClick: (id: string) => void;
  /** Rect being actively drawn (fractions 0-1) */
  drawingRect: DrawingRect | null;
  drawingColor: string;
}

/** Convert a tag's real-unit coords to CSS percentages */
function tagToCSS(tag: SpectrogramTag, duration: number, maxFreqHz: number) {
  const leftPct = (tag.startTime / duration) * 100;
  const rightPct = (tag.endTime / duration) * 100;
  const widthPct = rightPct - leftPct;

  // Frequency axis is inverted: Y=0 is top (high freq)
  const topPct = (1 - tag.maxFreqHz / maxFreqHz) * 100;
  const bottomPct = (1 - tag.minFreqHz / maxFreqHz) * 100;
  const heightPct = bottomPct - topPct;

  return {
    left: `${leftPct}%`,
    top: `${topPct}%`,
    width: `${widthPct}%`,
    height: `${heightPct}%`,
  };
}

/** Convert a drawing rect (fractions) to CSS */
function drawRectToCSS(r: DrawingRect) {
  const left = Math.min(r.x1, r.x2) * 100;
  const top = Math.min(r.y1, r.y2) * 100;
  const width = Math.abs(r.x2 - r.x1) * 100;
  const height = Math.abs(r.y2 - r.y1) * 100;
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

export function TagBoxOverlay({
  tags,
  duration,
  maxFreqHz,
  selectedTagId,
  onTagClick,
  drawingRect,
  drawingColor,
}: TagBoxOverlayProps) {
  return (
    <>
      {/* Existing tags */}
      {tags.map((tag) => {
        const css = tagToCSS(tag, duration, maxFreqHz);
        const isSelected = tag.id === selectedTagId;

        return (
          <div
            key={tag.id}
            className="absolute cursor-pointer transition-opacity group/tag"
            style={{
              ...css,
              border: `2px solid ${tag.color}`,
              backgroundColor: `${tag.color}18`,
              zIndex: isSelected ? 20 : 10,
              boxShadow: isSelected ? `0 0 0 1px ${tag.color}60` : "none",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTagClick(tag.id);
            }}
          >
            {/* Species label (appears on hover or when selected) */}
            <div
              className={`absolute left-0 -bottom-6 px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap pointer-events-none z-30 transition-opacity ${
                isSelected
                  ? "opacity-100"
                  : "opacity-0 group-hover/tag:opacity-100"
              }`}
              style={{
                backgroundColor: tag.color,
                color: "#000",
              }}
            >
              {tag.species || "Sem espécie"}
            </div>
          </div>
        );
      })}

      {/* Drawing in progress */}
      {drawingRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            ...drawRectToCSS(drawingRect),
            border: `2px dashed ${drawingColor}`,
            backgroundColor: `${drawingColor}20`,
            zIndex: 25,
          }}
        />
      )}
    </>
  );
}
