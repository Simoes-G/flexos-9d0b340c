import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function ComingSoon({
  icon: Icon = Sparkles,
  title,
  description,
  points = [],
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  points?: string[];
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Estrutura preparada
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {points.length > 0 && (
        <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((p) => (
            <div
              key={p}
              className="rounded-lg border border-border bg-background/60 p-4 text-sm text-foreground/90"
            >
              <div className="mb-1.5 h-1 w-6 rounded-full bg-primary/60" />
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
