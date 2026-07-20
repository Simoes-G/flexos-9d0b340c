import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Wrench, Plus, Trash2, Package, Users2 } from "lucide-react";
import {
  listServiceOrders,
  listServiceCatalog,
  listServiceClients,
  createServiceOrder,
  updateServiceOrderStatus,
  getServiceOrder,
  upsertServiceCatalog,
  upsertServiceClient,
} from "@/lib/services.functions";

export const Route = createFileRoute("/_authenticated/servicos")({
  head: () => ({ meta: [{ title: "Serviços — Nexus" }] }),
  component: ServicosPage,
});

const STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  in_progress: "Em execução",
  completed: "Concluída",
  cancelled: "Cancelada",
};
const STATUS_CLR: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-500",
  in_progress: "bg-amber-500/15 text-amber-500",
  completed: "bg-emerald-500/15 text-emerald-500",
  cancelled: "bg-rose-500/15 text-rose-500",
};

function fmtMoney(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ServicosPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listServiceOrders);
  const catFn = useServerFn(listServiceCatalog);
  const cliFn = useServerFn(listServiceClients);

  const [tab, setTab] = useState<"orders" | "catalog" | "clients">("orders");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showCat, setShowCat] = useState(false);
  const [showCli, setShowCli] = useState(false);

  const orders = useQuery({ queryKey: ["service-orders"], queryFn: () => listFn({}) });
  const catalog = useQuery({ queryKey: ["service-catalog"], queryFn: () => catFn({}) });
  const clients = useQuery({ queryKey: ["service-clients"], queryFn: () => cliFn({}) });

  const filtered = (orders.data ?? []).filter(
    (o: { status: string }) => statusFilter === "all" || o.status === statusFilter,
  );

  return (
    <div>
      <PageHeader
        title="Serviços"
        description="Ordens de serviço, catálogo e clientes."
        icon={Wrench}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
          {(
            [
              { k: "orders", l: "Ordens", i: Wrench },
              { k: "catalog", l: "Catálogo", i: Package },
              { k: "clients", l: "Clientes", i: Users2 },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 ${tab === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <t.i className="h-3.5 w-3.5" />
              {t.l}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {tab === "orders" && (
            <>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setShowNew(true)}>
                <Plus className="mr-1 h-4 w-4" /> Nova OS
              </Button>
            </>
          )}
          {tab === "catalog" && (
            <Button onClick={() => setShowCat(true)}>
              <Plus className="mr-1 h-4 w-4" /> Novo serviço
            </Button>
          )}
          {tab === "clients" && (
            <Button onClick={() => setShowCli(true)}>
              <Plus className="mr-1 h-4 w-4" /> Novo cliente
            </Button>
          )}
        </div>
      </div>

      {tab === "orders" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Responsável</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Aberta</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhuma OS encontrada.
                  </td>
                </tr>
              )}
              {filtered.map((o: any) => (
                <tr
                  key={o.id}
                  onClick={() => setOpenId(o.id)}
                  className="cursor-pointer border-t border-border hover:bg-accent"
                >
                  <td className="px-4 py-3 font-medium">{o.number}</td>
                  <td className="px-4 py-3">{o.client?.name ?? "—"}</td>
                  <td className="px-4 py-3">{o.assignee?.full_name ?? o.assignee?.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLR[o.status]}`}
                    >
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(o.opened_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{fmtMoney(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "catalog" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(catalog.data ?? []).map((s: any) => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.duration_minutes} min · {s.active ? "Ativo" : "Inativo"}
                  </div>
                </div>
                <div className="text-sm font-semibold">{fmtMoney(s.base_price)}</div>
              </div>
              {s.description && (
                <p className="mt-2 text-xs text-muted-foreground">{s.description}</p>
              )}
            </div>
          ))}
          {(catalog.data ?? []).length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhum serviço cadastrado.
            </div>
          )}
        </div>
      )}

      {tab === "clients" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Documento</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Telefone</th>
              </tr>
            </thead>
            <tbody>
              {(clients.data ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.document ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                </tr>
              ))}
              {(clients.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {openId && (
        <OrderDetail id={openId} onClose={() => setOpenId(null)} onChange={() => qc.invalidateQueries({ queryKey: ["service-orders"] })} />
      )}
      {showNew && (
        <NewOrderDialog
          catalog={catalog.data ?? []}
          clients={clients.data ?? []}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["service-orders"] });
            setShowNew(false);
          }}
        />
      )}
      {showCat && (
        <CatalogDialog
          onClose={() => setShowCat(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["service-catalog"] });
            setShowCat(false);
          }}
        />
      )}
      {showCli && (
        <ClientDialog
          onClose={() => setShowCli(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["service-clients"] });
            setShowCli(false);
          }}
        />
      )}
    </div>
  );
}

function OrderDetail({
  id,
  onClose,
  onChange,
}: {
  id: string;
  onClose: () => void;
  onChange: () => void;
}) {
  const getFn = useServerFn(getServiceOrder);
  const statusFn = useServerFn(updateServiceOrderStatus);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["service-order", id],
    queryFn: () => getFn({ data: { id } }),
  });
  const mut = useMutation({
    mutationFn: (status: "open" | "in_progress" | "completed" | "cancelled") =>
      statusFn({ data: { id, status } }),
    onSuccess: () => {
      toast.success("Status atualizado");
      refetch();
      onChange();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{data?.order?.number ?? "OS"}</SheetTitle>
        </SheetHeader>
        {isLoading || !data?.order ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Carregando…</div>
        ) : (
          <div className="mt-4 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Cliente" value={data.order.client?.name ?? "—"} />
              <Info
                label="Responsável"
                value={data.order.assignee?.full_name ?? data.order.assignee?.email ?? "—"}
              />
              <Info label="Aberta em" value={new Date(data.order.opened_at).toLocaleString("pt-BR")} />
              <Info
                label="Prazo"
                value={data.order.due_at ? new Date(data.order.due_at).toLocaleString("pt-BR") : "—"}
              />
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Status</div>
              <Select
                value={data.order.status}
                onValueChange={(v) => mut.mutate(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">Itens</div>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {data.items.map((it: any) => (
                      <tr key={it.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{it.description}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {it.quantity} × {fmtMoney(it.unit_price)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{fmtMoney(it.subtotal)}</td>
                      </tr>
                    ))}
                    {data.items.length === 0 && (
                      <tr>
                        <td className="px-3 py-4 text-center text-muted-foreground" colSpan={3}>
                          Sem itens
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span>{fmtMoney(data.order.total)}</span>
              </div>
            </div>

            {data.order.notes && (
              <div>
                <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  Observações
                </div>
                <p className="rounded-md bg-muted p-3 text-sm">{data.order.notes}</p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function NewOrderDialog({
  catalog,
  clients,
  onClose,
  onCreated,
}: {
  catalog: any[];
  clients: any[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const createFn = useServerFn(createServiceOrder);
  const [clientId, setClientId] = useState<string>("");
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<
    { service_id: string; description: string; quantity: number; unit_price: number }[]
  >([]);

  const addItem = (serviceId: string) => {
    const s = catalog.find((c) => c.id === serviceId);
    if (!s) return;
    setItems((prev) => [
      ...prev,
      { service_id: s.id, description: s.name, quantity: 1, unit_price: Number(s.base_price) },
    ]);
  };

  const submit = async () => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }
    try {
      await createFn({
        data: {
          client_id: clientId || null,
          due_at: dueAt ? new Date(dueAt).toISOString() : null,
          notes: notes || null,
          items,
        },
      });
      toast.success("OS criada");
      onCreated();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const total = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Cliente</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Prazo</label>
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Adicionar serviço</label>
            <Select onValueChange={addItem} value="">
              <SelectTrigger>
                <SelectValue placeholder="Selecione um serviço do catálogo" />
              </SelectTrigger>
              <SelectContent>
                {catalog
                  .filter((c) => c.active)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {fmtMoney(c.base_price)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {items.length > 0 && (
              <div className="mt-3 space-y-2">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md border border-border bg-background p-2"
                  >
                    <span className="flex-1 truncate text-sm">{it.description}</span>
                    <Input
                      type="number"
                      className="w-16"
                      value={it.quantity}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((x, ix) => (ix === i ? { ...x, quantity: Number(e.target.value) } : x)),
                        )
                      }
                    />
                    <Input
                      type="number"
                      className="w-24"
                      value={it.unit_price}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((x, ix) =>
                            ix === i ? { ...x, unit_price: Number(e.target.value) } : x,
                          ),
                        )
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setItems((p) => p.filter((_, ix) => ix !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="text-right text-sm font-semibold">Total: {fmtMoney(total)}</div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Observações</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit}>Criar OS</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CatalogDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const fn = useServerFn(upsertServiceCatalog);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [duration, setDuration] = useState(60);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo serviço</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Preço"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <Input
              type="number"
              placeholder="Duração (min)"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (!name) return toast.error("Nome obrigatório");
              try {
                await fn({
                  data: {
                    name,
                    description,
                    base_price: price,
                    duration_minutes: duration,
                    active: true,
                  },
                });
                toast.success("Serviço salvo");
                onSaved();
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClientDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const fn = useServerFn(upsertServiceClient);
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Documento (CPF/CNPJ)" value={document} onChange={(e) => setDocument(e.target.value)} />
          <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (!name) return toast.error("Nome obrigatório");
              try {
                await fn({ data: { name, document, email, phone } });
                toast.success("Cliente salvo");
                onSaved();
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
