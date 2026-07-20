import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Catálogo ----------
export const listServiceCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("service_catalog")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertServiceCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      id?: string;
      name: string;
      description?: string | null;
      base_price: number;
      duration_minutes: number;
      active: boolean;
    }) => i,
  )
  .handler(async ({ data, context }) => {
    const payload = { ...data, created_by: context.userId };
    const { data: row, error } = await context.supabase
      .from("service_catalog")
      .upsert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Clientes ----------
export const listServiceClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("service_clients")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertServiceClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      id?: string;
      name: string;
      document?: string | null;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
    }) => i,
  )
  .handler(async ({ data, context }) => {
    const payload = { ...data, created_by: context.userId };
    const { data: row, error } = await context.supabase
      .from("service_clients")
      .upsert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Ordens de Serviço ----------
export const listServiceOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("service_orders")
      .select("*, client:service_clients(id,name)")
      .order("opened_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((data ?? []).map((o) => o.assignee_id).filter(Boolean))) as string[];
    let profMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (ids.length) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      profMap = new Map((profs ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }]));
    }
    return (data ?? []).map((o) => ({
      ...o,
      assignee: o.assignee_id ? profMap.get(o.assignee_id) ?? null : null,
    }));
  });

export const getServiceOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const [{ data: order, error: e1 }, { data: items, error: e2 }] = await Promise.all([
      context.supabase
        .from("service_orders")
        .select("*, client:service_clients(id,name,email,phone)")
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("service_order_items")
        .select("*, service:service_catalog(id,name)")
        .eq("order_id", data.id)
        .order("created_at"),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    let assignee: { full_name: string | null; email: string | null } | null = null;
    if (order?.assignee_id) {
      const { data: p } = await context.supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", order.assignee_id)
        .maybeSingle();
      assignee = p ? { full_name: p.full_name, email: p.email } : null;
    }
    return { order: order ? { ...order, assignee } : null, items: items ?? [] };
  });

export const createServiceOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: {
      client_id?: string | null;
      assignee_id?: string | null;
      due_at?: string | null;
      notes?: string | null;
      items: { service_id?: string | null; description: string; quantity: number; unit_price: number }[];
    }) => i,
  )
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("service_orders")
      .insert({
        client_id: data.client_id ?? null,
        assignee_id: data.assignee_id ?? null,
        due_at: data.due_at ?? null,
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data.items.length) {
      const { error: e2 } = await context.supabase.from("service_order_items").insert(
        data.items.map((it) => ({
          order_id: order.id,
          service_id: it.service_id ?? null,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      );
      if (e2) throw new Error(e2.message);
    }
    await context.supabase.from("audit_log").insert({
      action: `OS ${order.number} criada`,
      entity: "service_orders",
      entity_id: order.id,
      user_id: context.userId,
    });
    return order;
  });

export const updateServiceOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (i: { id: string; status: "open" | "in_progress" | "completed" | "cancelled" }) => i,
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "completed") patch.completed_at = new Date().toISOString();
    const { data: row, error } = await context.supabase
      .from("service_orders")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      action: `OS ${row.number} → ${data.status}`,
      entity: "service_orders",
      entity_id: row.id,
      user_id: context.userId,
    });
    return row;
  });

// ---------- Relatórios ----------
export const serviceReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { from?: string; to?: string }) => i)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("service_orders")
      .select(
        "id,number,status,total,opened_at,completed_at,assignee_id,assignee:profiles!service_orders_assignee_id_fkey(full_name,email),items:service_order_items(subtotal,service:service_catalog(name))",
      );
    if (data.from) q = q.gte("opened_at", data.from);
    if (data.to) q = q.lte("opened_at", data.to);
    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);

    const byStatus: Record<string, { count: number; total: number }> = {};
    const byAssignee: Record<string, { name: string; count: number; total: number }> = {};
    const byService: Record<string, { name: string; total: number }> = {};

    for (const o of orders ?? []) {
      const st = o.status as string;
      byStatus[st] = byStatus[st] || { count: 0, total: 0 };
      byStatus[st].count += 1;
      byStatus[st].total += Number(o.total ?? 0);

      const aname =
        (o.assignee as { full_name?: string; email?: string } | null)?.full_name ||
        (o.assignee as { email?: string } | null)?.email ||
        "Sem responsável";
      const akey = String(o.assignee_id ?? "none");
      byAssignee[akey] = byAssignee[akey] || { name: aname, count: 0, total: 0 };
      byAssignee[akey].count += 1;
      byAssignee[akey].total += Number(o.total ?? 0);

      for (const it of (o.items as { subtotal: number; service: { name: string } | null }[]) ?? []) {
        const sname = it.service?.name || "Avulso";
        byService[sname] = byService[sname] || { name: sname, total: 0 };
        byService[sname].total += Number(it.subtotal ?? 0);
      }
    }

    return { byStatus, byAssignee, byService, total: orders?.length ?? 0 };
  });

// ---------- Widget dashboard ----------
export const serviceOrdersSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const startMonth = new Date();
    startMonth.setDate(1);
    startMonth.setHours(0, 0, 0, 0);
    const [open, inProg, doneMonth, overdue] = await Promise.all([
      context.supabase
        .from("service_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
      context.supabase
        .from("service_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress"),
      context.supabase
        .from("service_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", startMonth.toISOString()),
      context.supabase
        .from("service_orders")
        .select("id", { count: "exact", head: true })
        .lt("due_at", new Date().toISOString())
        .in("status", ["open", "in_progress"]),
    ]);
    return {
      open: open.count ?? 0,
      inProgress: inProg.count ?? 0,
      completedMonth: doneMonth.count ?? 0,
      overdue: overdue.count ?? 0,
    };
  });
