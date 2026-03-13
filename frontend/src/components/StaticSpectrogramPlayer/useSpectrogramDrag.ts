import { RefObject, useState, useEffect, useCallback } from "react";

export function useSpectrogramDrag(
  imageRef: RefObject<HTMLImageElement | null>,
  audioDuration: number,
  onSeek: (time: number) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);

  const getTimeFromClientX = useCallback(
    (clientX: number) => {
      const img = imageRef.current;
      if (!img || audioDuration <= 0) return 0;

      const rect = img.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      return (x / rect.width) * audioDuration;
    },
    [imageRef, audioDuration]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const time = getTimeFromClientX(e.clientX);
    setPreviewTime(time);
    onSeek(time);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const time = getTimeFromClientX(e.clientX);
    setPreviewTime(time);
    onSeek(time);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const time = getTimeFromClientX(e.clientX);
    onSeek(time);
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const time = getTimeFromClientX(e.clientX);
      setPreviewTime(time);
      onSeek(time);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, getTimeFromClientX, onSeek]);

  return {
    isDragging,
    previewTime,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setIsDragging,
  };
}