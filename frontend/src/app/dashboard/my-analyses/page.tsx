"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";
import { SavedAnalysisList } from "@/components/SavedAnalysisList/SavedAnalysisList";
import { FolderOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MyAnalysesPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (user === null) {
      router.push("/login");
    }
  }, [user, router]);

  // Show spinner while auth state is being resolved
  if (user === null) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-50">
              <FolderOpen className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Minhas Análises Salvas
              </h1>
              <p className="text-sm text-[color:var(--color-text-secondary)] mt-1">
                Gerencie e visualize suas análises bioacústicas
              </p>
            </div>
          </div>
        </header>

        {/* Analysis list */}
        <main>
          <SavedAnalysisList />
        </main>
      </div>
    </div>
  );
}