import { AudioLines, Github, Globe, Waves, Cpu, BarChart2 } from "lucide-react";

export default function About() {
  return (
    <main className="min-h-screen bg-[color:var(--color-bg-primary)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-sky-50" />
        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100 mb-6">
            <AudioLines className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[color:var(--color-text-primary)] tracking-tight">
            EchoWeb
          </h1>
          <p className="mt-4 text-lg text-[color:var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Plataforma web para análise bioacústica e micrometeorológica de
            paisagens sonoras. Faça upload de gravações de campo, visualize
            espectrogramas interativos, aplique filtros em tempo real e extraia
            índices acústicos — tudo pelo navegador.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[color:var(--color-text-primary)] text-center mb-10">
          Principais Funcionalidades
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Waves className="w-6 h-6 text-teal-600" />}
            title="Espectrogramas Interativos"
            description="Visualize o áudio em tempo-frequência com cursor sincronizado, zoom e anotações (tags) diretamente sobre o espectrograma."
          />
          <FeatureCard
            icon={<BarChart2 className="w-6 h-6 text-sky-600" />}
            title="Índices Acústicos"
            description="Cálculo automático de ACI, ADI, Bioacoustic Index, NDSI e outros índices ecoacústicos amplamente usados na literatura."
          />
          <FeatureCard
            icon={<Cpu className="w-6 h-6 text-violet-600" />}
            title="Análise Micrometeorológica"
            description="Processamento paralelo de variáveis micrometeorológicas com gráficos de temperatura, umidade e pressão sonora."
          />
          <FeatureCard
            icon={<AudioLines className="w-6 h-6 text-amber-600" />}
            title="Filtros em Tempo Real"
            description="Filtros passa-baixa e passa-alta aplicados via Web Audio API durante a reprodução, com presets para bioacústica."
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6 text-emerald-600" />}
            title="100% Web"
            description="Nenhuma instalação necessária. Acesse de qualquer dispositivo com navegador moderno — desktop, tablet ou celular."
          />
          <FeatureCard
            icon={<Github className="w-6 h-6 text-gray-700" />}
            title="Código Aberto"
            description="Projeto acadêmico de código aberto. Contribuições, sugestões e feedback são sempre bem-vindos."
          />
        </div>
      </section>

      {/* Tech stack */}
      <section className="bg-[color:var(--color-bg-card)] border-y border-[color:var(--color-border)]">
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <h2 className="text-2xl font-bold text-[color:var(--color-text-primary)] mb-6">
            Stack Tecnológica
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Next.js",
              "React",
              "TypeScript",
              "Tailwind CSS",
              "Express.js",
              "Prisma",
              "MySQL",
              "RabbitMQ",
              "Python",
              "Docker",
              "Web Audio API",
            ].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-[color:var(--color-bg-primary)] text-[color:var(--color-text-secondary)] border border-[color:var(--color-border)]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer note */}
      <section className="max-w-4xl mx-auto px-6 py-14 text-center">
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Desenvolvido como projeto acadêmico · {new Date().getFullYear()}
        </p>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-5 hover:shadow-md transition-shadow">
      <div className="mb-3">{icon}</div>
      <h3 className="text-sm font-bold text-[color:var(--color-text-primary)] mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-[color:var(--color-text-muted)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
