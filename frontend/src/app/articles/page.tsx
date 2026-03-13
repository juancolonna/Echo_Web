"use client";

import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";
import api from "@/utils/api";
import Link from "next/link";
import {
  FileText,
  Calendar,
  User,
  LinkIcon,
  Loader2,
  PenSquare,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";

type ArticleAuthor = {
  name: string;
};

type LinkedAnalysis = {
  title: string;
};

type Article = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  published: boolean;
  author?: ArticleAuthor;
  savedAnalysis?: LinkedAnalysis;
};

type ArticlesResponse = {
  articles?: Article[];
};

export default function ArticlesPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [articles, setArticles] = useState<Article[]>([]);
  const [myDrafts, setMyDrafts] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"published" | "mine">("published");

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ArticlesResponse>("/articles/published");
      setArticles(data.articles || []);

      if (user) {
        const { data: mine } = await api.get<ArticlesResponse>("/articles/mine");
        setMyDrafts((mine.articles || []).filter((article) => !article.published));
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

    if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] px-6 py-16">
        <div className="max-w-2xl mx-auto text-center bg-white border border-[var(--border-default)] rounded-xl p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
            Login necessário
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Você precisa estar logado para ler artigos.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="btn-primary"
          >
            Ir para login
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50">
              <FileText className="w-7 h-7 text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Artigos</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Publicações da comunidade sobre análises bioacústicas
              </p>
            </div>
          </div>

          {user && (
            <Link
              href="/articles/editor"
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <PenSquare className="w-4 h-4" />
              Novo Artigo
            </Link>
          )}
        </div>

        {/* Tabs (if logged in and has drafts) */}
        {user && myDrafts.length > 0 && (
          <div className="flex gap-1 mb-6 p-1 bg-[var(--bg-card-hover)] rounded-lg w-fit">
            <button
              onClick={() => setTab("published")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "published"
                  ? "bg-white text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <Globe className="w-3.5 h-3.5 inline mr-1.5" />
              Publicados ({articles.length})
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "mine"
                  ? "bg-white text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <PenSquare className="w-3.5 h-3.5 inline mr-1.5" />
              Meus Rascunhos ({myDrafts.length})
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {tab === "published" ? (
              articles.length === 0 ? (
                <EmptyState
                  message="Nenhum artigo publicado ainda"
                  sub="Seja o primeiro a compartilhar suas descobertas!"
                />
              ) : (
                articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))
              )
            ) : (
              myDrafts.length === 0 ? (
                <EmptyState message="Nenhum rascunho" sub="Seus rascunhos aparecerão aqui" />
              ) : (
                myDrafts.map((article) => (
                  <ArticleCard key={article.id} article={article} isDraft />
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ article, isDraft }: { article: Article; isDraft?: boolean }) {
  const preview = article.content?.slice(0, 200) || "";

  return (
    <Link
      href={isDraft ? `/articles/editor?id=${article.id}` : `/articles/${article.id}`}
      className="block p-5 bg-white border border-[var(--border-default)] rounded-xl hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors truncate">
            {article.title}
          </h2>

          {preview && (
            <p className="mt-1.5 text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
              {preview}
              {article.content?.length > 200 ? "..." : ""}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3">
            {article.author && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <User className="w-3 h-3" />
                {article.author.name}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Calendar className="w-3 h-3" />
              {new Date(article.createdAt).toLocaleDateString("pt-BR")}
            </span>
            {article.savedAnalysis && (
              <span className="flex items-center gap-1 text-xs text-teal-600">
                <LinkIcon className="w-3 h-3" />
                {article.savedAnalysis.title}
              </span>
            )}
          </div>
        </div>

        {isDraft && (
          <span className="flex-shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 uppercase">
            Rascunho
          </span>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="py-20 text-center">
      <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
      <p className="text-[var(--text-secondary)] font-medium">{message}</p>
      <p className="text-sm text-[var(--text-muted)] mt-1">{sub}</p>
    </div>
  );
}
