import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import {
  Users,
  UsersRound,
  Plug,
  ArrowUpRight,
  Activity,
  Building2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Nexus" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [users, teams, integrations, company, audit] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase.from("integrations").select("id,status"),
        supabase.from("company").select("name").limit(1).maybeSingle(),
        supabase
          .from("audit_log")
          .select("id,action,entity,created_at,user_id")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      const connected =
        (integrations.data || []).filter((i: { status: string }) => i.status === "connected")
          .length;
      return {
        users: users.count ?? 0,
        teams: teams.count ?? 0,
        integrations: integrations.data?.length ?? 0,
        connected,
        company: company.data?.name ?? "Sua Empresa",
        audit: audit.data ?? [],
      };
    },
  });

  const kpis = [
    { label: "Usuários ativos", value: stats?.users ?? 0, icon: Users, hint: "Total na plataforma" },
    { label: "Equipes", value: stats?.teams ?? 0, icon: UsersRound, hint: "Grupos operacionais" },
    {
      label: "Integrações",
      value: `${stats?.connected ?? 0}/${stats?.integrations ?? 0}`,
      icon: Plug,
      hint: "Conectadas",
    },
    { label: "Saúde do sistema", value: "100%", icon: Activity, hint: "Todos os serviços" },
  ];

  const shortcuts = [
    { to: "/users", label: "Convidar usuário", desc: "Adicionar membro à empresa", icon: Users },
    { to: "/teams", label: "Criar equipe", desc: "Organizar por departamento", icon: UsersRound },
    { to: "/integrations", label: "Conectar app", desc: "Slack, Stripe e mais", icon: Plug },
    { to: "/company", label: "Editar empresa", desc: "Dados institucionais", icon: Building2 },
  ];

  return (
    <div>
      <PageHeader
        title={`Olá 👋 — ${stats?.company ?? ""}`}
        description="Visão geral da sua operação. Todos os módulos e áreas administrativas estão à sua disposição."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-xl border border-border bg-card p-5 shadow-sm/5"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight">{k.value}</div>
              <div className="text-sm text-foreground/80">{k.label}</div>
              <div className="text-xs text-muted-foreground">{k.hint}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Shortcuts */}
        <section className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Atalhos rápidos</h2>
              <p className="text-xs text-muted-foreground">Acesse rapidamente ações comuns</p>
            </div>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {shortcuts.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium">{s.label}</div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent activity */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Atividade recente</h2>
            <Link
              to="/audit"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver tudo
            </Link>
          </div>
          {stats?.audit?.length ? (
            <ul className="space-y-3">
              {stats.audit.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{a.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.entity ?? "Sistema"} •{" "}
                      {new Date(a.created_at as string).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
              Nenhuma atividade registrada ainda.
            </div>
          )}
        </section>
      </div>

      {/* Roadmap teaser */}
      <section className="mt-8 rounded-xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Próximos módulos
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {["Comercial", "Financeiro", "Estoque", "Projetos"].map((m) => (
            <div
              key={m}
              className="rounded-lg border border-border bg-background/70 p-4 text-sm"
            >
              <div className="font-medium">{m}</div>
              <div className="text-xs text-muted-foreground">Estrutura preparada</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
