import { createServerFn } from "@tanstack/react-start";

/**
 * DEV ONLY: garante um tenant "demo" com dois usuários de teste,
 * plano base e dados semeados para exploração.
 */
export const ensureDevAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1. Ensure demo tenant
  let tenantId: string;
  const { data: existingTenant } = await supabaseAdmin
    .from("tenants")
    .select("id, owner_id")
    .eq("slug", "demo")
    .maybeSingle();

  const seedUser = async (
    email: string,
    password: string,
    fullName: string,
    jobTitle: string,
  ) => {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => u.email === email);
    let userId = existing?.id;
    if (!existing) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (error) {
        console.error("[bootstrap] createUser", email, error);
        return null;
      }
      userId = data.user?.id;
    }
    if (!userId) return null;
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
      job_title: jobTitle,
      status: "active",
    });
    return userId;
  };

  const adminId = await seedUser("admin@admin.com", "admin123", "Administrador", "Administrador");
  const userId = await seedUser("user@user.com", "user123", "Usuário", "Colaborador");
  if (!adminId || !userId) return { ok: false };

  if (existingTenant) {
    tenantId = existingTenant.id;
  } else {
    const { data: t, error } = await supabaseAdmin
      .from("tenants")
      .insert({ slug: "demo", name: "Empresa Demo", owner_id: adminId })
      .select("id")
      .single();
    if (error || !t) {
      console.error("[bootstrap] create tenant", error);
      return { ok: false };
    }
    tenantId = t.id;
    await supabaseAdmin
      .from("subscriptions")
      .insert({ tenant_id: tenantId, plan_id: "base", seats: 3 });
  }

  // 2. Ensure memberships
  await supabaseAdmin
    .from("tenant_members")
    .upsert(
      [
        { tenant_id: tenantId, user_id: adminId, role: "owner" },
        { tenant_id: tenantId, user_id: userId, role: "member" },
      ],
      { onConflict: "tenant_id,user_id" },
    );

  // 3. Ensure roles (tenant-scoped)
  await supabaseAdmin
    .from("user_roles")
    .upsert(
      [
        { tenant_id: tenantId, user_id: adminId, role: "admin" },
        { tenant_id: tenantId, user_id: userId, role: "member" },
      ],
      { onConflict: "user_id,role" },
    );

  // 4. Seed demo data (only if empty)
  const { count: prodCount } = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if ((prodCount ?? 0) === 0) {
    // Categories
    const { data: cats } = await supabaseAdmin
      .from("product_categories")
      .insert([
        { tenant_id: tenantId, name: "Insumos", color: "#6366f1" },
        { tenant_id: tenantId, name: "Acabamento", color: "#22c55e" },
        { tenant_id: tenantId, name: "Ferramentas", color: "#f59e0b" },
        { tenant_id: tenantId, name: "EPI", color: "#ef4444" },
      ])
      .select("id, name");
    const catMap = new Map((cats ?? []).map((c) => [c.name, c.id]));
    await supabaseAdmin.from("products").insert([
      { tenant_id: tenantId, name: "Cimento CP-II 50kg", sku: "CIM-001", unit: "sc", cost_price: 32, sale_price: 45, stock_quantity: 120, min_stock: 20, category_id: catMap.get("Insumos") },
      { tenant_id: tenantId, name: "Areia média m³", sku: "ARE-002", unit: "m³", cost_price: 90, sale_price: 130, stock_quantity: 15, min_stock: 5, category_id: catMap.get("Insumos") },
      { tenant_id: tenantId, name: "Tinta acrílica 18L", sku: "TIN-018", unit: "gl", cost_price: 220, sale_price: 340, stock_quantity: 8, min_stock: 4, category_id: catMap.get("Acabamento") },
      { tenant_id: tenantId, name: "Furadeira 700W", sku: "FUR-700", unit: "un", cost_price: 380, sale_price: 590, stock_quantity: 4, min_stock: 2, category_id: catMap.get("Ferramentas") },
      { tenant_id: tenantId, name: "Capacete de segurança", sku: "EPI-CAP", unit: "un", cost_price: 25, sale_price: 45, stock_quantity: 60, min_stock: 10, category_id: catMap.get("EPI") },
    ]);

    // Services catalog
    await supabaseAdmin.from("service_catalog").insert([
      { tenant_id: tenantId, name: "Instalação padrão", base_price: 250, duration_minutes: 90, active: true, created_by: adminId },
      { tenant_id: tenantId, name: "Manutenção preventiva", base_price: 180, duration_minutes: 60, active: true, created_by: adminId },
      { tenant_id: tenantId, name: "Diagnóstico técnico", base_price: 120, duration_minutes: 45, active: true, created_by: adminId },
    ]);

    // Clients
    await supabaseAdmin.from("service_clients").insert([
      { tenant_id: tenantId, name: "Construtora Andrade", email: "contato@andrade.com", phone: "(11) 99999-0001", created_by: adminId },
      { tenant_id: tenantId, name: "Loja Central", email: "compras@central.com", phone: "(11) 99999-0002", created_by: adminId },
    ]);
  }

  return { ok: true, tenantId };
});
