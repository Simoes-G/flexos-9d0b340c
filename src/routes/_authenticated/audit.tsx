import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Auditoria — Nexus" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { data: logs = [] } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Registro imutável de ações realizadas na plataforma."
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Quando</th>
              <th className="px-4 py-3 text-left font-medium">Ação</th>
              <th className="px-4 py-3 text-left font-medium">Entidade</th>
              <th className="px-4 py-3 text-left font-medium">Usuário</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(l.created_at as string).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3 font-medium">{l.action}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {l.entity ?? "—"} {l.entity_id ? `#${String(l.entity_id).slice(0, 6)}` : ""}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {l.user_id ? String(l.user_id).slice(0, 8) : "sistema"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-sm text-muted-foreground">
                  <ScrollText className="mx-auto mb-2 h-6 w-6 opacity-50" />
                  Nenhum evento registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
