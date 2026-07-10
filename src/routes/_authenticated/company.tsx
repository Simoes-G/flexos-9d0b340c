import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/company")({
  head: () => ({ meta: [{ title: "Empresa — Nexus" }] }),
  component: CompanyPage,
});

function CompanyPage() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: company } = useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const { data } = await supabase
        .from("company")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (company) setForm(company as Record<string, string>);
  }, [company]);

  const fields: { key: string; label: string; col?: number; textarea?: boolean }[] = [
    { key: "name", label: "Nome fantasia" },
    { key: "legal_name", label: "Razão social" },
    { key: "tax_id", label: "CNPJ" },
    { key: "industry", label: "Segmento" },
    { key: "email", label: "E-mail corporativo" },
    { key: "phone", label: "Telefone" },
    { key: "website", label: "Website" },
    { key: "address", label: "Endereço" },
    { key: "city", label: "Cidade" },
    { key: "state", label: "Estado" },
    { key: "country", label: "País" },
    { key: "description", label: "Descrição", col: 2, textarea: true },
  ];

  const save = async () => {
    if (!company?.id) return;
    setSaving(true);
    const payload: Record<string, string> = {};
    fields.forEach((f) => (payload[f.key] = form[f.key] ?? ""));
    const { error } = await supabase.from("company").update(payload).eq("id", company.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Empresa atualizada");
      qc.invalidateQueries({ queryKey: ["company"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  };

  return (
    <div>
      <PageHeader
        title="Gestão da Empresa"
        description="Configure as informações institucionais da sua empresa. Estes dados serão usados em toda a plataforma."
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">{form.name || "Sem nome"}</div>
            <div className="text-xs text-muted-foreground">
              {form.legal_name || "Configure os dados jurídicos"}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.col === 2 ? "md:col-span-2" : ""}>
              <Label htmlFor={f.key}>{f.label}</Label>
              {f.textarea ? (
                <Textarea
                  id={f.key}
                  rows={3}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              ) : (
                <Input
                  id={f.key}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
