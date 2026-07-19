import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, MapPin, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Nexus" }] }),
  component: AgendaPage,
});

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  color: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  created_by: string | null;
  google_event_id: string | null;
};

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function toInputDT(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AgendaPage() {
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(new Date());

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  const { data: events = [] } = useQuery({
    queryKey: ["events", cursor.getFullYear(), cursor.getMonth()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_at", monthStart.toISOString())
        .lte("start_at", monthEnd.toISOString())
        .order("start_at");
      if (error) throw error;
      return (data ?? []) as Event[];
    },
  });

  const grid = useMemo(() => {
    const first = new Date(monthStart);
    first.setDate(first.getDate() - first.getDay());
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      days.push(d);
    }
    return days;
  }, [monthStart]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const ev of events) {
      const d = new Date(ev.start_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  const upcoming = useMemo(
    () => events.filter((e) => new Date(e.end_at) >= new Date()).slice(0, 6),
    [events],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["events"] });

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Compromissos, reuniões e eventos da equipe."
        actions={<EventDialog onDone={invalidate} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </div>
              <div className="text-xs text-muted-foreground">
                {events.length} evento{events.length === 1 ? "" : "s"} neste mês
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
            {DAYS.map((d) => (
              <div key={d} className="bg-muted/60 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {d}
              </div>
            ))}
            {grid.map((d, i) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              const dayEvents = eventsByDay.get(key) ?? [];
              const today = new Date();
              const isToday =
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear();
              return (
                <div
                  key={i}
                  className={`min-h-[92px] bg-card p-1.5 ${!inMonth ? "opacity-40" : ""}`}
                >
                  <div
                    className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday ? "bg-primary text-primary-foreground font-semibold" : "text-foreground"
                    }`}
                  >
                    {d.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="truncate rounded px-1.5 py-0.5 text-[11px] font-medium"
                        style={{
                          backgroundColor: (ev.color ?? "#6366f1") + "22",
                          color: ev.color ?? "#6366f1",
                        }}
                        title={ev.title}
                      >
                        {ev.all_day
                          ? ev.title
                          : `${new Date(ev.start_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ${ev.title}`}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <div className="text-sm font-semibold">Próximos</div>
            </div>
            <div className="space-y-2">
              {upcoming.length === 0 && (
                <p className="text-xs text-muted-foreground">Sem eventos futuros neste mês.</p>
              )}
              {upcoming.map((ev) => (
                <div
                  key={ev.id}
                  className="group flex items-start gap-2 rounded-md border border-border p-2"
                >
                  <div
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: ev.color ?? "#6366f1" }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-medium">{ev.title}</div>
                      {ev.google_event_id && (
                        <Badge variant="secondary" className="h-4 px-1 text-[9px]">Google</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(ev.start_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {ev.location}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={async () => {
                      if (!confirm(`Excluir "${ev.title}"?`)) return;
                      const { error } = await supabase.from("events").delete().eq("id", ev.id);
                      if (error) toast.error(error.message);
                      else {
                        toast.success("Evento excluído");
                        invalidate();
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-card/50 p-4">
            <div className="mb-1 text-sm font-semibold">Google Calendar</div>
            <p className="text-xs text-muted-foreground">
              Sincronize com sua conta Google acessando{" "}
              <a href="/integrations" className="text-primary underline">Integrações</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const later = new Date(now.getTime() + 60 * 60 * 1000);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    color: "#6366f1",
    start_at: toInputDT(now),
    end_at: toInputDT(later),
    all_day: false,
  });

  const save = async () => {
    if (!form.title.trim()) return toast.error("Informe o título");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      color: form.color,
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      all_day: form.all_day,
      created_by: u.user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Evento criado");
    setOpen(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Novo evento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo evento</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Local</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Cor</Label>
            <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-24" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
