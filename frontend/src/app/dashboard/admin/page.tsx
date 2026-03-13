"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";
import api from "@/utils/api";
import {
  Users,
  BarChart3,
  Tags,
  UserPlus,
  Trash2,
  Loader2,
  ShieldCheck,
  FileBarChart,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const ADMIN_TYPE_ID = "d90171c9-a589-4883-a0bb-027a32e0be23";

type Stats = {
  totalUsers: number;
  totalAnalyses: number;
  totalTags: number;
  recentUsers: number;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  userTypeId: string;
  createdAt: string;
  analysisCount: number;
};

type AdminAnalysis = {
  id: string;
  title: string;
  totalAudios: number | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  tagCount: number;
};

export default function AdminPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analyses, setAnalyses] = useState<AdminAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "analyses">("users");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user === null) {
      router.push("/login");
      return;
    }
    if (user && user.userType !== ADMIN_TYPE_ID) {
      router.push("/");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, analysesRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/analyses"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setAnalyses(analysesRes.data.analyses);
    } catch (err: any) {
      if (err.response?.status === 403) {
        router.push("/");
      } else {
        setError("Erro ao carregar dados do painel administrativo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"?\nTodas as análises deste usuário serão removidas.`)) {
      return;
    }
    try {
      setDeletingId(userId);
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setAnalyses((prev) => prev.filter((a) => a.userEmail !== users.find((u) => u.id === userId)?.email));
      if (stats) {
        setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao excluir usuário.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir a análise "${title}"?`)) {
      return;
    }
    try {
      setDeletingId(analysisId);
      await api.delete(`/admin/analyses/${analysisId}`);
      setAnalyses((prev) => prev.filter((a) => a.id !== analysisId));
      if (stats) {
        setStats({ ...stats, totalAnalyses: stats.totalAnalyses - 1 });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao excluir análise.");
    } finally {
      setDeletingId(null);
    }
  };

  if (user === null || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-8">
        <div className="max-w-md w-full p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary text-sm">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--border-default)] bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  Painel Administrativo
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  Gerenciamento de usuários e análises
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="w-5 h-5 text-blue-600" />}
              label="Usuários"
              value={stats.totalUsers}
              bg="bg-blue-50"
            />
            <StatCard
              icon={<FileBarChart className="w-5 h-5 text-emerald-600" />}
              label="Análises Salvas"
              value={stats.totalAnalyses}
              bg="bg-emerald-50"
            />
            <StatCard
              icon={<Tags className="w-5 h-5 text-purple-600" />}
              label="Tags Totais"
              value={stats.totalTags}
              bg="bg-purple-50"
            />
            <StatCard
              icon={<UserPlus className="w-5 h-5 text-amber-600" />}
              label="Novos (7d)"
              value={stats.recentUsers}
              bg="bg-amber-50"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white border border-[var(--border-default)] rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex border-b border-[var(--border-default)]">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-primary-glow)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              }`}
            >
              <Users className="w-4 h-4" />
              Usuários ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("analyses")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "analyses"
                  ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-primary-glow)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              }`}
            >
              <FileBarChart className="w-4 h-4" />
              Análises ({analyses.length})
            </button>
          </div>

          {/* Users Table */}
          {activeTab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-primary)]">
                    <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Nome
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Email
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Tipo
                    </th>
                    <th className="text-center px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Análises
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Criado em
                    </th>
                    <th className="text-center px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                        {u.name}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">
                        {u.email}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-[var(--text-secondary)]">
                        {u.analysisCount}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)]">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {u.userTypeId !== ADMIN_TYPE_ID && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            disabled={deletingId === u.id}
                            className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="Excluir usuário"
                          >
                            {deletingId === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-[var(--text-muted)]">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Analyses Table */}
          {activeTab === "analyses" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-primary)]">
                    <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Título
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Usuário
                    </th>
                    <th className="text-center px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Áudios
                    </th>
                    <th className="text-center px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Tags
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Criado em
                    </th>
                    <th className="text-center px-5 py-3 font-semibold text-[var(--text-secondary)]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-[var(--text-primary)] max-w-[250px] truncate">
                        {a.title}
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-[var(--text-primary)]">{a.userName}</p>
                          <p className="text-xs text-[var(--text-muted)]">{a.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-[var(--text-secondary)]">
                        {a.totalAudios ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-center text-[var(--text-secondary)]">
                        {a.tagCount}
                      </td>
                      <td className="px-5 py-3 text-[var(--text-muted)]">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleDeleteAnalysis(a.id, a.title)}
                          disabled={deletingId === a.id}
                          className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="Excluir análise"
                        >
                          {deletingId === a.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {analyses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-[var(--text-muted)]">
                        Nenhuma análise encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div className="bg-white border border-[var(--border-default)] rounded-xl p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
        </div>
      </div>
    </div>
  );
}
