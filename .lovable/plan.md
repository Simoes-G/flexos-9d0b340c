
# Próxima entrega — Módulo Serviços (Ordens de Serviço)

Escopo enxuto e focado: um núcleo de OS funcional + três complementos leves conectados a ele.

## 1. Núcleo — Ordens de Serviço

Ativar `/servicos` (hoje "Em breve") com:

- **Catálogo de serviços**: nome, descrição, preço base, duração estimada, ativo/inativo.
- **Clientes**: cadastro leve (nome, documento, e-mail, telefone) — reaproveitável quando o CRM chegar.
- **Ordens de Serviço**:
  - Número sequencial, cliente, serviço(s), responsável (usuário), status (Aberta → Em execução → Concluída / Cancelada), datas de abertura/prevista/conclusão, valor total, observações.
  - Itens da OS (serviço + quantidade + valor) para permitir mais de um serviço por OS.
  - Histórico simples (mudanças de status registradas em `audit_log`).
- **Visualização**: lista com filtros (status, cliente, período) + tela de detalhe da OS.
- **Widget no Dashboard**: OS abertas, em execução e concluídas no mês.

## 2. Complementos

### A. Relatórios + exportação CSV (`/relatorios`)
- Ativar a página, hoje placeholder.
- Três relatórios iniciais, todos filtráveis por período:
  1. OS por status
  2. OS por responsável
  3. Faturamento por serviço
- Botão "Exportar CSV" em cada relatório (gerado no cliente a partir dos dados carregados).

### B. E-mail transacional (Resend)
- Conectar Resend via connector padrão.
- Dois gatilhos automáticos:
  1. OS criada → e-mail para o cliente com resumo.
  2. OS concluída → e-mail para o cliente com valor final.
- Template React Email simples reaproveitando as cores do design system.
- Envio via server function chamada pelas mutações de OS.

### C. IA aplicada ao módulo
Estender o assistente existente (`ai-assistant.tsx`) com contexto de OS:
- Passar para o prompt: OS abertas, atrasadas (prazo vencido) e concluídas na semana.
- Duas ações rápidas no painel do assistente:
  - "Resumir minhas OS do dia"
  - "Sugerir próximas ações" (prioriza atrasadas e clientes recorrentes)

## 3. Alterações técnicas

### Banco (uma migration)
Novas tabelas em `public`:
- `service_catalog` (nome, descrição, preço, duração, ativo)
- `service_clients` (nome, documento, contato)
- `service_orders` (numero, cliente, responsável, status, datas, total, notas)
- `service_order_items` (order_id, service_id, quantidade, valor)

Cada tabela: `GRANT` para `authenticated`/`service_role`, RLS ativa, políticas:
- Leitura: todos autenticados.
- Escrita: admin/manager, ou responsável na própria OS.
- Trigger de `updated_at` e trigger para gerar `numero` sequencial por ano.

### Código
- `src/routes/_authenticated/servicos.tsx`: substitui o placeholder pela UI completa (lista + detalhe em drawer/modal).
- `src/routes/_authenticated/relatorios.tsx`: substitui placeholder pelos três relatórios + CSV.
- `src/lib/services.functions.ts`: server fns (list/create/update/complete OS, list reports).
- `src/lib/email/service-order.tsx`: templates React Email + envio via Resend gateway.
- `src/lib/ai.functions.ts`: ampliar contexto do assistente com dados de OS.
- `src/components/ai-assistant.tsx`: adicionar chips de ações rápidas.
- `src/components/app-shell.tsx` / `src/lib/nav.ts`: garantir "Serviços" e "Relatórios" ativos (removendo do "em breve").
- Dashboard: card com contadores de OS.

### Integração externa
- Conector padrão **Resend** via `standard_connectors--connect`.
- Domínio de envio: usar `onboarding@resend.dev` inicialmente (aviso de que envio real exige domínio verificado); trocar depois via variável.

## 4. Fora deste escopo

- Google Calendar (fica para próxima iteração, schema já preparado).
- CRM completo / Financeiro / Estoque avançado.
- Pagamentos, assinaturas de OS, PDF de OS.
- Dashboard personalizável / modo escuro por empresa.

## 5. Ordem de execução

1. Migration (tabelas + RLS + trigger de numeração).
2. Server functions de OS e relatórios.
3. UI de `/servicos` e `/relatorios`.
4. Widget de OS no Dashboard.
5. Conector Resend + templates + gatilhos.
6. Extensão do assistente de IA.

Confirmando, sigo direto para a migration.
