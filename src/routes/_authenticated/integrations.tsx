import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MessageSquare,
  CreditCard,
  Phone,
  Zap,
  Plug,
} from "lucide-react";
import { toast } from "sonner";

const ICONS: Record<string, typeof Mail> = {
  mail: Mail,
  "message-square": MessageSquare,
  "credit-card": CreditCard,
  phone: Phone,
  zap: Zap,
};

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({ meta: [{ title: "Integrações — Nexus" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const qc = useQueryClient();

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const { data } = await supabase.from("integrations").select("*").order("name");
      return data ?? [];
    },
  });

  const toggle = async (id: string, current: string) => {
    const next = current === "connected" ? "disconnected" : "connected";
    const { error } = await supabase.from("integrations").update({ status: next }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(next === "connected" ? "Integração conectada" : "Integração desconectada");
      qc.invalidateQueries({ queryKey: ["integrations"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  };

  return (
    <div>
      <PageHeader
        title="Integrações"
        description="Conecte o Nexus com as ferramentas que você já usa."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => {
          const Icon = ICONS[i.icon ?? ""] ?? Plug;
          const connected = i.status === "connected";
          return (
            <div key={i.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{i.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{i.provider}</div>
                  </div>
                </div>
                <Badge
                  variant={connected ? "default" : "secondary"}
                  className={connected ? "bg-success text-success-foreground" : ""}
                >
                  {connected ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
              <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                {i.description}
              </p>
              <div className="mt-4 flex justify-end">
                <Button
                  variant={connected ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggle(i.id, i.status)}
                >
                  {connected ? "Desconectar" : "Conectar"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
