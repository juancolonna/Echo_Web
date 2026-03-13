"use client";

import { useState, useCallback, RefObject } from "react";
import { DrawingRect } from "./tags.types";

/**
 * Hook that handles rectangle-drawing on the spectrogram image.
 * Returns the in-progress rectangle (fractions 0-1) and a completed rectangle.
 */
export function useTagDrawing(
  imageRef: RefObject<HTMLImageElement | null>,
  isTagMode: boolean
) {
  const [drawing, setDrawing] = useState(false);
  const [drawingRect, setDrawingRect] = useState<DrawingRect | null>(null);
  const [completedRect, setCompletedRect] = useState<DrawingRect | null>(null);

  /** Convert clientX/Y to fraction (0-1) relative to the image */
  const toFraction = useCallback(
    (clientX: number, clientY: number) => {
      const img = imageRef.current;
      if (!img) return { fx: 0, fy: 0 };
      const rect = img.getBoundingClientRect();
      const fx = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
      const fy = Math.max(0, Math.min((clientY - rect.top) / rect.height, 1));
      return { fx, fy };
    },
    [imageRef]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isTagMode) return;
      e.preventDefault();
      const { fx, fy } = toFraction(e.clientX, e.clientY);
      setDrawing(true);
      setDrawingRect({ x1: fx, y1: fy, x2: fx, y2: fy });
      setCompletedRect(null);
    },
    [isTagMode, toFraction]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!drawing || !isTagMode) return;
      const { fx, fy } = toFraction(e.clientX, e.clientY);
      setDrawingRect((prev) =>
        prev ? { ...prev, x2: fx, y2: fy } : null
      );
    },
    [drawing, isTagMode, toFraction]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!drawing || !isTagMode) return;
      const { fx, fy } = toFraction(e.clientX, e.clientY);
      const final: DrawingRect = drawingRect
        ? { ...drawingRect, x2: fx, y2: fy }
        : { x1: fx, y1: fy, x2: fx, y2: fy };

      // Only complete if rectangle has some size
      const dx = Math.abs(final.x2 - final.x1);
      const dy = Math.abs(final.y2 - final.y1);
      if (dx > 0.01 && dy > 0.01) {
        setCompletedRect(final);
      }

      setDrawing(false);
      setDrawingRect(null);
    },
    [drawing, isTagMode, drawingRect, toFraction]
  );

  /** Clear the completed rect after it's been consumed */
  const clearCompleted = useCallback(() => {
    setCompletedRect(null);
  }, []);

  return {
    drawing,
    drawingRect,
    completedRect,
    clearCompleted,
    tagHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
    },
  };
}
