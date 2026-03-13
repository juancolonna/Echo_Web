'use client'

import React from "react";
import Link from "next/link";
import { 
  AudioLines, 
  Mic, 
  Cpu, 
  ShieldCheck, 
  ArrowRight,
  BarChart3,
  Globe,
  Waves
} from "lucide-react";

export default function Home() {
  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen font-sans">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-24 border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="badge mb-6">
              <AudioLines className="w-3 h-3" /> Plataforma Bioacústica
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] text-[var(--text-primary)]">
              Decifrando a Sinfonia da Natureza
            </h1>
            
            <p className="max-w-2xl mx-auto text-[var(--text-secondary)] text-base md:text-lg mb-10 leading-relaxed">
              Do monitoramento autônomo em campo com <strong className="text-[var(--text-primary)]">EchoLogger</strong> à análise profunda baseada em IA com <strong className="text-[var(--text-primary)]">EchoWeb</strong>. Transformamos som em conservação.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/analysis" className="btn-primary flex items-center gap-2 group w-full sm:w-auto justify-center">
                Explorar Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="#ecossistema" className="btn-secondary w-full sm:w-auto text-center">
                Saiba mais
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- ECOSSISTEMA SECTION --- */}
      <section id="ecossistema" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center lg:text-left">
            <p className="text-xs uppercase tracking-widest font-semibold text-[var(--color-primary)] mb-2">O Ecossistema</p>
            <h2 className="text-3xl font-bold tracking-tight">Um fluxo contínuo de dados.</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EchoLogger */}
            <div className="card-eco">
              <div className="bg-[var(--color-primary)] p-2.5 w-fit rounded-lg mb-6">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                EchoLogger <span className="text-[var(--color-primary)] font-mono text-xs ml-1">V3.0</span>
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6 text-sm">
                Hardware de monitoramento acústico autônomo. Projetado para suportar os ambientes mais extremos, da Amazônia ao Ártico.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm text-[var(--text-secondary)]">
                <FeatureBadge text="IP68 Waterproof" />
                <FeatureBadge text="24-bit/192kHz" />
                <FeatureBadge text="6 Months Battery" />
                <FeatureBadge text="GPS Tagging" />
              </div>
            </div>

            {/* EchoWeb */}
            <div className="card-eco">
              <div className="bg-[var(--color-primary)] p-2.5 w-fit rounded-lg mb-6">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                EchoWeb <span className="text-[var(--color-primary)] font-mono text-xs ml-1">SaaS</span>
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6 text-sm">
                Plataforma de inteligência bioacústica. Analise terabytes de áudio instantaneamente com nossos modelos de Deep Learning.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm text-[var(--text-secondary)]">
                <FeatureBadge text="Ecological Indices" />
                <FeatureBadge text="Species ID AI" />
                <FeatureBadge text="Cloud Processing" />
                <FeatureBadge text="R/Python API" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- RECURSOS EM GRID --- */}
      <section className="py-20 border-t border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureItem 
              icon={<Cpu className="w-6 h-6" />}
              title="Processamento Neural"
              desc="Nossos algoritmos identificam padrões sonoros imperceptíveis ao ouvido humano com precisão de 98%."
            />
            <FeatureItem 
              icon={<Globe className="w-6 h-6" />}
              title="Escala Global"
              desc="Monitore ecossistemas inteiros de qualquer lugar do mundo com nossa infraestrutura escalável."
            />
            <FeatureItem 
              icon={<Waves className="w-6 h-6" />}
              title="Visualização HD"
              desc="Espectrogramas de alta resolução e gráficos interativos para publicações científicas."
            />
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-[var(--color-primary)] rounded-2xl px-8 py-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para liderar o futuro da conservação?
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/analysis" className="px-8 py-3 bg-white text-[var(--color-primary)] font-bold rounded-lg hover:bg-gray-50 transition-colors">
                Começar Agora
              </Link>
              <button className="px-8 py-3 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/30">
                Falar com Especialista
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-[var(--border-default)] text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <AudioLines className="w-5 h-5 text-[var(--color-primary)]" />
          <span className="text-[var(--text-primary)] font-bold tracking-tight">
            EchoWeb
          </span>
        </div>
        <p className="text-[var(--text-muted)] text-xs">
          © 2024 EchoWeb. Science for a better world.
        </p>
      </footer>
    </div>
  );
}

function FeatureBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="card-eco flex flex-col items-start text-left">
      <div className="text-[var(--color-primary)] mb-4 p-3 bg-[var(--color-primary-glow)] rounded-lg">
        {icon}
      </div>
      <h4 className="text-lg font-bold mb-2">{title}</h4>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
    </div>
  );
}
