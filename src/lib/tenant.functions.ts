import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Resolve the caller's primary tenant id (first membership). */
export async function resolveTenantId(supabaseClient: {
  from: (t: string) => {
    select: (s: string) => {
      eq: (col: string, val: string) => {
        limit: (n: number) => {
          maybeSingle: () => Promise<{ data: { tenant_id: string } | null; error: unknown }>;
        };
      };
    };
  };
}, userId: string) {
  const { data } = await supabaseClient
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return data?.tenant_id ?? null;
}

export const getMyTenant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: mem } = await context.supabase
      .from("tenant_members")
      .select("tenant_id, role, tenant:tenants(id,name,slug,owner_id,status)")
      .eq("user_id", context.userId)
      .limit(1)
      .maybeSingle();
    if (!mem) return null;
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("tenant_id", mem.tenant_id)
      .maybeSingle();
    return { membership: mem, subscription: sub };
  });

export const createTenantForMe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { name: string; slug: string; planId?: string }) => i)
  .handler(async ({ data, context }) => {
    const slug = data.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    if (!slug) throw new Error("Slug inválido");
    // Ensure slug is unique
    const { data: existing } = await context.supabase
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) throw new Error("Este subdomínio já está em uso");

    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .insert({ name: data.name, slug, owner_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await context.supabase
      .from("tenant_members")
      .insert({ tenant_id: tenant.id, user_id: context.userId, role: "owner" });

    await context.supabase
      .from("subscriptions")
      .insert({ tenant_id: tenant.id, plan_id: data.planId ?? "base", seats: 3 });

    return tenant;
  });
