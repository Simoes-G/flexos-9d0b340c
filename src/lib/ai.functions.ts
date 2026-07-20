import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const nexusChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: ChatMessage[] }) => input)
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const { supabase, userId } = context;

    // Coletar contexto compacto para o assistente
    const [
      { count: prodCount },
      { data: lowStock },
      { data: upcomingEvents },
      { count: osOpen },
      { count: osInProgress },
      { data: osOverdue },
    ] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("name,stock_quantity,min_stock,unit")
        .filter("stock_quantity", "lte", 10)
        .limit(5),
      supabase
        .from("events")
        .select("title,start_at,location")
        .gte("start_at", new Date().toISOString())
        .order("start_at")
        .limit(5),
      supabase.from("service_orders").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase
        .from("service_orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress"),
      supabase
        .from("service_orders")
        .select("number,due_at,status")
        .lt("due_at", new Date().toISOString())
        .in("status", ["open", "in_progress"])
        .limit(5),
    ]);

    const systemContext = [
      "Você é o assistente da plataforma Nexus (gestão empresarial). Responda em português do Brasil, de forma direta e útil.",
      `Usuário atual: ${userId}.`,
      `Total de produtos cadastrados: ${prodCount ?? 0}.`,
      lowStock && lowStock.length
        ? `Produtos com estoque baixo: ${lowStock.map((p: any) => `${p.name} (${p.stock_quantity}${p.unit})`).join(", ")}.`
        : "Nenhum produto com estoque crítico.",
      upcomingEvents && upcomingEvents.length
        ? `Próximos eventos: ${upcomingEvents.map((e: any) => `${e.title} em ${new Date(e.start_at).toLocaleString("pt-BR")}`).join("; ")}.`
        : "Sem eventos próximos.",
      `Ordens de Serviço: ${osOpen ?? 0} abertas, ${osInProgress ?? 0} em execução.`,
      osOverdue && osOverdue.length
        ? `OS atrasadas: ${osOverdue.map((o: any) => o.number).join(", ")}.`
        : "Nenhuma OS atrasada.",
    ].join("\n");

    const messages: ChatMessage[] = [
      { role: "system", content: systemContext },
      ...data.messages.slice(-10),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`AI gateway [${res.status}]: ${body}`);
    }

    const json = await res.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "Sem resposta.";
    return { reply };
  });
