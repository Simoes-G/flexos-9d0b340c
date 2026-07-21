import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentTenantId } from "@/hooks/use-tenant";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Bell, Check, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notificações — Nexus" }] }),
  component: NotificationsPage,
});

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
} as const;

function NotificationsPage() {
  const qc = useQueryClient();
  const tenantId = useCurrentTenantId();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const markAll = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false)
      .or(`user_id.eq.${u.user.id},user_id.is.null`);
    if (error) toast.error(error.message);
    else {
      toast.success("Todas marcadas como lidas");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    }
  };

  const createDemo = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !tenantId) return;
    const types = ["info", "success", "warning"] as const;
    const t = types[Math.floor(Math.random() * types.length)];
    await supabase.from("notifications").insert({
      tenant_id: tenantId,
      user_id: u.user.id,
      title: "Nova notificação",
      message: "Esta é uma notificação de teste criada agora.",
      type: t,
    });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications-unread"] });
  };

  return (
    <div>
      <PageHeader
        title="Central de Notificações"
        description="Acompanhe eventos importantes da plataforma e da sua empresa."
        actions={
          <>
            <Button variant="outline" onClick={createDemo}>
              <Bell className="mr-2 h-4 w-4" /> Criar demo
            </Button>
            <Button onClick={markAll}>
              <Check className="mr-2 h-4 w-4" /> Marcar tudo lido
            </Button>
          </>
        }
      />

      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = ICONS[(n.type as keyof typeof ICONS) ?? "info"] ?? Info;
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-lg border border-border bg-card p-4 ${
                !n.read ? "border-l-4 border-l-primary" : ""
              }`}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(n.created_at as string).toLocaleString("pt-BR")}
                  </div>
                </div>
                {n.message && (
                  <div className="mt-0.5 text-sm text-muted-foreground">{n.message}</div>
                )}
              </div>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhuma notificação por enquanto.
          </div>
        )}
      </div>
    </div>
  );
}
