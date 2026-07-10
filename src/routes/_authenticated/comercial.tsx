import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { MODULE_META } from "@/lib/nav";

const M = MODULE_META.comercial;

export const Route = createFileRoute("/_authenticated/comercial")({
  head: () => ({ meta: [{ title: `${M.title} — Nexus` }] }),
  component: () => (
    <div>
      <PageHeader title={M.title} description={M.description} />
      <ComingSoon
        icon={M.icon}
        title={`Módulo ${M.title}`}
        description={M.description}
        points={["Pipeline de vendas", "Propostas comerciais", "Clientes e leads", "Metas e comissões"]}
      />
    </div>
  ),
});
