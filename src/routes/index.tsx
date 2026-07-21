import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Boxes, ClipboardList, Calendar, BarChart3, Bot, ShieldCheck, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus — Gestão empresarial completa em um só lugar" },
      { name: "description", content: "Plataforma SaaS de gestão empresarial: estoque, serviços, agenda, relatórios, equipes e IA embarcada. Comece agora." },
      { property: "og:title", content: "Nexus — Gestão empresarial completa em um só lugar" },
      { property: "og:description", content: "Estoque, ordens de serviço, agenda, relatórios e IA — tudo integrado. R$ 79/mês." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Nexus</span>
          </div>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Recursos</a>
            <a href="#pricing" className="hover:text-foreground">Planos</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <Link to="/signup">
              <Button size="sm">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[80%] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Feito para PMEs que querem crescer
          </div>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight md:text-6xl">
            Uma plataforma. <br />
            <span className="text-primary">Toda a sua operação.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Estoque, ordens de serviço, agenda, relatórios, equipes e IA — integrados,
            do dia 1. Configure em minutos, escale sem esforço.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Criar minha conta <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline">Ver planos</Button>
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Demo: <span className="font-mono">user@user.com</span> / <span className="font-mono">user123</span>
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-card/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Tudo que sua empresa precisa</h2>
            <p className="mt-3 text-muted-foreground">
              Módulos que conversam entre si, com dados unificados e uma interface moderna.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Boxes, title: "Estoque completo", desc: "Produtos, categorias, entradas/saídas e alertas de estoque baixo." },
              { icon: ClipboardList, title: "Ordens de Serviço", desc: "Catálogo, clientes e OS com numeração automática e status." },
              { icon: Calendar, title: "Agenda", desc: "Calendário mensal, próximos eventos e organização por cores." },
              { icon: BarChart3, title: "Relatórios", desc: "Faturamento por serviço, responsável e status — com CSV." },
              { icon: Bot, title: "IA embarcada", desc: "Assistente contextual que enxerga seus dados em tempo real." },
              { icon: ShieldCheck, title: "Multi-tenant seguro", desc: "Cada empresa tem seu espaço isolado, com permissões por papel." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-background p-6">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Um plano, transparente</h2>
            <p className="mt-3 text-muted-foreground">Pague apenas pelo que precisa. Sem surpresas.</p>
          </div>
          <div className="mt-12 rounded-2xl border border-primary/40 bg-card p-8 shadow-lg">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-primary">Nexus Base</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tight">R$ 79</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Inclui 3 administradores. R$ 30/mês por administrador extra.
                </p>
              </div>
              <Link to="/signup">
                <Button size="lg">Começar agora</Button>
              </Link>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Todos os módulos incluídos",
                "Subdomínio dedicado",
                "IA embarcada com Gemini",
                "Relatórios e exportação CSV",
                "Auditoria completa",
                "Suporte por e-mail",
              ].map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" /> {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Perguntas frequentes</h2>
          <div className="mt-10 space-y-4">
            {[
              { q: "Posso testar antes de pagar?", a: "Sim. Ao criar sua conta você já entra na plataforma completa. A cobrança é ativada quando você optar pelo plano." },
              { q: "Meus dados ficam isolados?", a: "Sim. Cada empresa tem seu próprio espaço (tenant) com regras de acesso a nível de linha no banco de dados." },
              { q: "Como funcionam os administradores?", a: "Você pode convidar até 3 administradores no plano base. Cada admin extra custa R$ 30/mês." },
              { q: "Posso cancelar quando quiser?", a: "Sim. Sem multa, sem fidelidade. Cancele quando fizer sentido para o seu negócio." },
            ].map((f) => (
              <div key={f.q} className="rounded-xl border border-border bg-card p-5">
                <div className="font-medium">{f.q}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nexus. Todos os direitos reservados.
      </footer>
    </div>
  );
}
