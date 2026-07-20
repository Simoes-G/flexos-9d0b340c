import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, Download } from "lucide-react";
import { serviceReports } from "@/lib/services.functions";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Nexus" }] }),
  component: RelatoriosPage,
});

const STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  in_progress: "Em execução",
  completed: "Concluída",
  cancelled: "Cancelada",
};

function fmtMoney(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell ?? "");
          return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(";"),
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function RelatoriosPage() {
  const reportsFn = useServerFn(serviceReports);
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [from, setFrom] = useState(firstOfMonth.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["service-reports", from, to],
    queryFn: () =>
      reportsFn({
        data: {
          from: from ? new Date(from).toISOString() : undefined,
          to: to ? new Date(to + "T23:59:59").toISOString() : undefined,
        },
      }),
  });

  const byStatus = Object.entries(data?.byStatus ?? {}).map(([k, v]) => ({
    key: k,
    label: STATUS_LABELS[k] ?? k,
    ...v,
  }));
  const byAssignee = Object.values(data?.byAssignee ?? {});
  const byService = Object.values(data?.byService ?? {}).sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageHeader title="Relatórios" description="Análises de ordens de serviço." icon={BarChart3} />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="mb-1 block text-xs font-medium">De</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Até</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          Atualizar
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          Total de OS no período: <strong className="text-foreground">{data?.total ?? 0}</strong>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportCard
          title="OS por status"
          onExport={() =>
            downloadCSV(
              `os-por-status-${from}-${to}.csv`,
              [["Status", "Quantidade", "Total"], ...byStatus.map((r) => [r.label, r.count, r.total])],
            )
          }
        >
          <SimpleTable
            headers={["Status", "Qtde", "Total"]}
            rows={byStatus.map((r) => [r.label, r.count, fmtMoney(r.total)])}
          />
        </ReportCard>

        <ReportCard
          title="OS por responsável"
          onExport={() =>
            downloadCSV(
              `os-por-responsavel-${from}-${to}.csv`,
              [
                ["Responsável", "Quantidade", "Total"],
                ...byAssignee.map((r) => [r.name, r.count, r.total]),
              ],
            )
          }
        >
          <SimpleTable
            headers={["Responsável", "Qtde", "Total"]}
            rows={byAssignee.map((r) => [r.name, r.count, fmtMoney(r.total)])}
          />
        </ReportCard>

        <ReportCard
          title="Faturamento por serviço"
          onExport={() =>
            downloadCSV(
              `faturamento-por-servico-${from}-${to}.csv`,
              [["Serviço", "Total"], ...byService.map((r) => [r.name, r.total])],
            )
          }
        >
          <SimpleTable
            headers={["Serviço", "Total"]}
            rows={byService.map((r) => [r.name, fmtMoney(r.total)])}
          />
        </ReportCard>
      </div>
    </div>
  );
}

function ReportCard({
  title,
  children,
  onExport,
}: {
  title: string;
  children: React.ReactNode;
  onExport: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button size="sm" variant="ghost" onClick={onExport}>
          <Download className="mr-1 h-3.5 w-3.5" /> CSV
        </Button>
      </div>
      {children}
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            {headers.map((h, i) => (
              <th
                key={h}
                className={`px-3 py-2 ${i === 0 ? "text-left" : "text-right"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-6 text-center text-muted-foreground">
                Sem dados no período.
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "text-left" : "text-right"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
