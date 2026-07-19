import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV, PROFILE_ITEM } from "@/lib/nav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, CalendarDays, LogOut } from "lucide-react";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["cmdk-products", query],
    enabled: open && query.length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,sku")
        .ilike("name", `%${query}%`)
        .limit(6);
      return data ?? [];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["cmdk-events", query],
    enabled: open && query.length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title,start_at")
        .ilike("title", `%${query}%`)
        .limit(6);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  const signOut = async () => {
    onOpenChange(false);
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar páginas, produtos, eventos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>

        {products.length > 0 && (
          <>
            <CommandGroup heading="Produtos">
              {products.map((p) => (
                <CommandItem key={p.id} value={`prod-${p.name}`} onSelect={() => go("/estoque")}>
                  <Package className="mr-2 h-4 w-4 text-primary" />
                  <span>{p.name}</span>
                  {p.sku && (
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{p.sku}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {events.length > 0 && (
          <>
            <CommandGroup heading="Eventos">
              {events.map((ev) => (
                <CommandItem key={ev.id} value={`ev-${ev.title}`} onSelect={() => go("/agenda")}>
                  <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                  <span>{ev.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(ev.start_at).toLocaleDateString("pt-BR")}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {NAV.map((section) => (
          <CommandGroup key={section.label} heading={section.label}>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.to} value={item.label} onSelect={() => go(item.to)}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                  {item.soon && (
                    <span className="ml-auto text-[10px] uppercase text-muted-foreground">Em breve</span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        <CommandSeparator />
        <CommandGroup heading="Conta">
          <CommandItem value="Meu perfil" onSelect={() => go(PROFILE_ITEM.to)}>
            <PROFILE_ITEM.icon className="mr-2 h-4 w-4" /> Meu perfil
          </CommandItem>
          <CommandItem value="Sair" onSelect={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
