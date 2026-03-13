"use client";

import React, { useContext, FormEvent, useState } from "react";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";
import { useRouter } from "next/navigation";
import { AudioLines, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import IconInput from "@/components/form/IconInput/IconInput";
import ErrorAlert from "@/components/ErrorAlert/ErrorAlert";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const success = await login(email, password);

    if (success) {
      router.push("/");
    } else {
      setError("E-mail ou senha incorretos. Verifique suas credenciais.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[var(--bg-primary)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex p-2.5 rounded-xl mb-4 bg-[var(--color-primary)]">
            <AudioLines className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Bem-vindo de volta
          </h1>
          <p className="text-sm mt-1.5 text-[var(--text-secondary)]">
            Acesse sua conta para gerenciar análises
          </p>
        </div>

        {/* Card */}
        <div className="card-eco p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <IconInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="exemplo@email.com"
              label="E-mail"
              icon={<Mail />}
              required
            />

            <IconInput
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              label="Senha"
              icon={<Lock />}
              required
              labelExtra={
                <Link
                  href="#"
                  className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              }
            />

            <ErrorAlert message={error} />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border-default)] text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Ainda não tem uma conta?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
              >
                Crie agora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
