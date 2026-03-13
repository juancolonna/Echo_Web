"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";
import api from "@/utils/api";
import {
  ArrowLeft,
  Calendar,
  User,
  LinkIcon,
  Pencil,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { MarkdownPreview } from "@/components/ArticleEditor/MarkdownPreview";

export default function ArticleViewPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/articles/${id}`);
        setArticle(data.article);
      } catch (err: any) {
        setError(err.response?.status === 404 ? "Artigo não encontrado" : "Erro ao carregar artigo");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-8">
        <div className="max-w-md w-full p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-600 mb-4">{error || "Artigo não encontrado"}</p>
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Artigos
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user?.userId === article.authorId;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Top bar */}
      <div className="bg-white border-b border-[var(--border-default)]">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            href="/articles"
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Todos os Artigos
          </Link>

          {isAuthor && (
            <Link
              href={`/articles/editor?id=${article.id}`}
              className="btn-secondary flex items-center gap-2 text-sm !py-2"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Article content */}
      <article className="max-w-3xl mx-auto px-6 py-10">
        {/* Title */}
        <h1 className="text-4xl font-bold text-[var(--text-primary)] leading-tight mb-4">
          {article.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <User className="w-4 h-4" />
            {article.author?.name || "Anônimo"}
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Calendar className="w-4 h-4" />
            {new Date(article.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
          {article.savedAnalysis && (
            <Link
              href={`/analysis/public/${article.savedAnalysis.id}`}
              className="flex items-center gap-1.5 text-sm text-teal-600 hover:underline"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              {article.savedAnalysis.title}
            </Link>
          )}
        </div>

        {/* Body */}
        <div className="prose prose-lg max-w-none text-[var(--text-primary)] leading-relaxed">
          <MarkdownPreview content={article.content} />
        </div>

        {/* Link to full analysis data */}
        {article.savedAnalysis && (
          <div className="mt-10 pt-8 border-t border-[var(--border-default)]">
            <Link
              href={`/analysis/public/${article.savedAnalysis.id}`}
              className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl hover:shadow-md transition-all group"
            >
              <div className="p-2 rounded-lg bg-teal-100">
                <LinkIcon className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-800 group-hover:underline">
                  Ver dados da análise: {article.savedAnalysis.title}
                </p>
                <p className="text-xs text-teal-600 mt-0.5">
                  Visualizar ranking acústico, espectrogramas, tags e dados micrometeorológicos
                </p>
              </div>
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
