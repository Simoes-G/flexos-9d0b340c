import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/permissions")({
  head: () => ({ meta: [{ title: "Permissões — Nexus" }] }),
  component: PermissionsPage,
});

const ROLES = ["admin", "manager", "member"] as const;

function PermissionsPage() {
  const qc = useQueryClient();
  const { data: perms = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("permissions")
        .select("*")
        .order("module")
        .order("role");
      return data ?? [];
    },
  });

  const modules = Array.from(new Set(perms.map((p) => p.module)));

  const toggle = async (id: string, field: "can_view" | "can_edit" | "can_delete", value: boolean) => {
    const { error } = await supabase.from("permissions").update({ [field]: value }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["permissions"] });
  };

  return (
    <div>
      <PageHeader
        title="Permissões"
        description="Defina o que cada papel pode fazer em cada módulo da plataforma."
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Módulo</th>
              <th className="px-4 py-3 text-left font-medium">Papel</th>
              <th className="px-4 py-3 text-center font-medium">Visualizar</th>
              <th className="px-4 py-3 text-center font-medium">Editar</th>
              <th className="px-4 py-3 text-center font-medium">Excluir</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) =>
              ROLES.map((r) => {
                const p = perms.find((x) => x.module === m && x.role === r);
                if (!p) return null;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium capitalize">{m}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{r}</td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={!!p.can_view}
                        onCheckedChange={(v) => toggle(p.id, "can_view", v)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={!!p.can_edit}
                        onCheckedChange={(v) => toggle(p.id, "can_edit", v)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={!!p.can_delete}
                        onCheckedChange={(v) => toggle(p.id, "can_delete", v)}
                      />
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
