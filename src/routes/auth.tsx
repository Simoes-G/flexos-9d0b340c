import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { ensureDevAdmin } from "@/lib/admin-bootstrap.functions";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Nexus" },
      { name: "description", content: "Acesse sua conta Nexus para gerenciar sua empresa." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(ensureDevAdmin);
  const [email, setEmail] = useState("user@user.com");
  const [password, setPassword] = useState("user123");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await bootstrap({});
      } catch (e) {
        console.error("bootstrap admin", e);
      } finally {
        setBootstrapping(false);
      }
      const { data } = await supabase.auth.getUser();
      if (data.user) navigate({ to: "/dashboard", replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada. Você já pode entrar.");
        setMode("sign-in");
        setLoading(false);
        return;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground">
        <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-accent">
            <Sparkles className="h-5 w-5 text-sidebar-accent-foreground" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">Nexus</div>
            <div className="text-xs text-sidebar-muted">Plataforma de Gestão</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Uma plataforma. <br />
            <span className="text-primary">Toda a sua operação.</span>
          </h1>
          <p className="mt-4 text-sm text-sidebar-muted">
            Comercial, Financeiro, Estoque, Projetos, Equipes e Integrações — em uma experiência
            unificada, moderna e pronta para escalar com o seu negócio.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { k: "Módulos", v: "8+" },
              { k: "Uptime", v: "99.9%" },
              { k: "Setup", v: "Zero" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3">
                <div className="text-xl font-semibold">{s.v}</div>
                <div className="text-[11px] text-sidebar-muted">{s.k}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-sidebar-muted">
          © {new Date().getFullYear()} Nexus. Todos os direitos reservados.
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-lg font-semibold">Nexus</div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {mode === "sign-in" ? "Entrar na plataforma" : "Criar sua conta"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "sign-in"
                ? "Acesse o painel de gestão da sua empresa."
                : "Comece agora a organizar sua operação."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || bootstrapping}>
              {(loading || bootstrapping) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "sign-in" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "sign-in" ? (
              <>
                Não tem conta?{" "}
                <button
                  className="font-medium text-foreground hover:text-primary"
                  onClick={() => setMode("sign-up")}
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  className="font-medium text-foreground hover:text-primary"
                  onClick={() => setMode("sign-in")}
                >
                  Entrar
                </button>
              </>
            )}
          </div>

          <div className="mt-8 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Acesso de demonstração</div>
            <div className="mt-1">
              Use <span className="font-mono">user@user.com</span> /{" "}
              <span className="font-mono">user123</span> para explorar a plataforma em modo leitura.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
