
-- Catálogo de serviços
CREATE TABLE public.service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_catalog TO authenticated;
GRANT ALL ON public.service_catalog TO service_role;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sc_select" ON public.service_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "sc_write" ON public.service_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Clientes de serviços
CREATE TABLE public.service_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_clients TO authenticated;
GRANT ALL ON public.service_clients TO service_role;
ALTER TABLE public.service_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scl_select" ON public.service_clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "scl_write" ON public.service_clients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Ordens de serviço
CREATE TYPE public.service_order_status AS ENUM ('open','in_progress','completed','cancelled');

CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT UNIQUE,
  client_id UUID REFERENCES public.service_clients(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.service_order_status NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "so_select" ON public.service_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "so_insert" ON public.service_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "so_update" ON public.service_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR assignee_id = auth.uid() OR created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR assignee_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "so_delete" ON public.service_orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Itens da OS
CREATE TABLE public.service_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.service_catalog(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_order_items TO authenticated;
GRANT ALL ON public.service_order_items TO service_role;
ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soi_select" ON public.service_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "soi_write" ON public.service_order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_orders o WHERE o.id = order_id AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')
    OR o.assignee_id = auth.uid() OR o.created_by = auth.uid()
  )))
  WITH CHECK (EXISTS (SELECT 1 FROM public.service_orders o WHERE o.id = order_id AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager')
    OR o.assignee_id = auth.uid() OR o.created_by = auth.uid()
  )));

-- Triggers de updated_at
CREATE TRIGGER trg_sc_updated BEFORE UPDATE ON public.service_catalog FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_scl_updated BEFORE UPDATE ON public.service_clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_so_updated BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Numeração sequencial anual OS-YYYY-NNNN
CREATE OR REPLACE FUNCTION public.generate_service_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  yr TEXT := to_char(now(),'YYYY');
  seq INT;
BEGIN
  IF NEW.number IS NOT NULL AND NEW.number <> '' THEN RETURN NEW; END IF;
  SELECT COALESCE(MAX(NULLIF(regexp_replace(number, '^OS-\d{4}-', ''), '')::INT), 0) + 1
    INTO seq
    FROM public.service_orders
    WHERE number LIKE 'OS-' || yr || '-%';
  NEW.number := 'OS-' || yr || '-' || lpad(seq::TEXT, 4, '0');
  RETURN NEW;
END;$$;

CREATE TRIGGER trg_so_number BEFORE INSERT ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_service_order_number();

-- Recalcular total da OS a partir dos itens
CREATE OR REPLACE FUNCTION public.recalc_service_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  oid UUID;
BEGIN
  oid := COALESCE(NEW.order_id, OLD.order_id);
  UPDATE public.service_orders
    SET total = COALESCE((SELECT SUM(subtotal) FROM public.service_order_items WHERE order_id = oid), 0)
    WHERE id = oid;
  RETURN NULL;
END;$$;

CREATE TRIGGER trg_soi_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.service_order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalc_service_order_total();

-- Indexes úteis
CREATE INDEX idx_so_status ON public.service_orders(status);
CREATE INDEX idx_so_client ON public.service_orders(client_id);
CREATE INDEX idx_so_assignee ON public.service_orders(assignee_id);
CREATE INDEX idx_soi_order ON public.service_order_items(order_id);
