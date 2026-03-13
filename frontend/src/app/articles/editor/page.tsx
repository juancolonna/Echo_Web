"use client";

import { useContext, useEffect, useState, useCallback, useRef, KeyboardEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";
import api from "@/utils/api";
import {
  ArrowLeft,
  Save,
  Globe,
  GlobeLock,
  Loader2,
  Trash2,
  FileText,
  LinkIcon,
  Columns2,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { MarkdownToolbar } from "@/components/ArticleEditor/MarkdownToolbar";
import { MarkdownPreview } from "@/components/ArticleEditor/MarkdownPreview";

type ViewMode = "write" | "preview" | "split";

export default function ArticleEditorPage() {
  return (
    <Suspense fallback={<ArticleEditorLoading />}>
      <ArticleEditorPageContent />
    </Suspense>
  );
}

function ArticleEditorPageContent() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const articleId = searchParams.get("id");
  const analysisId = searchParams.get("analysisId");
  const analysisTitle = searchParams.get("analysisTitle");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!articleId);
  const [savedId, setSavedId] = useState<string | null>(articleId);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("write");

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user, router]);

  // Load existing article
  useEffect(() => {
    if (!articleId) return;
    (async () => {
      try {
        const { data } = await api.get(`/articles/${articleId}`);
        setTitle(data.article.title);
        setContent(data.article.content);
        setPublished(data.article.published);
        setSavedId(data.article.id);
      } catch {
        router.push("/articles");
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  // Check if analysis already has an article (redirect to edit it)
  useEffect(() => {
    if (!analysisId || articleId) return;
    (async () => {
      try {
        const { data } = await api.get(`/articles/by-analysis/${analysisId}`);
        if (data.article) {
          router.replace(`/articles/editor?id=${data.article.id}`);
        }
      } catch {
        // No existing article, continue creating new
      }
    })();
  }, [analysisId, articleId]);

  const handleSave = useCallback(async (shouldPublish?: boolean) => {
    if (!title.trim()) return;
    setSaving(true);

    try {
      const pub = shouldPublish !== undefined ? shouldPublish : published;

      if (savedId) {
        await api.put(`/articles/${savedId}`, { title, content, published: pub });
      } else {
        const { data } = await api.post("/articles", {
          title,
          content,
          analysisId: analysisId || undefined,
        });
        setSavedId(data.article.id);
        if (pub) {
          await api.put(`/articles/${data.article.id}`, { published: true });
        }
      }

      setPublished(pub);
      setLastSaved(new Date());
    } catch (err) {
      console.error("Error saving article:", err);
      alert("Erro ao salvar artigo");
    } finally {
      setSaving(false);
    }
  }, [title, content, published, savedId, analysisId]);

  const handleDelete = async () => {
    if (!savedId) return;
    if (!confirm("Tem certeza que deseja excluir este artigo?")) return;
    setDeleting(true);
    try {
      await api.delete(`/articles/${savedId}`);
      router.push("/articles");
    } catch {
      alert("Erro ao excluir artigo");
      setDeleting(false);
    }
  };

  const handlePublishToggle = () => {
    handleSave(!published);
  };

  // Keyboard shortcuts: Ctrl+B, Ctrl+I, Ctrl+S
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;

    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end);

    const wrap = (before: string, after: string) => {
      e.preventDefault();
      if (selected) {
        const newText = content.slice(0, start) + before + selected + after + content.slice(end);
        setContent(newText);
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(start + before.length, start + before.length + selected.length);
        });
      } else {
        const placeholder = "texto";
        const newText = content.slice(0, start) + before + placeholder + after + content.slice(end);
        setContent(newText);
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(start + before.length, start + before.length + placeholder.length);
        });
      }
    };

    switch (e.key.toLowerCase()) {
      case "b":
        wrap("**", "**");
        break;
      case "i":
        wrap("_", "_");
        break;
      case "s":
        e.preventDefault();
        handleSave();
        break;
    }
  }, [content, handleSave]);

  // Handle Tab key for indentation
  const handleTab = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const newText = content.slice(0, start) + "  " + content.slice(start);
      setContent(newText);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + 2, start + 2);
      });
    }
  }, [content]);

  const cycleViewMode = () => {
    const modes: ViewMode[] = ["write", "split", "preview"];
    const idx = modes.indexOf(viewMode);
    setViewMode(modes[(idx + 1) % modes.length]);
  };

  if (user === null || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  const showEditor = viewMode === "write" || viewMode === "split";
  const showPreview = viewMode === "preview" || viewMode === "split";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-[var(--border-default)]">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href={savedId ? `/articles/${savedId}` : "/articles"}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-[11px] text-[var(--text-muted)]">
                Salvo às {lastSaved.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}

            {savedId && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir artigo"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={() => handleSave()}
              disabled={saving || !title.trim()}
              className="btn-secondary flex items-center gap-2 text-sm !py-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>

            <button
              onClick={handlePublishToggle}
              disabled={saving || !title.trim()}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                published
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300"
                  : "btn-primary"
              }`}
            >
              {published ? (
                <>
                  <GlobeLock className="w-4 h-4" />
                  Despublicar
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  Publicar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 flex flex-col max-w-[1400px] mx-auto w-full px-6 py-6 pb-14">
        {/* Analysis link badge */}
        {(analysisTitle || analysisId) && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-700">
            <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Vinculado à análise: <strong>{analysisTitle || analysisId}</strong>
            </span>
          </div>
        )}

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do artigo..."
          className="w-full text-3xl font-bold text-[var(--text-primary)] placeholder:text-gray-300 bg-transparent border-none outline-none mb-4 leading-tight"
          autoFocus
        />

        {/* Toolbar */}
        <div className="mb-4">
          <MarkdownToolbar
            textareaRef={textareaRef}
            content={content}
            onChange={setContent}
            showPreview={showPreview}
            onTogglePreview={cycleViewMode}
          />
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-1 mb-4">
          <button
            onClick={() => setViewMode("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "write"
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            Escrever
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "split"
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            Dividido
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "preview"
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        {/* Editor + Preview split */}
        <div className={`flex-1 flex gap-4 min-h-[60vh] ${viewMode === "split" ? "grid grid-cols-2" : ""}`}>
          {/* Editor pane */}
          {showEditor && (
            <div className={`flex flex-col ${viewMode === "split" ? "" : "flex-1"}`}>
              <div className="flex-1 border border-[var(--border-default)] rounded-xl overflow-hidden bg-white">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    handleKeyDown(e);
                    handleTab(e);
                  }}
                  placeholder="Escreva em Markdown...

# Título principal
## Subtítulo

**negrito**, _itálico_, ~~tachado~~, `código`

- Item de lista
1. Item numerado
- [ ] Tarefa

> Citação

```
bloco de código
```

| Col 1 | Col 2 |
| --- | --- |
| dado | dado |

Use Ctrl+B para negrito, Ctrl+I para itálico, Ctrl+S para salvar."
                  className="w-full h-full min-h-[60vh] px-5 py-4 text-sm text-[var(--text-primary)] placeholder:text-gray-300 bg-transparent border-none outline-none resize-none leading-relaxed font-mono"
                  spellCheck
                />
              </div>
            </div>
          )}

          {/* Preview pane */}
          {showPreview && (
            <div className={`flex flex-col ${viewMode === "split" ? "" : "flex-1"}`}>
              <div className="flex-1 border border-[var(--border-default)] rounded-xl overflow-auto bg-white px-6 py-5">
                <MarkdownPreview content={content} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom status */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--border-default)] z-30">
        <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {content.split(/\s+/).filter(Boolean).length} palavras
            </span>
            <span>{content.length} caracteres</span>
            <span className="text-[var(--text-muted)] opacity-60">Markdown</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--text-muted)] opacity-60">
              Ctrl+B negrito · Ctrl+I itálico · Ctrl+S salvar
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${published ? "bg-green-400" : "bg-amber-400"}`} />
              <span className="text-[11px] text-[var(--text-muted)]">
                {published ? "Publicado" : "Rascunho"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArticleEditorLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
    </div>
  );
}
