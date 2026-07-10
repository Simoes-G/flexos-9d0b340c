import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Globe, Palette, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — Nexus" }] }),
  component: SettingsPage,
});

const SECTIONS = [
  {
    icon: Bell,
    title: "Notificações",
    items: [
      { key: "email", label: "Notificações por e-mail", desc: "Receba atualizações no seu e-mail" },
      { key: "push", label: "Notificações do sistema", desc: "Alertas dentro da plataforma" },
    ],
  },
  {
    icon: Palette,
    title: "Aparência",
    items: [
      { key: "compact", label: "Modo compacto", desc: "Reduza espaçamentos das listas" },
      { key: "animations", label: "Animações", desc: "Ative transições suaves" },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    items: [
      { key: "2fa", label: "Autenticação em dois fatores", desc: "Camada extra de segurança" },
      { key: "sessions", label: "Sessões ativas", desc: "Encerrar automaticamente após inatividade" },
    ],
  },
  {
    icon: Globe,
    title: "Regional",
    items: [
      { key: "locale", label: "Idioma pt-BR", desc: "Português (Brasil)" },
      { key: "tz", label: "Fuso horário automático", desc: "Baseado no seu dispositivo" },
    ],
  },
];

function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Configurações gerais"
        description="Personalize sua experiência e ajustes globais da plataforma."
      />

      <div className="space-y-6">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <section key={s.title} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold">{s.title}</h2>
              </div>
              <div className="space-y-4">
                {s.items.map((it) => (
                  <div key={it.key} className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-sm font-medium">{it.label}</Label>
                      <div className="text-xs text-muted-foreground">{it.desc}</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
