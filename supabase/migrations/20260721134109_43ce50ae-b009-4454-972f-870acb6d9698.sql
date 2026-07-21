
-- 1. Tenancy tables
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenant_members TO service_role;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  base_price_cents int NOT NULL,
  base_seats int NOT NULL,
  extra_seat_price_cents int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY plans_public_read ON public.plans FOR SELECT USING (true);

INSERT INTO public.plans (id, name, base_price_cents, base_seats, extra_seat_price_cents)
VALUES ('base','Nexus Base',7900,3,3000);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.plans(id),
  seats int NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Helpers
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user uuid, _tenant uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = _user AND tenant_id = _tenant);
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user uuid, _tenant uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = _user AND tenant_id = _tenant AND role IN ('owner','admin'));
$$;

GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid, uuid) TO authenticated;

-- Policies for tenancy tables
CREATE POLICY tenants_member_read ON public.tenants FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), id));
CREATE POLICY tenants_signup_insert ON public.tenants FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());
CREATE POLICY tenants_owner_update ON public.tenants FOR UPDATE TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY tenants_owner_delete ON public.tenants FOR DELETE TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY tm_self_read ON public.tenant_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY tm_self_signup ON public.tenant_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY tm_admin_update ON public.tenant_members FOR UPDATE TO authenticated
USING (public.is_tenant_admin(auth.uid(), tenant_id))
WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY tm_admin_delete ON public.tenant_members FOR DELETE TO authenticated
USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY subs_member_read ON public.subscriptions FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY subs_admin_write ON public.subscriptions FOR ALL TO authenticated
USING (public.is_tenant_admin(auth.uid(), tenant_id))
WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

-- 3. Wipe old demo data (will be re-seeded under a demo tenant by bootstrap)
TRUNCATE TABLE
  public.service_order_items,
  public.service_orders,
  public.service_clients,
  public.service_catalog,
  public.stock_movements,
  public.products,
  public.product_categories,
  public.event_participants,
  public.events,
  public.files,
  public.notifications,
  public.integrations,
  public.audit_log,
  public.permissions,
  public.team_members,
  public.teams,
  public.company,
  public.user_roles
RESTART IDENTITY CASCADE;

-- 4. Add tenant_id to all module tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'audit_log','company','event_participants','events','files','integrations','notifications',
    'permissions','product_categories','products','service_catalog','service_clients',
    'service_order_items','service_orders','stock_movements','team_members','teams','user_roles'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE', t);
    EXECUTE format('CREATE INDEX %I ON public.%I (tenant_id)', t||'_tenant_idx', t);
  END LOOP;
END $$;

-- 5. Replace RLS on all tenant-scoped tables
DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'audit_log','company','event_participants','events','files','integrations','notifications',
    'permissions','product_categories','products','service_catalog','service_clients',
    'service_order_items','service_orders','stock_movements','team_members','teams','user_roles'
  ]) LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id))', t||'_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id))', t||'_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id))', t||'_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id))', t||'_delete', t);
  END LOOP;
END $$;
