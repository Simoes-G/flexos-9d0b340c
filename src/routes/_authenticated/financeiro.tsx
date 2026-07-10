import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
import { MODULE_META } from "@/lib/nav";

const M = MODULE_META.financeiro;

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({ meta: [{ title: `${M.title} — Nexus` }] }),
  component: () => (
    <div>
      <PageHeader title={M.title} description={M.description} />
      <ComingSoon
        icon={M.icon}
        title={`Módulo ${M.title}`}
        description={M.description}
        points={["Contas a pagar/receber", "Fluxo de caixa", "DRE", "Conciliação bancária"]}
      />
    </div>
  ),
});
