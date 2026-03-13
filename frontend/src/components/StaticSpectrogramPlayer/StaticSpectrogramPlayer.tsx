"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Tag, Eye, EyeOff } from "lucide-react";
import { SpectrogramDisplay } from "./SpectrogramDisplay";
import { VolumeControl } from "./VolumeControl";
import { AudioFilterControls } from "./AudioFilterControls";
import { ProgressBar } from "./ProgressBar";
import { PlaybackControls } from "./PlaybackControls";
import { TagFormModal } from "./TagFormModal";
import { useAudioPlayer } from "./useAudioPlayer";
import { useSpectrogramDrag } from "./useSpectrogramDrag";
import { useTagDrawing } from "./useTagDrawing";
import { SpectrogramTag, getNextTagColor } from "./tags.types";

interface StaticSpectrogramPlayerProps {
  audioUrl: string;
  spectrogramUrl: string;
  duration: number;
  maxFreqKhz?: number;
  dbRange?: { min: number; max: number };
  /** Externally-managed tags state */
  tags?: SpectrogramTag[];
  onTagsChange?: (tags: SpectrogramTag[]) => void;
  /** Disables tag creation, editing, and deletion */
  readOnly?: boolean;
}

export function StaticSpectrogramPlayer({
  audioUrl,
  spectrogramUrl,
  duration,
  maxFreqKhz = 8,
  dbRange,
  tags: externalTags,
  onTagsChange,
  readOnly,
}: StaticSpectrogramPlayerProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Tag state (use external if provided, otherwise internal)
  const [internalTags, setInternalTags] = useState<SpectrogramTag[]>([]);
  const tags = externalTags ?? internalTags;
  const setTags = onTagsChange ?? setInternalTags;

  const [isTagMode, setIsTagMode] = useState(false);
  const [showTags, setShowTags] = useState(true);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [tagFormOpen, setTagFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<SpectrogramTag | null>(null);
  const [pendingTagCoords, setPendingTagCoords] = useState<Partial<SpectrogramTag> | null>(null);

  const {
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
  } = useAudioPlayer(duration);

  const {
    isDragging: seekDragging,
    previewTime,
    handleMouseDown: seekMouseDown,
    handleMouseMove: seekMouseMove,
    handleMouseUp: seekMouseUp,
    setIsDragging: setSeekDragging,
  } = useSpectrogramDrag(imageRef, audioDuration, seek);

  const {
    drawing: tagDrawing,
    drawingRect,
    completedRect,
    clearCompleted,
    tagHandlers,
  } = useTagDrawing(imageRef, isTagMode);

  // When a tag-drawing is completed, open the form with computed coordinates
  useEffect(() => {
    if (!completedRect) return;

    const dur = audioDuration || duration;
    const maxFreq = maxFreqKhz * 1000;

    const x1 = Math.min(completedRect.x1, completedRect.x2);
    const x2 = Math.max(completedRect.x1, completedRect.x2);
    const y1 = Math.min(completedRect.y1, completedRect.y2);
    const y2 = Math.max(completedRect.y1, completedRect.y2);

    const startTime = x1 * dur;
    const endTime = x2 * dur;
    const maxFreqHz = (1 - y1) * maxFreq; // top = high freq
    const minFreqHz = (1 - y2) * maxFreq;

    setPendingTagCoords({ startTime, endTime, minFreqHz, maxFreqHz });
    setEditingTag(null);
    setTagFormOpen(true);
    clearCompleted();
  }, [completedRect, audioDuration, duration, maxFreqKhz, clearCompleted]);

  // Merge mouse handlers: tag mode → tag handlers, otherwise seek handlers
  const handleMouseDown = isTagMode ? tagHandlers.onMouseDown : seekMouseDown;
  const handleMouseMove = isTagMode ? tagHandlers.onMouseMove : seekMouseMove;
  const handleMouseUp = isTagMode ? tagHandlers.onMouseUp : seekMouseUp;

  const handleTagClick = useCallback((id: string) => {
    setSelectedTagId((prev) => (prev === id ? null : id));
  }, []);

  // Double-click a tag → edit
  const handleTagDoubleClick = useCallback(
    (id: string) => {
      const tag = tags.find((t) => t.id === id);
      if (tag) {
        setEditingTag(tag);
        setPendingTagCoords(null);
        setTagFormOpen(true);
      }
    },
    [tags]
  );

  // Handle single vs double click on tag
  const tagClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTagClickWithDouble = useCallback(
    (id: string) => {
      if (tagClickTimer.current) {
        clearTimeout(tagClickTimer.current);
        tagClickTimer.current = null;
        handleTagDoubleClick(id);
      } else {
        tagClickTimer.current = setTimeout(() => {
          tagClickTimer.current = null;
          handleTagClick(id);
        }, 250);
      }
    },
    [handleTagClick, handleTagDoubleClick]
  );

  const handleTagFormSave = useCallback(
    (data: Omit<SpectrogramTag, "id" | "color">) => {
      if (editingTag) {
        // Update existing tag
        setTags(
          tags.map((t) =>
            t.id === editingTag.id ? { ...t, ...data } : t
          )
        );
      } else {
        // Create new tag
        const newTag: SpectrogramTag = {
          ...data,
          id: crypto.randomUUID(),
          color: getNextTagColor(tags),
        };
        setTags([...tags, newTag]);
      }
      setTagFormOpen(false);
      setEditingTag(null);
      setPendingTagCoords(null);
    },
    [editingTag, tags, setTags]
  );

  const handleTagFormDelete = useCallback(() => {
    if (editingTag) {
      setTags(tags.filter((t) => t.id !== editingTag.id));
      if (selectedTagId === editingTag.id) setSelectedTagId(null);
    }
    setTagFormOpen(false);
    setEditingTag(null);
  }, [editingTag, tags, setTags, selectedTagId]);

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = audioDuration > 0
    ? (((isTagMode ? currentTime : seekDragging ? previewTime : currentTime)) / audioDuration) * 100
    : 0;

  const displayTime = seekDragging && !isTagMode ? previewTime : currentTime;
  const nextColor = getNextTagColor(tags);

  return (
    <div className="space-y-4">
      {/* Tag mode toolbar */}
      <div className="flex items-center gap-2">
        {!readOnly && (
          <button
            onClick={() => {
              setIsTagMode(!isTagMode);
              setSelectedTagId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isTagMode
                ? "bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)]"
                : "bg-[color:var(--color-bg-card-hover)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border)] hover:border-[color:var(--color-border-hover)]"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            {isTagMode ? "Modo Tag Ativo" : "Adicionar Tags"}
          </button>
        )}

        {tags.length > 0 && (
          <>
            <button
              onClick={() => setShowTags(!showTags)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-[color:var(--color-bg-card-hover)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border)] hover:border-[color:var(--color-border-hover)] transition-all"
            >
              {showTags ? (
                <><Eye className="w-3.5 h-3.5" />Ocultar Tags</>
              ) : (
                <><EyeOff className="w-3.5 h-3.5" />Mostrar Tags</>
              )}
            </button>

            <span className="text-[10px] text-[color:var(--color-text-muted)] font-mono">
              {tags.length} tag{tags.length !== 1 ? "s" : ""}
            </span>
          </>
        )}

        {isTagMode && (
          <span className="text-[10px] text-[color:var(--color-text-muted)] ml-auto">
            Desenhe um retângulo no espectrograma para criar uma tag
          </span>
        )}
      </div>

      {/* Spectrogram with HTML axes */}
      <SpectrogramDisplay
        imageRef={imageRef}
        spectrogramUrl={spectrogramUrl}
        imageLoaded={imageLoaded}
        progress={progress}
        isDragging={seekDragging && !isTagMode}
        displayTime={displayTime}
        duration={audioDuration || duration}
        maxFreqKhz={maxFreqKhz}
        dbRange={dbRange ?? null}
        formatTime={formatTime}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (seekDragging && !isTagMode) setSeekDragging(false);
        }}
        onImageLoad={() => setImageLoaded(true)}
        isTagMode={isTagMode}
        tags={showTags ? tags : []}
        selectedTagId={selectedTagId}
        onTagClick={handleTagClickWithDouble}
        drawingRect={drawingRect}
        drawingColor={nextColor}
      />

      {/* Selected tag info bar */}
      {selectedTagId && showTags && (
        <SelectedTagBar
          tag={tags.find((t) => t.id === selectedTagId)!}
          onEdit={() => {
            const tag = tags.find((t) => t.id === selectedTagId);
            if (tag) {
              setEditingTag(tag);
              setPendingTagCoords(null);
              setTagFormOpen(true);
            }
          }}
          onDelete={() => {
            setTags(tags.filter((t) => t.id !== selectedTagId));
            setSelectedTagId(null);
          }}
          onDeselect={() => setSelectedTagId(null)}
          readOnly={readOnly}
        />
      )}

      {/* Volume */}
      <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />

      {/* Audio Filter */}
      <AudioFilterControls filter={filter} onFilterChange={setFilter} highpassFilter={highpassFilter} onHighpassChange={setHighpassFilter} />

      {/* Controls */}
      <div className="rounded-xl bg-[color:var(--color-bg-card)] border border-[color:var(--color-border)] p-4 space-y-4">
        <ProgressBar
          progress={progress}
          audioDuration={audioDuration}
          onSeek={seek}
          formatTime={formatTime}
        />
        <PlaybackControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          displayTime={displayTime}
          audioDuration={audioDuration}
          formatTime={formatTime}
          onTogglePlay={togglePlay}
          onRestart={restart}
        />
      </div>

      {/* Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="auto" crossOrigin="anonymous" />

      {/* Tag Form Modal */}
      <TagFormModal
        isOpen={tagFormOpen}
        initial={editingTag ?? pendingTagCoords ?? {}}
        isEditing={!!editingTag}
        onSave={handleTagFormSave}
        onDelete={handleTagFormDelete}
        onClose={() => {
          setTagFormOpen(false);
          setEditingTag(null);
          setPendingTagCoords(null);
        }}
      />
    </div>
  );
}

/* --- Sub-component: selected tag info bar --- */

function SelectedTagBar({
  tag,
  onEdit,
  onDelete,
  onDeselect,
  readOnly,
}: {
  tag: SpectrogramTag;
  onEdit: () => void;
  onDelete: () => void;
  onDeselect: () => void;
  readOnly?: boolean;
}) {
  if (!tag) return null;
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs"
      style={{
        borderColor: `${tag.color}50`,
        backgroundColor: `${tag.color}10`,
      }}
    >
      <div
        className="w-3 h-3 rounded-sm flex-shrink-0"
        style={{ backgroundColor: tag.color }}
      />
      <span className="font-semibold text-[color:var(--color-text-primary)]">
        {tag.species || "Sem espécie"}
      </span>
      <span className="text-[color:var(--color-text-muted)] font-mono">
        {tag.startTime.toFixed(1)}s – {tag.endTime.toFixed(1)}s
      </span>
      <span className="text-[color:var(--color-text-muted)] font-mono">
        {tag.minFreqHz.toFixed(0)} – {tag.maxFreqHz.toFixed(0)} Hz
      </span>
      {tag.type !== "Unknown" && (
        <span className="text-[color:var(--color-text-muted)]">{tag.type}</span>
      )}
      <div className="ml-auto flex items-center gap-2">
        {!readOnly && (
          <>
            <button
              onClick={onEdit}
              className="px-2 py-1 rounded text-[10px] font-semibold bg-[color:var(--color-bg-card-hover)] border border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)] transition-colors"
            >
              Editar
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-1 rounded text-[10px] font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              Excluir
            </button>
          </>
        )}
        <button
          onClick={onDeselect}
          className="px-2 py-1 rounded text-[10px] font-semibold text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}