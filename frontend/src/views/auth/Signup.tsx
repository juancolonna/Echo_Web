"use client";

import React, { FormEvent, useContext, useState } from "react";
import { AuthContext } from "@/providers/AuthProvider/AuthProvider";
import { useRouter } from "next/navigation";
import { AudioLines, Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import IconInput from "@/components/form/IconInput/IconInput";
import ErrorAlert from "@/components/ErrorAlert/ErrorAlert";

function Signup() {
  const { signup } = useContext(AuthContext);
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    const success = await signup(name, email, password);

    if (success) {
      router.push("/login");
    } else {
      setError("Erro ao criar conta. Verifique os dados.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[var(--bg-primary)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-2.5 rounded-xl mb-4 bg-[var(--color-primary)]">
            <AudioLines className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Criar conta
          </h1>
          <p className="text-sm mt-1.5 text-[var(--text-secondary)]">
            Preencha os dados para se cadastrar
          </p>
        </div>

        {/* Card */}
        <div className="card-eco p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <IconInput
              type="text"
              value={name}
              onChange={setName}
              placeholder="Seu nome"
              label="Nome"
              icon={<User />}
              required
            />

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
            />

            <IconInput
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="••••••••"
              label="Confirmar senha"
              icon={<Lock />}
              required
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
                  Criar conta
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border-default)] text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
