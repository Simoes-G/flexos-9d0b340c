import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createTenantForMe } from "@/lib/tenant.functions";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Criar conta — Nexus" },
      { name: "description", content: "Crie sua conta Nexus e comece a organizar sua operação em minutos." },
    ],
  }),
  component: SignupPage,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function SignupPage() {
  const navigate = useNavigate();
  const createTenant = useServerFn(createTenantForMe);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    company: "",
    slug: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalSlug = form.slug || slugify(form.company);
      if (!finalSlug) throw new Error("Informe um subdomínio válido");

      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: form.fullName },
        },
      });
      if (error) throw error;

      // Ensure signed in (auto-confirm is expected in dev)
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        const { error: e2 } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (e2) throw e2;
      }

      await createTenant({ data: { name: form.company, slug: finalSlug, planId: "base" } });

      toast.success("Conta criada!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Nexus</span>
          </Link>
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            Já tenho conta
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Passo {step} de 2
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {step === 1 ? "Comece agora" : "Sua empresa na Nexus"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {step === 1
              ? "Crie sua conta em segundos. Sem cartão de crédito."
              : "Escolha um nome e um subdomínio para o seu espaço."}
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {["Todos os módulos ativos", "Subdomínio dedicado", "IA embarcada", "3 administradores inclusos"].map((b) => (
              <li key={b} className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary" /> {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          <form onSubmit={submit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Seu nome</Label>
                  <Input id="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    if (!form.fullName || !form.email || form.password.length < 6) {
                      toast.error("Preencha os campos corretamente");
                      return;
                    }
                    setStep(2);
                  }}
                >
                  Continuar
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="company">Nome da empresa</Label>
                  <Input
                    id="company"
                    required
                    value={form.company}
                    onChange={(e) => {
                      const company = e.target.value;
                      setForm({ ...form, company, slug: form.slug || slugify(company) });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">Subdomínio</Label>
                  <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                    <Input
                      id="slug"
                      required
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                      className="border-0 focus-visible:ring-0"
                    />
                    <span className="px-3 text-xs text-muted-foreground">.nexus.app</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Este será o endereço exclusivo do seu espaço.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading}>
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
