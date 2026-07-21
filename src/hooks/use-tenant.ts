import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentTenant() {
  const { data } = useQuery({
    queryKey: ["current-tenant"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: mem } = await supabase
        .from("tenant_members")
        .select("tenant_id, role, tenant:tenants(id, name, slug, owner_id)")
        .eq("user_id", u.user.id)
        .limit(1)
        .maybeSingle();
      if (!mem) return null;
      return {
        tenantId: mem.tenant_id as string,
        role: mem.role as string,
        tenant: mem.tenant as { id: string; name: string; slug: string; owner_id: string } | null,
      };
    },
    staleTime: Infinity,
  });
  return data ?? null;
}

export function useCurrentTenantId() {
  return useCurrentTenant()?.tenantId ?? null;
}
