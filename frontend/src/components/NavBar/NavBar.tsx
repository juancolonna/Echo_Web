'use client';

import Link from "next/link";
import { useContext, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";
import {
  LogOut,
  Menu,
  X,
  AudioLines,
  BarChart2,
  FolderOpen,
  ShieldCheck,
  FileText,
} from "lucide-react";

export function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const ADMIN_TYPE_ID = "d90171c9-a589-4883-a0bb-027a32e0be23";
  const isAdmin = user?.userType === ADMIN_TYPE_ID;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navLinks = [
    { name: "Home", href: "/", icon: null },
    { name: "Sobre", href: "/about", icon: null },
    {
      name: "Análise",
      href: "/analysis",
      icon: <BarChart2 className="w-4 h-4" />
    },
    {
      name: "Artigos",
      href: "/articles",
      icon: <FileText className="w-4 h-4" />
    },
    ...(user
      ? [
          {
            name: "Minhas Análises",
            href: "/dashboard/my-analyses",
            icon: <FolderOpen className="w-4 h-4" />,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            name: "Admin",
            href: "/dashboard/admin",
            icon: <ShieldCheck className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-[var(--border-default)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-[var(--color-primary)] p-1.5 rounded-lg transition-transform group-hover:scale-105">
              <AudioLines className="w-4 h-4 text-white" />
            </div>
            <span className="text-[var(--text-primary)] font-bold tracking-tight text-base">
              EchoWeb
              <span className="text-[var(--color-primary)] text-[10px] ml-1 font-semibold tracking-wider uppercase">
                Beta
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "text-[var(--color-primary)] bg-[var(--color-primary-glow)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center border-l border-[var(--border-default)] ml-4 pl-4 gap-3">
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-md transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary text-sm !py-1.5 !px-4"
                >
                  Criar conta
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {user.userName}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-[var(--border-default)]">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              >
                {link.icon}
                {link.name}
              </Link>
            ))}

            <div className="pt-3 border-t border-[var(--border-default)]">
              {!user ? (
                <Link
                  href="/login"
                  className="block w-full text-center btn-primary py-2.5"
                >
                  Login
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full text-red-500 py-2.5 font-medium bg-red-50 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
