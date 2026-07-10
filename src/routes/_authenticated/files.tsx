import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/files")({
  head: () => ({ meta: [{ title: "Arquivos — Nexus" }] }),
  component: FilesPage,
});

function FilesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "general", url: "" });

  const { data: files = [] } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const { data } = await supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const add = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (!form.name) return toast.error("Informe o nome do arquivo");
    const { error } = await supabase.from("files").insert({ ...form, uploaded_by: u.user.id });
    if (error) toast.error(error.message);
    else {
      toast.success("Arquivo registrado");
      setOpen(false);
      setForm({ name: "", description: "", category: "general", url: "" });
      qc.invalidateQueries({ queryKey: ["files"] });
    }
  };

  return (
    <div>
      <PageHeader
        title="Central de Arquivos"
        description="Catálogo de documentos e recursos compartilhados com sua equipe."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" /> Adicionar arquivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo arquivo</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label>URL</Label>
                  <Input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={add}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((f) => (
          <a
            key={f.id}
            href={f.url || "#"}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{f.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {f.category} • {new Date(f.created_at as string).toLocaleDateString("pt-BR")}
              </div>
              {f.description && (
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {f.description}
                </div>
              )}
            </div>
          </a>
        ))}
        {files.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum arquivo por aqui ainda.
          </div>
        )}
      </div>
    </div>
  );
}
