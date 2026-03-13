"use client";

import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  CodeSquare,
  Link as LinkIcon,
  Image,
  Table,
  Minus,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
} from "lucide-react";
import { RefObject, useCallback } from "react";

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  onChange: (value: string) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
}

type InsertAction = {
  icon: React.ReactNode;
  label: string;
  action: (ta: HTMLTextAreaElement, content: string) => { text: string; cursorOffset?: number };
  dividerAfter?: boolean;
};

function wrapSelection(
  ta: HTMLTextAreaElement,
  content: string,
  before: string,
  after: string
): { text: string; cursorOffset?: number } {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = content.slice(start, end);

  if (selected) {
    const newText = content.slice(0, start) + before + selected + after + content.slice(end);
    return { text: newText, cursorOffset: start + before.length + selected.length + after.length };
  }

  const placeholder = "texto";
  const newText = content.slice(0, start) + before + placeholder + after + content.slice(end);
  return { text: newText, cursorOffset: start + before.length + placeholder.length };
}

function insertAtCursor(
  ta: HTMLTextAreaElement,
  content: string,
  insertion: string,
  cursorRelative?: number
): { text: string; cursorOffset?: number } {
  const start = ta.selectionStart;
  const needsNewline = start > 0 && content[start - 1] !== "\n" ? "\n" : "";
  const newText = content.slice(0, start) + needsNewline + insertion + content.slice(start);
  const offset = cursorRelative !== undefined
    ? start + needsNewline.length + cursorRelative
    : start + needsNewline.length + insertion.length;
  return { text: newText, cursorOffset: offset };
}

const TABLE_TEMPLATE = `| Coluna 1 | Coluna 2 | Coluna 3 |
| --- | --- | --- |
| dado | dado | dado |
| dado | dado | dado |`;

export function MarkdownToolbar({
  textareaRef,
  content,
  onChange,
  showPreview,
  onTogglePreview,
}: MarkdownToolbarProps) {
  const exec = useCallback(
    (action: InsertAction["action"]) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const { text, cursorOffset } = action(ta, content);
      onChange(text);

      // Restore focus + cursor after React re-render
      requestAnimationFrame(() => {
        ta.focus();
        if (cursorOffset !== undefined) {
          ta.setSelectionRange(cursorOffset, cursorOffset);
        }
      });
    },
    [textareaRef, content, onChange]
  );

  const groups: InsertAction[][] = [
    // Text formatting
    [
      { icon: <Bold className="w-4 h-4" />, label: "Negrito (Ctrl+B)", action: (ta, c) => wrapSelection(ta, c, "**", "**") },
      { icon: <Italic className="w-4 h-4" />, label: "Itálico (Ctrl+I)", action: (ta, c) => wrapSelection(ta, c, "_", "_") },
      { icon: <Strikethrough className="w-4 h-4" />, label: "Tachado", action: (ta, c) => wrapSelection(ta, c, "~~", "~~") },
      { icon: <Code className="w-4 h-4" />, label: "Código inline", action: (ta, c) => wrapSelection(ta, c, "`", "`") },
    ],
    // Headings
    [
      { icon: <Heading1 className="w-4 h-4" />, label: "Título 1", action: (ta, c) => insertAtCursor(ta, c, "# ", 2) },
      { icon: <Heading2 className="w-4 h-4" />, label: "Título 2", action: (ta, c) => insertAtCursor(ta, c, "## ", 3) },
      { icon: <Heading3 className="w-4 h-4" />, label: "Título 3", action: (ta, c) => insertAtCursor(ta, c, "### ", 4) },
    ],
    // Lists & blocks
    [
      { icon: <List className="w-4 h-4" />, label: "Lista", action: (ta, c) => insertAtCursor(ta, c, "- Item\n", 2) },
      { icon: <ListOrdered className="w-4 h-4" />, label: "Lista numerada", action: (ta, c) => insertAtCursor(ta, c, "1. Item\n", 3) },
      { icon: <ListChecks className="w-4 h-4" />, label: "Checkbox", action: (ta, c) => insertAtCursor(ta, c, "- [ ] Tarefa\n", 6) },
      { icon: <Quote className="w-4 h-4" />, label: "Citação", action: (ta, c) => insertAtCursor(ta, c, "> ", 2) },
    ],
    // Rich blocks
    [
      { icon: <CodeSquare className="w-4 h-4" />, label: "Bloco de código", action: (ta, c) => insertAtCursor(ta, c, "```\ncódigo aqui\n```\n", 4) },
      { icon: <Table className="w-4 h-4" />, label: "Tabela", action: (ta, c) => insertAtCursor(ta, c, TABLE_TEMPLATE + "\n") },
      { icon: <Minus className="w-4 h-4" />, label: "Divisor", action: (ta, c) => insertAtCursor(ta, c, "\n---\n") },
    ],
    // Links & media
    [
      { icon: <LinkIcon className="w-4 h-4" />, label: "Link", action: (ta, c) => {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = c.slice(start, end);
        if (selected) {
          const text = c.slice(0, start) + `[${selected}](url)` + c.slice(end);
          return { text, cursorOffset: start + selected.length + 3 };
        }
        const text = c.slice(0, start) + "[texto](url)" + c.slice(end);
        return { text, cursorOffset: start + 1 };
      }},
      { icon: <Image className="w-4 h-4" />, label: "Imagem", action: (ta, c) => {
        const start = ta.selectionStart;
        const text = c.slice(0, start) + "![descrição](url-da-imagem)" + c.slice(start);
        return { text, cursorOffset: start + 2 };
      }},
    ],
  ];

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 bg-[var(--bg-card-hover)] border border-[var(--border-default)] rounded-xl flex-wrap">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && (
            <div className="w-px h-5 bg-[var(--border-default)] mx-1.5" />
          )}
          {group.map((item, ii) => (
            <button
              key={ii}
              type="button"
              onClick={() => exec(item.action)}
              title={item.label}
              className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white transition-colors"
            >
              {item.icon}
            </button>
          ))}
        </div>
      ))}

      {/* Preview toggle */}
      <div className="ml-auto flex items-center">
        <div className="w-px h-5 bg-[var(--border-default)] mx-2" />
        <button
          type="button"
          onClick={onTogglePreview}
          title={showPreview ? "Ocultar preview" : "Mostrar preview"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            showPreview
              ? "bg-[var(--color-primary)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white"
          }`}
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          Preview
        </button>
      </div>
    </div>
  );
}
