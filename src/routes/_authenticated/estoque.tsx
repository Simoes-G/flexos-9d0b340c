import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentTenantId } from "@/hooks/use-tenant";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Boxes, Plus, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Search, Trash2, Pencil, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({ meta: [{ title: "Estoque — Nexus" }] }),
  component: EstoquePage,
});

type Product = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  active: boolean;
};

type Category = { id: string; name: string; color: string | null };
type Movement = {
  id: string;
  product_id: string;
  movement_type: "in" | "out" | "adjust";
  quantity: number;
  reason: string | null;
  reference: string | null;
  created_at: string;
};

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function EstoquePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["product_categories"],
    queryFn: async () => {
      const { data } = await supabase.from("product_categories").select("*").order("name");
      return (data ?? []) as Category[];
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["stock_movements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as Movement[];
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.sku ?? "").toLowerCase().includes(s) ||
        (p.description ?? "").toLowerCase().includes(s),
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter((p) => p.stock_quantity <= p.min_stock).length;
    const totalValue = products.reduce((acc, p) => acc + p.cost_price * p.stock_quantity, 0);
    const outOfStock = products.filter((p) => p.stock_quantity <= 0).length;
    return { total, lowStock, totalValue, outOfStock };
  }, [products]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["stock_movements"] });
    qc.invalidateQueries({ queryKey: ["product_categories"] });
  };

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Cadastre produtos, controle saldos e registre movimentações."
        actions={
          <>
            <CategoryDialog onDone={invalidateAll} categories={categories} />
            <ProductDialog onDone={invalidateAll} categories={categories} />
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Produtos" value={String(stats.total)} icon={Package} tone="default" />
        <StatCard
          label="Valor em estoque"
          value={formatBRL(stats.totalValue)}
          icon={Boxes}
          tone="default"
        />
        <StatCard
          label="Estoque baixo"
          value={String(stats.lowStock)}
          icon={AlertTriangle}
          tone={stats.lowStock > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Sem estoque"
          value={String(stats.outOfStock)}
          icon={ArrowDownCircle}
          tone={stats.outOfStock > 0 ? "danger" : "default"}
        />
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar por nome, SKU ou descrição..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead className="w-[220px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      Nenhum produto cadastrado ainda.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((p) => {
                  const cat = categories.find((c) => c.id === p.category_id);
                  const low = p.stock_quantity <= p.min_stock;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        {p.description && (
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {p.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.sku || "—"}</TableCell>
                      <TableCell>
                        {cat ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                            style={{
                              backgroundColor: (cat.color ?? "#6366f1") + "22",
                              color: cat.color ?? "#6366f1",
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: cat.color ?? "#6366f1" }}
                            />
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={low ? "text-warning font-medium" : ""}>
                            {p.stock_quantity} {p.unit}
                          </span>
                          {low && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatBRL(p.cost_price)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatBRL(p.sale_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <MovementDialog product={p} type="in" onDone={invalidateAll} />
                          <MovementDialog product={p} type="out" onDone={invalidateAll} />
                          <ProductDialog
                            product={p}
                            categories={categories}
                            onDone={invalidateAll}
                            trigger={
                              <Button size="icon" variant="ghost" title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Excluir"
                            onClick={async () => {
                              if (!confirm(`Excluir "${p.name}"?`)) return;
                              const { error } = await supabase.from("products").delete().eq("id", p.id);
                              if (error) toast.error(error.message);
                              else {
                                toast.success("Produto excluído");
                                invalidateAll();
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Referência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Nenhuma movimentação registrada.
                    </TableCell>
                  </TableRow>
                )}
                {movements.map((m) => {
                  const p = products.find((x) => x.id === m.product_id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-medium">{p?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            m.movement_type === "in"
                              ? "bg-success/15 text-success"
                              : m.movement_type === "out"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-muted"
                          }
                        >
                          {m.movement_type === "in"
                            ? "Entrada"
                            : m.movement_type === "out"
                              ? "Saída"
                              : "Ajuste"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {m.movement_type === "in" ? "+" : m.movement_type === "out" ? "-" : "="}
                        {m.quantity}
                      </TableCell>
                      <TableCell className="text-sm">{m.reason || "—"}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {m.reference || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Nenhuma categoria criada.
              </div>
            )}
            {categories.map((c) => {
              const count = products.filter((p) => p.category_id === c.id).length;
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-8 w-8 rounded-lg"
                      style={{ backgroundColor: (c.color ?? "#6366f1") + "33" }}
                    >
                      <span
                        className="mx-auto mt-2 block h-4 w-4 rounded"
                        style={{ backgroundColor: c.color ?? "#6366f1" }}
                      />
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {count} produto{count === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (!confirm(`Excluir categoria "${c.name}"?`)) return;
                      const { error } = await supabase
                        .from("product_categories")
                        .delete()
                        .eq("id", c.id);
                      if (error) toast.error(error.message);
                      else {
                        toast.success("Categoria excluída");
                        invalidateAll();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Boxes;
  tone: "default" | "warning" | "danger";
}) {
  const tones = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning",
    danger: "bg-destructive/15 text-destructive",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function ProductDialog({
  product,
  categories,
  onDone,
  trigger,
}: {
  product?: Product;
  categories: Category[];
  onDone: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? "",
    unit: product?.unit ?? "un",
    cost_price: product?.cost_price ?? 0,
    sale_price: product?.sale_price ?? 0,
    stock_quantity: product?.stock_quantity ?? 0,
    min_stock: product?.min_stock ?? 0,
  });
  const tenantId = useCurrentTenantId();

  const save = async () => {
    if (!form.name.trim()) return toast.error("Informe o nome do produto");
    if (!tenantId) return toast.error("Tenant não encontrado");
    const payload = {
      tenant_id: tenantId,
      name: form.name,
      sku: form.sku || null,
      description: form.description || null,
      category_id: form.category_id || null,
      unit: form.unit,
      cost_price: Number(form.cost_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      stock_quantity: Number(form.stock_quantity) || 0,
      min_stock: Number(form.min_stock) || 0,
    };
    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(product ? "Produto atualizado" : "Produto criado");
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Novo produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>SKU</Label>
            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div>
            <Label>Unidade</Label>
            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Categoria</Label>
            <Select
              value={form.category_id || "none"}
              onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}
            >
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Custo</Label>
            <Input
              type="number"
              step="0.01"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Venda</Label>
            <Input
              type="number"
              step="0.01"
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Estoque inicial</Label>
            <Input
              type="number"
              step="0.001"
              disabled={!!product}
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
            />
            {product && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Para alterar o saldo, use uma movimentação.
              </p>
            )}
          </div>
          <div>
            <Label>Estoque mínimo</Label>
            <Input
              type="number"
              step="0.001"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({
  categories,
  onDone,
}: {
  categories: Category[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const tenantId = useCurrentTenantId();

  const save = async () => {
    if (!name.trim()) return;
    if (!tenantId) return toast.error("Tenant não encontrado");
    const { error } = await supabase.from("product_categories").insert({ name, color, tenant_id: tenantId });
    if (error) return toast.error(error.message);
    toast.success("Categoria criada");
    setName("");
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Nova categoria {categories.length > 0 && `(${categories.length})`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Cor</Label>
            <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-24" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MovementDialog({
  product,
  type,
  onDone,
}: {
  product: Product;
  type: "in" | "out";
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const tenantId = useCurrentTenantId();

  const save = async () => {
    if (qty <= 0) return toast.error("Quantidade inválida");
    if (!tenantId) return toast.error("Tenant não encontrado");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("stock_movements").insert({
      tenant_id: tenantId,
      product_id: product.id,
      movement_type: type,
      quantity: qty,
      reason: reason || null,
      reference: reference || null,
      user_id: u.user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success(type === "in" ? "Entrada registrada" : "Saída registrada");
    setOpen(false);
    setQty(1);
    setReason("");
    setReference("");
    onDone();
  };

  const Icon = type === "in" ? ArrowUpCircle : ArrowDownCircle;
  const color = type === "in" ? "text-success" : "text-destructive";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title={type === "in" ? "Entrada" : "Saída"}>
          <Icon className={`h-4 w-4 ${color}`} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "in" ? "Entrada" : "Saída"} — {product.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Quantidade ({product.unit})</Label>
            <Input
              type="number"
              step="0.001"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Estoque atual: {product.stock_quantity} {product.unit}
            </p>
          </div>
          <div>
            <Label>Motivo</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Compra, venda, ajuste..." />
          </div>
          <div>
            <Label>Referência</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="NF-001, Pedido #123..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
